// import { useQuery } from '@tanstack/react-query'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import { useMemo, useState } from "react"
import { MyChannels, SearchShows } from "./SearchChannels"

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
            {/* <AddSubscriptionButton /> */}
            <SearchShows subscriptions={subscriptions ?? []} />
            <MyChannels />
            <CalendarView />
            
        </div>
    )
}



function CalendarView() {
    const [month, setMonth] = useState( new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const { data: events, isLoading, error } = useQuery({
        queryKey: ['events', month, year],
        queryFn: async () => {
            const res = await api.me.events.$get({
                query: {
                    startDay: `${year}-${month}-01`,
                    endDay: `${year}-${month}-${new Date(year, month + 2, 0).getDate()}`,
                }
                // not right but i got to run
            })
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
            <button className="my-button-2" onClick={() => {
                setMonth(month + 1)
                if (month === 12) {
                    setYear(year + 1)
                    setMonth(1)
                }
            }}>
                Next Month
            </button>
            <button className="my-button-2" onClick={() => {
                setMonth(month - 1)
                if (month === 0) {
                    setYear(year - 1)
                    setMonth(11)
                }
            }}>
                Previous Month
            </button>
            <pre>{events && JSON.stringify(events, null, 2)}</pre>
        </div>
    )
}