// import { useQuery } from '@tanstack/react-query'

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"

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
            {isLoading && <p>Loading...</p>}
            {error && <p>Error: {error.message}</p>}
            <pre>{subscriptions && JSON.stringify(subscriptions, null, 2)}</pre>
            <button className="my-button-2" onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
            }}>
                Invalidate
            </button>
            <button className="my-button-2" onClick={() => {
                api.me.subscribeNewSubscription.$post({
                    json: {
                        type: 'tv-show', 
                        name: "My Show", 
                        description: "My Show Description", 
                        sourceId: "123",
                        data: {
                            // tmdbId: 123,
                            hi: "there",
                        }
                    }
                })
            }}>
                Add Subscription
            </button>
        </div>
    )
}
function addSubscription(tmdbId: number) {
    const tmdbData = 
    
    
    fetch(`${BASE_URL}/api/me/subscribeNewSubscription`, {
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({ 
            type: 'tv-show',
        }),
    })
}