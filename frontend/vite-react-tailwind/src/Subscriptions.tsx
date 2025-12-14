// import { useQuery } from '@tanstack/react-query'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import { useState } from "react"

const BASE_URL = 'http://localhost:3000'

// todo: replace fetch with hono client
// maybe replace tanstack-query with tanstack-db

export default function Subscriptions() {
    const queryClient = useQueryClient()
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
    return (
        <div>
            <h2 className="text-2xl font-bold">Subscriptions</h2>
            <button className="my-button-2" onClick={() => {
                api.me.clearAllSubscriptions.$delete()
            }}>
                Clear All Subscriptions
            </button>
            <AddSubscriptionButton />
            {isLoading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}
            <pre>{subscriptions && JSON.stringify(subscriptions, null, 2)}</pre>
            <button className="my-button-2" onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
            }}>
                Invalidate
            </button>
            <CalendarView />
            
        </div>
    )
}
function AddSubscriptionButton() {
    
    const mutation = useMutation({
        mutationFn: async (tmdbId: string) => {
            const res = await api.me.subscribeTmdbShow.$post({
                json: {
                    tmdbId: parseInt(tmdbId),
                }
            })
        }
    })
    
    const [tmdbId, setTmdbId] = useState("")
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        mutation.mutate(tmdbId)
    }
    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="TMDB ID" value={tmdbId} onChange={(e) => setTmdbId(e.target.value)} />
            <button className="my-button-2" type="submit">Add Subscription</button>
            {mutation.isPending && <p className="text-blue-500">Adding subscription...</p>}
            {mutation.isError && <p className="text-red-500">Error: {mutation.error.message}</p>}
            {mutation.isSuccess && <p className="text-green-500">Subscription added successfully</p>}
        </form>
    )
}

function CalendarView() {
    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const res = await api.me.events.$get()
            if (!res.ok) {
                const errorText = await res.text().catch(() => res.statusText)
                throw new Error(`Failed to fetch events: ${res.status} ${errorText}`)
            }
            return res.json()
        }
    })
    const queryClient = useQueryClient()
    if (isLoading) {
        return <p>Loading...</p>
    }
    if (error) {
        return <p>Error: {error.message}</p>
    }
    return (
        <div>
            <h2 className="text-2xl font-bold">Releases Calendar</h2>
            
            <button className="my-button-2" onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['events'] })
            }}>
                Invalidate
            </button>
            <pre>{events && JSON.stringify(events, null, 2)}</pre>
        </div>
    )
}