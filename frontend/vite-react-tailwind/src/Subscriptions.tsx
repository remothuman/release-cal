// import { useQuery } from '@tanstack/react-query'

import { useQuery, useQueryClient } from "@tanstack/react-query"

const BASE_URL = 'http://localhost:3000'

// todo: replace fetch with hono client
// maybe replace tanstack-query with tanstack-db

export default function Subscriptions() {
    const queryClient = useQueryClient()
    const { data: subscriptions, isLoading, error } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => {
            return fetch(`${BASE_URL}/api/me/subscriptions`, {
                credentials: 'include'
            }).then(res => res.json())
            // .then(data => data.data.subscriptions)
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
                fetch(`${BASE_URL}/api/me/subscribeNewSubscription`, {
                    credentials: 'include',
                    method: 'POST',
                    body: JSON.stringify({ 
                        type: 'tv-show', 
                        name: "My Show", 
                        description: "My Show Description", 
                        defaultLink: "https://www.myshow.com", 
                        data: { tmdbId: 123 }
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).catch(err => {
                    console.error(err)
                })
            }}>
                Add Subscription
            </button>
        </div>
    )
}