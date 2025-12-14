import type { AppType } from "../../../backend/src/types"
import { createAuthClient } from "better-auth/react"
import { hc } from "hono/client"
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000"
})

// unfortunately i would have to chain the routes on the backend for typing to work
// may add it
const client = hc<AppType>('http://localhost:3000/', {
    init: {
        credentials: 'include',
    }
})