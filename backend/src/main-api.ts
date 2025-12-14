import { type Context, Hono } from "hono";
import { auth } from "./auth";
import { db } from "./db";
import {
    myTable,
    channels,
    subscriptionGroups,
    subscriptionGroupsChannels,
} from "./schema";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { getTmdbShowData } from "./tmdb";

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
                ownerId: userId,
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
    const session = await getSessionData(c, false);
    if (!session) {
        return c.json({ error: "Not logged in" }, 401);
    }
    const mySubscriptionGroup = await getUserSubscriptionGroup(session!.user.id);
    
    
    const subscriptionsRes = await db
        .select()
        .from(channels)
        .innerJoin(
            subscriptionGroupsChannels,
            eq(channels.id, subscriptionGroupsChannels.channelId)
        ).where(
            eq(subscriptionGroupsChannels.subscriptionGroupId, mySubscriptionGroup.id)
        ).all()
    const sub2 = subscriptionsRes.map(row => row.channel)
    
    
    
    return c.json(sub2);
});

api.post(
    "/me/subscribeNewSubscription",
    zValidator("json", createInsertSchema(channels)),
    async (c) => {
        const session = await getSessionData(c, true);
        const subscriptionGroup = await getUserSubscriptionGroup(
            session!.user.id
        );

        const body = c.req.valid("json");

        const newChannel = await db
            .insert(channels)
            .values({ ...body, id: crypto.randomUUID() })
            .returning();

        const newRelation = await db
            .insert(subscriptionGroupsChannels)
            .values({
                subscriptionGroupId: subscriptionGroup.id,
                channelId: newChannel[0].id,
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
            .insert(subscriptionGroupsChannels)
            .values({
                subscriptionGroupId: subscriptionGroup.id,
                channelId: body.subscriptionId,
            })
            .returning();

        return c.json(newRelation[0]);
    }
);



api.post(
    "/me/subscribeTmdbShow",
    zValidator("json", z.object({ tmdbId: z.number() })),
    async (c) => {
        const session = await getSessionData(c);
        if (!session) {
            return c.json({ error: "Not logged in" }, 401);
        }
        const subscriptionGroup = await getUserSubscriptionGroup(
            session!.user.id
        );
        const body = c.req.valid("json");

        const tmdbShowData = await getTmdbShowData(body.tmdbId);
        
        const seasons = tmdbShowData.seasons.map(season => season.season_number);
        
        // insert new subscription
    }
);

export default api;
