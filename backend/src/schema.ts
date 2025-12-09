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

// maybe rename to something like subscriptionCollections
export const subscriptionGroups = sqliteTable("subscription_groups", {
    id: text("id").primaryKey().$default(() => crypto.randomUUID()), // sometimes equal to userId
    ...timestamps,

    data: text({ mode: "json" }).$type<SubscriptionGroupData>().notNull(),
});


export const subscription = sqliteTable("subscription", {
    id: text("id").primaryKey().$default(() => crypto.randomUUID()),
    ...timestamps,
    
    data: text({ mode: "json" }).$type<any>().notNull(),
    name: text(),
    description: text(),
    defaultLink: text(),
    type: text("type", { enum: ["tv-show", "movie", "custom-collection"] }).notNull(),
    sourceId: text(), // eg tmdbId, imdbId, etc
    
}); 




// join table for subscription groups and subscriptions
export const subscriptionGroupSubscriptions = sqliteTable("subscription_group_subscriptions", {
    subscriptionGroupId: text().references(() => subscriptionGroups.id).notNull(),
    subscriptionId: text().references(() => subscription.id).notNull(),
}, (table) => [
    primaryKey({ columns: [table.subscriptionGroupId, table.subscriptionId] }),
]);
// todo foreign key definition maybe



export const events = sqliteTable("events", {
    id: text("id").primaryKey(),
    ...timestamps,
    
    subscriptionId: text().references(() => subscription.id).notNull(),
    
    eventTitle: text().notNull(),
    day: text().notNull(),
    hasTime: integer("has_time", { mode: "boolean" }).notNull(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }),
    
    
    description: text(),
    link: text(),
}, (table) => [
    index("events_subscriptionId_idx").on(table.subscriptionId, table.day),
    // index("events_day_idx").on(table.day, ),
]);


// todo: define drizzle relations helper (might require drizzle-1.0)
// this also enables cleaner many-many select function