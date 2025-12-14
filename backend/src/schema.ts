import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, blob, index, primaryKey } from "drizzle-orm/sqlite-core";
import { z } from "zod";

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

type SubscriptionGroupData = any

// maybe rename to something like subscriptionCollections -- or subGroup
export const subscriptionGroups = sqliteTable("subscription_group", {
    id: text("id").primaryKey().$default(() => crypto.randomUUID()), // sometimes equal to userId
    ...timestamps,

    data: text({ mode: "json" }).$type<SubscriptionGroupData>().notNull(),
});


export const subscriptions = sqliteTable("subscription", {
    id: text("id")
        .primaryKey()
        .$default(() => crypto.randomUUID()),
    ...timestamps,

    name: text(),
    description: text(),
    defaultLink: text(),
    type: text("type", {
        enum: ["tv-show", "movie", "custom-collection"],
    }).notNull(),
    sourceId: text({ mode: "text" }), // eg tmdbId, custom-our-system id based on type
    data: text({ mode: "json" }).$type<any>() // 
}); 




// join table for subscription groups and subscriptions
export const subscriptionGroupsSubscriptions = sqliteTable("subgroup_subscription", {
    subscriptionGroupId: text().references(() => subscriptionGroups.id).notNull(),
    subscriptionId: text().references(() => subscriptions.id).notNull(),
}, (table) => [
    primaryKey({ columns: [table.subscriptionGroupId, table.subscriptionId] }),
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
    
    sourceId: text().notNull(),
    // maps on to tmdbId, or customid etc
    
    eventTitle: text().notNull(),
    day: text().notNull(),
    hasTime: integer("has_time", { mode: "boolean" }).notNull(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }),
    
    
    description: text(),
    link: text(),
}, (table) => [
    index("idx_event_subscriptionId_day").on(table.sourceId, table.day),
    // index("events_day_idx").on(table.day, ),
]);


// todo: define drizzle relations helper (might require drizzle-1.0)
// this also enables cleaner many-many select function


/* 
Model

User has SubscriptionGroup(s)  --- for now one-to-one, maybe later will add sharing
SubscriptionGroup has Subscription(s)
Subscription has Event(s)

objective data:
- tmdb events
- not-so-objective predicted events for a show/podcast
user-specific data:
- custom link for the subscription
- maybe: custom name or description

*/