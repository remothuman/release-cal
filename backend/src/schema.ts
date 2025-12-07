import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, blob } from "drizzle-orm/sqlite-core";

export const myTable = sqliteTable("myTable", {
    id: integer().primaryKey(),

    value: text(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    // updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    //     .$onUpdate(() => sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    //     .$default(() => sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    //     .notNull(),

    // jsonField1: blob().$type<{ foo: string }>(),
    jsonField2: text({ mode: "json" }).$type<{ foo: string }>(),
});

// export const subscriptionGroups = sqliteTable("subscription_groups", {
//     id: text().primaryKey(),
//     createdAt: integer("created_at", { mode: "timestamp_ms" })
//       .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
//       .notNull(),
//     updatedAt: integer("updated_at", { mode: "timestamp" })
//         .default(sql`(unixepoch())`)
//         .$onUpdate(() => sql`(unixepoch())`)
//         .notNull()
// });
