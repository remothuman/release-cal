import { createCollection, eq, useLiveQuery } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { QueryClient } from "@tanstack/query-core";
import { z } from "zod";

const queryClient = new QueryClient();

const EventSchema = z.object({
  id: z.string(),
  fromSubscriptionId: z.string(), //maybe
  // will get "show" / calendar title from subscription collection
  eventTitle: z.string(), // eg "episode title"
  date: z.string(),
  // time: z.optional(z.string()), // might replace with timestamp
  
  hasTime: z.boolean(),
  utcTimestamp: z.number().optional(),
  
  description: z.optional(z.string()),
  link: z.optional(z.string()),
})

const SubscriptionGroupDataSchema = z.array(
  z
    .object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      defaultLink: z.optional(z.string()),
      
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .and(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("tv-show").or(z.literal("movie")),
          tmdbId: z.number(),
          // might add imdbId instead / in addition
        }),
        z.object({
          type: z.literal("custom-collection"),
          items: z.array(EventSchema)
        }),
      ])
    )
);
const exampleSubscriptionGroupData: z.infer<typeof SubscriptionGroupDataSchema> = [
  {
    id: "1",
    type: "tv-show",
    tmdbId: 123,
  },
  {
    id: "2",
    type: "custom-collection",
    items: [
      {
        id: "1",
        fromSubscriptionId: "2",
        eventTitle: "Episode 1",
        date: "2025-12-06",
        hasTime: false,
      },
    ],
  }
];

type x = z.infer<typeof SubscriptionGroupDataSchema>;

const mySubGroupDataCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    schema: SubscriptionGroupDataSchema,
    queryKey: ["subscriptionGroups"],
    queryFn: async () => {
      return [];
    },
    getKey: (data) => data.id,

    onInsert: async (data) => {
      ``;
    },
    onUpdate: async (data) => {},
    onDelete: async (data) => {},
  })
);
