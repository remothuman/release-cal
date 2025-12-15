import { useState, useMemo } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { api } from "./api"


export function SearchShows({ subscriptions }: { subscriptions: any[] | undefined }){
    const [search, setSearch] = useState("")
    const queryClient = useQueryClient()
    const subscribedTmdbIds = useMemo(() => {
        const ids = new Set<number>()
        if (!subscriptions) return ids
        for (const sub of subscriptions) {
            if (sub?.sourceType === "tmdb") {
                const sourceId = sub.sourceId ? parseInt(sub.sourceId, 10) : NaN
                if (!Number.isNaN(sourceId)) {
                    ids.add(sourceId)
                }
            }
            if (typeof sub?.id === "string" && sub.id.startsWith("tmdb:")) {
                const numericId = parseInt(sub.id.split(":")[1] ?? "", 10)
                if (!Number.isNaN(numericId)) {
                    ids.add(numericId)
                }
            }
        }
        return ids
    }, [subscriptions])
    const { data: shows, isLoading, error } = useQuery({
        queryKey: ['shows', search],
        queryFn: async () => {
            if (!search.trim()) {
                return null;
            }
            const res = await api.searchAvailableChannels.$get({
                query: { search }
            })
            if (!res.ok) {
                const errorText = await res.text().catch(() => res.statusText)
                throw new Error(`Failed to search shows: ${res.status} ${errorText}`)
            }
            return res.json()
        },
        enabled: search.trim().length > 0,
    })

    return (
        <div className="my-4">
            <input 
                type="text" 
                placeholder="Search for TV shows..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded w-full max-w-md"
            />
            {isLoading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            {shows && shows.results && (
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                        Found {shows.total_results} results (page {shows.page} of {shows.total_pages})
                    </p>
                    <div className="space-y-2">
                        {shows.results.map((show) => {
                            const isSubscribed = subscribedTmdbIds.has(show.id)
                            return (
                                <SearchResultItem
                                    key={show.id}
                                    show={show}
                                    isSubscribed={isSubscribed}
                                    onChanged={() => {
                                        queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
                                    }}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

type SearchResultItemProps = {
    show: any
    isSubscribed: boolean
    onChanged: () => void
}

function SearchResultItem({ show, isSubscribed, onChanged }: SearchResultItemProps) {
    const queryClient = useQueryClient()
    const [isHovering, setIsHovering] = useState(false)
    const subscribeMutation = useMutation({
        mutationFn: async () => {
            const res = await api.me.subscribeTmdbShow.$post({
                json: {
                    tmdbId: show.id,
                }
            })
            if (!res.ok) {
                const errorText = await res.text().catch(() => res.statusText)
                throw new Error(`Failed to add subscription: ${res.status} ${errorText}`)
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
            onChanged()
        }
    })
    const unsubscribeMutation = useMutation({
        mutationFn: async () => {
            const res = await api.me.unsubscribeTmdbShow.$delete({
                json: {
                    tmdbId: show.id,
                }
            })
            if (!res.ok) {
                const errorText = await res.text().catch(() => res.statusText)
                throw new Error(`Failed to remove subscription: ${res.status} ${errorText}`)
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
            onChanged()
        }
    })
    const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending
    const handleClick = () => {
        if (isSubscribed) {
            unsubscribeMutation.mutate()
        } else {
            subscribeMutation.mutate()
        }
    }
    const buttonLabel = isSubscribed
        ? (isPending ? "Updating..." : isHovering ? "Unsubscribe" : "Subscribed ✓")
        : isPending ? "Adding..." : "Subscribe"
    const buttonColor = isSubscribed
        ? (isHovering ? "bg-red-600 hover:bg-red-700" : "bg-green-600")
        : "bg-blue-500 hover:bg-blue-600"

    return (
        <div className="border p-3 rounded flex items-center justify-between">
            <div className="flex-1">
                <h3 className="font-semibold">{show.name}</h3>
                {show.first_air_date && (
                    <p className="text-sm text-gray-600">
                        First aired: {show.first_air_date}
                    </p>
                )}
                {/* {show.overview && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {show.overview}
                    </p>
                )} */}
            </div>
            <button
                className={`ml-4 px-4 py-2 rounded text-white ${buttonColor} disabled:bg-gray-400`}
                onClick={handleClick}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                disabled={isPending}
            >
                {buttonLabel}
            </button>
        </div>
    )
}

export function MyChannels(){
    const { data: subscriptions, isLoading, error } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: async () => {
            const res = await api.me.subscriptions.$get()
            if (!res.ok) {
                const errorText = await res.text().catch(() => res.statusText)
                throw new Error(`Failed to fetch subscriptions: ${res.status} ${errorText}`)
            }
            return res.json()
        }
    })
    const queryClient = useQueryClient()
    return (
        <div>
            <h2 className="text-2xl font-bold">My Channels</h2>
            {isLoading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}
            {subscriptions && subscriptions.map((subscription) => {
                let tmdbId: number | null = null
                if (subscription?.sourceType === "tmdb" && subscription?.sourceId) {
                    const parsed = parseInt(subscription.sourceId, 10)
                    tmdbId = Number.isNaN(parsed) ? null : parsed
                } else if (typeof subscription?.id === "string" && subscription.id.startsWith("tmdb:")) {
                    const parsed = parseInt(subscription.id.split(":")[1] ?? "", 10)
                    tmdbId = Number.isNaN(parsed) ? null : parsed
                }
                if (tmdbId === null) {
                    return null
                }
                const name = subscription?.name ?? subscription?.description ?? `TMDB ${tmdbId}`
                const firstAired = subscription?.data?.firstAirDate
                return (
                    <SearchResultItem
                        key={subscription.id ?? tmdbId}
                        show={{ id: tmdbId, name, first_air_date: firstAired }}
                        isSubscribed={true}
                        onChanged={() => {
                            queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
                        }}
                    />
                )
            })}
        </div>
    )
}


// function AddSubscriptionButton() {
    
//     const mutation = useMutation({
//         mutationFn: async (tmdbId: string) => {
//             const res = await api.me.subscribeTmdbShow.$post({
//                 json: {
//                     tmdbId: parseInt(tmdbId),
//                 }
//             })
//             if (!res.ok) {
//                 const errorText = await res.text().catch(() => res.statusText)
//                 throw new Error(`Failed to add subscription: ${res.status} ${errorText}`)
//             }
//             return res.json()
//         }
//     })
    
//     const [tmdbId, setTmdbId] = useState("")
//     function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//         e.preventDefault()
//         mutation.mutate(tmdbId)
//     }
//     return (
//         <form onSubmit={handleSubmit}>
//             <input type="text" placeholder="TMDB ID" value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} />
//             <button className="my-button-2" type="submit">Add Subscription</button>
//             {mutation.isPending && <p className="text-blue-500">Adding subscription...</p>}
//             {mutation.isError && <p className="text-red-500">Error: {mutation.error.message}</p>}
//             {mutation.isSuccess && <p className="text-green-500">Subscription added successfully</p>}
//         </form>
//     )
// }