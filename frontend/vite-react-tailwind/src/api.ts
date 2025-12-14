import type { AppType } from "../../../backend/src/types"
import { createAuthClient } from "better-auth/react"
import { hc } from "hono/client"
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000"
})


const client = hc<AppType>('http://localhost:3000/', {
    init: {
        credentials: 'include',
    }
})

export const api = client.api
