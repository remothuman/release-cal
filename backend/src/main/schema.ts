import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, blob, index, primaryKey } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { user } from "../auth-schema";

const timestamps = {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .$onUpdate(() => sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$default(() => sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
}

export const myTable = sqliteTable("myTable", {
    id: integer("id").primaryKey(),

    value: text(),

    ...timestamps,

    jsonField: text({ mode: "json" }).$type<{ foo: string }>(),
    // jsonField2: blob().$type<{ foo: string }>(),
});


// maybe rename to something like subscriptionCollections -- or subGroup
export const subscriptionGroups = sqliteTable("subscription_group", {
    id: text("id").primaryKey().$default(() => crypto.randomUUID()), // sometimes equal to userId
    ...timestamps,
    ownerId: text().references(() => user.id).notNull(),

    // data: text({ mode: "json" }).$type<any>().notNull(),
});


export const channels = sqliteTable("channel", {
    id: text("id")
        .primaryKey()
        .$default(() => crypto.randomUUID()),
    ...timestamps,
    lastIndexedAt: integer("last_indexed_at", { mode: "timestamp_ms" }), // yes nullable

    name: text(),
    description: text(),
    // defaultLink: text(),
    type: text("type", {
        enum: ["tv-show", "movie", "custom-collection"],
    }).notNull(),
    sourceType: text("source_type", {
        enum: ["tmdb", "custom"],
    }).notNull(),
    sourceId: text({ mode: "text" }), // eg tmdbId, custom-our-system id based on type
    data: text({ mode: "json" }).$type<any>() // 
}); 




// join table for subscription groups and channels
export const subscriptionGroupsChannels = sqliteTable("subgroup_channel", {
    subscriptionGroupId: text().references(() => subscriptionGroups.id).notNull(),
    channelId: text().references(() => channels.id).notNull(),
}, (table) => [
    primaryKey({ columns: [table.subscriptionGroupId, table.channelId] }),
    // Index on subscriptionGroupId for efficient filtering in /me/events query
    // This helps when joining to find all channels for a subscription group
    index("idx_subgroup_channel_subscriptionGroupId").on(table.subscriptionGroupId),
]);
// todo foreign key definition maybe

/*

Sources:
- tmdb      subscription.sourceId = aTmdbId    events.sourceId = aTmdbId
- custom    subscription.sourceId = subscription.id    events.sourceId = subscription.id

*/


export const events = sqliteTable("event", {
    id: text("id").primaryKey(),
    ...timestamps,
    
    channelId: text().references(() => channels.id).notNull(),
    
    // sourceId: text().notNull(),
    
    eventTitle: text().notNull(),
    day: text().notNull(),
    hasTime: integer("has_time", { mode: "boolean" }).notNull(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }),
    // details: text({ mode: "json" }).$type<{
    //     seasonNumber?: string,
    //     episodeNumber?: string,
    // }>(),
    
    
    description: text(),
    seasonNumber: text(),
    episodeNumber: text(), // these can also be used for stuff other than tv shows
    
    
    defaultLink: text(),
}, (table) => [
    // Composite index on (channelId, day) - good for:
    // 1. Filtering events by channel and day range
    // 2. The order (channelId, day) is optimal since channelId is more selective
    //    and we typically filter by channelId first, then day range
    // Note: This index helps with the /me/events query when filtering by day range
    //       after joining through channels. However, if day range queries become
    //       common without channelId filtering, consider adding a separate index on day.
    index("idx_event_channelId_day").on(table.channelId, table.day),
]);


// todo: define drizzle relations helper (might require drizzle-1.0)
// this also enables cleaner many-many select function


/* 
Model

User has SubscriptionGroup(s)  --- for now one-to-one, will add shareable groups later
SubscriptionGroup has Channels(s) (many-many)
Channel has Event(s) (one-to-many)

objective data:
- tmdb events
- not-so-objective predicted events for a show/podcast
user-specific data:
- custom link for the subscription
- maybe: custom name or description
-- will add user specific data if needed in a semi-seperate system/tables



*/