import { type Context, Hono } from "hono";
import { auth } from "../auth";
import { db } from "../db";
import {
    myTable,
    channels,
    subscriptionGroups,
    subscriptionGroupsChannels,
    events,
} from "../schema";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createTmdbTvChannelIfNotExists, getTmdbShowData } from "./tmdb";



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

const api = new Hono()
.get("/me/subscriptions", async (c) => {
    const session = await getSessionData(c, false);
    if (!session) {
        return c.json({ error: "Not logged in" }, 401);
    }
    const mySubscriptionGroup = await getUserSubscriptionGroup(session!.user.id);
    
    
    const channelsRes = await db
        .select({
            channel: channels,
        })
        .from(channels)
        .innerJoin(
            subscriptionGroupsChannels,
            eq(channels.id, subscriptionGroupsChannels.channelId)
        ).where(
            eq(subscriptionGroupsChannels.subscriptionGroupId, mySubscriptionGroup.id)
        ).all()
    const sub2 = channelsRes.map(row => row.channel)
    
    
    
    return c.json(sub2);
})
.get("/me/events", async (c) => {
    const session = await getSessionData(c);
    if (!session) {
        return c.json({ error: "Not logged in" }, 401);
    }
    const subscriptionGroup = await getUserSubscriptionGroup(session!.user.id);
    
    const eventsRes = db
        .select({
            event: events
        })
        .from(events)
        .innerJoin(
            channels,
            eq(events.sourceId, channels.id) // wrong
        )
        .innerJoin(
            subscriptionGroupsChannels,
            eq(channels.id, subscriptionGroupsChannels.channelId)
        )
        .where(
            eq(subscriptionGroupsChannels.subscriptionGroupId, subscriptionGroup.id)
        )
        .all();
    
    const eventsList = eventsRes.map(row => row.event);
    console.log("eventsRes", eventsRes);
    
    return c.json(eventsList);
})


.post(
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

        console.log("creating channel for tmdbId", body.tmdbId);
        const channelId = await createTmdbTvChannelIfNotExists(body.tmdbId);
        if (!channelId) {
            return c.json({ error: "Failed to create channel relation" }, 500);
        }
        
        const newRelation = await db
            .insert(subscriptionGroupsChannels)
            .values({
                subscriptionGroupId: subscriptionGroup.id,
                channelId: channelId,
            })
            .returning();
        return c.json(newRelation[0]);
    }
)

.delete("/me/clearAllSubscriptions", async (c) => {
    const session = await getSessionData(c);
    if (!session) {
        return c.json({ error: "Not logged in" }, 401);
    }
    const subscriptionGroup = await getUserSubscriptionGroup(session!.user.id);
    await db.delete(subscriptionGroupsChannels).where(eq(subscriptionGroupsChannels.subscriptionGroupId, subscriptionGroup.id)).run();
    return c.json({ message: "All subscriptions cleared" });
})



export default api;
