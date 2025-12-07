import { Hono } from "hono";
import { auth } from "./auth";
import { db } from "./db";
import { myTable } from "./schema";

export const api = new Hono();


api.get('/', async (c) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    }) // can also do this in middleware, reject if no session
    
    const result = await db.insert(myTable).values({
        value: "test",
        // jsonField1: { foo: "bar" },
        jsonField2: { foo: "barr" },
    }).returning();
    
    return c.json({ message: `Hello ${session?.user?.name || "Friend"}`, session, result })
});

