import { type Context, Hono } from "hono";
import { auth } from "./auth";
import { db } from "./db";
import { myTable, subscription, subscriptionGroups } from "./schema";
import { eq } from "drizzle-orm";

export const api = new Hono();

api.get("/", async (c) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    }); // can also do this in middleware, reject if no session

    const result = await db
        .insert(myTable)
        .values({
            value: "test",
            // jsonField1: { foo: "bar" },
            jsonField: { foo: "barr" },
        })
        .returning();

    return c.json({
        message: `Hello ${session?.user?.name || "Friend"}`,
        session,
        result,
    });
});

// get so we can test in browser for now
api.get("/:id", async (c) => {
    const { id } = c.req.param();

    const result = await db
        .update(myTable)
        .set({ value: "test2" })
        .where(eq(myTable.id, parseInt(id)))
        .returning();

    return c.json({ message: "updated value", result });
});

async function getSessionData(c: Context, errorOnNoSession: boolean = false) {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (errorOnNoSession && !session) {
        throw new Error("Not logged in");
    }

    return session;
}

api.post("/subscribe", async (c) => {
    const session = await getSessionData(c, true);
    // subscriptions group is userId's group
    const subscriptionGroup = await db
        .select()
        .from(subscriptionGroups)
        .where(eq(subscriptionGroups.id, session!.user.id));
    if (subscriptionGroup.length === 0) {
        // create new subscription group for the user
        const newSubscriptionGroupR = await db.insert(subscriptionGroups).values({
            id: session!.user.id,
            data: {
                subscriptions: [],
            },
        }).returning();
    }
    
    const body = await c.req.json(); // todo validator in hono route itself
    const { name, description, defaultLink, type, sourceId } = body;
    
    const newSubscription = await db.insert(subscription).values({
        id: crypto.randomUUID(),
        type,
        data: {
            name,
            description,
            defaultLink,
            type,
            sourceId,
        },
    }).returning();
    
});
