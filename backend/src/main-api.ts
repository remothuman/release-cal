import { type Context, Hono } from "hono";
import { auth } from "./auth";
import { db } from "./db";
import {
    myTable,
    subscriptions,
    subscriptionGroups,
    subscriptionGroupsSubscriptions,
} from "./schema";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const api = new Hono();

async function getSessionData(c: Context, errorOnNoSession: boolean = false) {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (errorOnNoSession && !session) {
        console.log(session, c.req.raw.headers);
        throw new Error("Not logged in");
        // todo: make this middleware so it can return to user a 401 
    }

    return session;
}

/** Get the subscription group for a userId. If it does not exist, create it. */
async function getUserSubscriptionGroup(userId: string) {
    const subscriptionGroupId = userId; // should it be some prefix + userId?

    const subscriptionGroup = await db
        .select()
        .from(subscriptionGroups)
        .where(eq(subscriptionGroups.id, subscriptionGroupId));

    // if group does not exist, create it
    if (subscriptionGroup.length === 0) {
        // create new subscription group for the user
        const newSubscriptionGroupR = await db
            .insert(subscriptionGroups)
            .values({
                id: subscriptionGroupId,
                data: {
                    subscriptions: [],
                },
            })
            .returning();
        return newSubscriptionGroupR[0];
    }
    if (subscriptionGroup.length > 1) {
        // throw new Error("Multiple subscription groups found for user");
        console.error(
            "Multiple subscription groups found for user",
            subscriptionGroupId
        );
    }

    return subscriptionGroup[0];
}

api.get("/me/subscriptions", async (c) => {
    const session = await getSessionData(c, true);
    const mySubscriptionGroup = await getUserSubscriptionGroup(session!.user.id);
    
    
    const subscriptionsRes = await db
        // .select({
        //     id: subscription.id,
        //     name: subscription.name,
        //     description: subscription.description,
        //     defaultLink: subscription.defaultLink,
        //     type: subscription.type,
        //     sourceId: subscription.sourceId,
        //     data: subscription.data,
        // })
        .select()
        .from(subscriptions)
        .innerJoin(
            subscriptionGroupsSubscriptions,
            eq(subscriptions.id, subscriptionGroupsSubscriptions.subscriptionId)
        ).where(
            eq(subscriptionGroupsSubscriptions.subscriptionGroupId, mySubscriptionGroup.id)
        ).all()
    const sub2 = subscriptionsRes.map(row => row.subscription)
    
    
    
    return c.json(sub2);
});

api.post(
    "/me/subscribeNewSubscription",
    zValidator("json", createInsertSchema(subscriptions)),
    async (c) => {
        const session = await getSessionData(c, true);
        const subscriptionGroup = await getUserSubscriptionGroup(
            session!.user.id
        );

        const body = c.req.valid("json");

        const newSubscription = await db
            .insert(subscriptions)
            .values({ ...body, id: crypto.randomUUID() })
            .returning();

        const newRelation = await db
            .insert(subscriptionGroupsSubscriptions)
            .values({
                subscriptionGroupId: subscriptionGroup.id,
                subscriptionId: newSubscription[0].id,
            })
            .returning();

        return c.json(newRelation[0]);
    }
);

// MAYBE keep
api.post(
    "/me/subscribeExistingSubscription",
    zValidator("json", z.object({ subscriptionId: z.string() })),
    async (c) => {
        const session = await getSessionData(c, true);
        const subscriptionGroup = await getUserSubscriptionGroup(session!.user.id);
        
        const body = c.req.valid("json");
        
        const newRelation = await db
            .insert(subscriptionGroupsSubscriptions)
            .values({
                subscriptionGroupId: subscriptionGroup.id,
                subscriptionId: body.subscriptionId,
            })
            .returning();

        return c.json(newRelation[0]);
    }
);

export default api;
