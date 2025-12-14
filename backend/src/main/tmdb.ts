import { z } from "zod";
import { warnParse } from "../utils";
import { db } from "../db";
import { events, channels } from "../schema";
import { and, eq, sql } from "drizzle-orm";



export async function getTmdbShowData(tmdbId: number) {
    const tmdbData = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`
            },
        }
    ).then(res => res.json());
    
    const expectedReturnSchema = z.object({
        adult: z.boolean(),
        backdrop_path: z.string().nullable(),
        created_by: z.array(z.object({
            id: z.number(),
            credit_id: z.string(),
            name: z.string(),
            original_name: z.string(),
            gender: z.number(),
            profile_path: z.string().nullable(),
        })),
        episode_run_time: z.array(z.number()),
        first_air_date: z.string().nullable(),
        genres: z.array(z.object({
            id: z.number(),
            name: z.string(),
        })),
        homepage: z.string().nullable(),
        id: z.number(),
        in_production: z.boolean(),
        languages: z.array(z.string()),
        last_air_date: z.string().nullable(),
        last_episode_to_air: z.object({
            id: z.number(),
            name: z.string(),
            overview: z.string(),
            vote_average: z.number(),
            vote_count: z.number(),
            air_date: z.string(),
            episode_number: z.number(),
            episode_type: z.string(),
            production_code: z.string(),
            runtime: z.number().nullable(),
            season_number: z.number(),
            show_id: z.number(),
            still_path: z.string().nullable(),
        }).nullable(),
        name: z.string(),
        next_episode_to_air: z.object({
            id: z.number(),
            name: z.string(),
            overview: z.string(),
            vote_average: z.number(),
            vote_count: z.number(),
            air_date: z.string(),
            episode_number: z.number(),
            episode_type: z.string(),
            production_code: z.string(),
            runtime: z.number().nullable(),
            season_number: z.number(),
            show_id: z.number(),
            still_path: z.string().nullable(),
        }).nullable(),
        networks: z.array(z.object({
            id: z.number(),
            logo_path: z.string().nullable(),
            name: z.string(),
            origin_country: z.string(),
        })),
        number_of_episodes: z.number(),
        number_of_seasons: z.number(),
        origin_country: z.array(z.string()),
        original_language: z.string(),
        original_name: z.string(),
        overview: z.string(),
        popularity: z.number(),
        poster_path: z.string().nullable(),
        production_companies: z.array(z.object({
            id: z.number(),
            logo_path: z.string().nullable(),
            name: z.string(),
            origin_country: z.string(),
        })),
        production_countries: z.array(z.object({
            iso_3166_1: z.string(),
            name: z.string(),
        })),
        seasons: z.array(z.object({
            air_date: z.string().nullable(),
            episode_count: z.number(),
            id: z.number(),
            name: z.string(),
            overview: z.string().nullable(),
            poster_path: z.string().nullable(),
            season_number: z.number(),
            vote_average: z.number(),
        })),
        spoken_languages: z.array(z.object({
            english_name: z.string(),
            iso_639_1: z.string(),
            name: z.string(),
        })),
        status: z.string(),
        tagline: z.string().nullable(),
        type: z.string(),
        vote_average: z.number(),
        vote_count: z.number(),
    })
    const tmdbShowData = warnParse(tmdbData, expectedReturnSchema);
    
    return tmdbShowData;
}

export async function getTmdbSeason(tmdbId: number, seasonNumber: number) {
    const tmdbSeasonData = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`
            },
        }
    ).then(res => res.json());
    const expectedReturnSchema = z.object({
        _id: z.string().optional(),
        air_date: z.string().nullable(),
        episodes: z.array(z.object({
            air_date: z.string().nullable(),
            episode_number: z.number(),
            episode_type: z.string(),
            id: z.number(),
            name: z.string(),
            overview: z.string(),
            production_code: z.string(),
            runtime: z.number().nullable(),
            season_number: z.number(),
            show_id: z.number(),
            still_path: z.string().nullable(),
            vote_average: z.number(),
            vote_count: z.number(),
            crew: z.array(z.object({
                job: z.string(),
                department: z.string(),
                credit_id: z.string(),
                adult: z.boolean(),
                gender: z.number(),
                id: z.number(),
                known_for_department: z.string(),
                name: z.string(),
                original_name: z.string(),
                popularity: z.number(),
                profile_path: z.string().nullable(),
            })),
            guest_stars: z.array(z.object({
                character: z.string(),
                credit_id: z.string(),
                order: z.number(),
                adult: z.boolean(),
                gender: z.number(),
                id: z.number(),
                known_for_department: z.string(),
                name: z.string(),
                original_name: z.string(),
                popularity: z.number(),
                profile_path: z.string().nullable(),
            })),
        })),
        name: z.string(),
        networks: z.array(z.object({
            id: z.number(),
            logo_path: z.string().nullable(),
            name: z.string(),
            origin_country: z.string(),
        })),
        overview: z.string(),
        id: z.number(),
        poster_path: z.string().nullable(),
        season_number: z.number(),
        vote_average: z.number(),
    })
    const out = warnParse(tmdbSeasonData, expectedReturnSchema);
    return out;
    
}


export async function createTmdbTvChannelIfNotExists(tmdbId: number, ifExistsUpdateIfOlderThanHours: number|null = 24) {
    // check if channel already exists
    const existingChannel = await db
        .select()
        .from(channels)
        .where(and(eq(channels.sourceId, tmdbId.toString()), eq(channels.sourceType, "tmdb")))
        .limit(1);
    if (existingChannel.length > 0) {
        const shouldUpdate = ifExistsUpdateIfOlderThanHours != null && (
            existingChannel[0].lastIndexedAt == null ||
            existingChannel[0].lastIndexedAt.getTime() <
                Date.now() - ifExistsUpdateIfOlderThanHours * 60 * 60 * 1000
        );
        if (!shouldUpdate) {
            return existingChannel[0].id;
        }
        // continue on this function to update the channel
    }
    
    
    const tmdbShowData = await getTmdbShowData(tmdbId);
    const seasons = tmdbShowData.seasons.map(season => season.season_number);
    // const seasonsData = await Promise.all(seasons.map(season => getTmdbSeason(tmdbId, season)));
    let seasonsData = []
    for (const season of seasons) {
        const seasonData = await getTmdbSeason(tmdbId, season);
        seasonsData.push(seasonData);
    }
    // TODO: sometimes the connection fails. should return error to client or retry
    
    const areJustUpdating = existingChannel.length > 0;
    const newlyCreatedChannelId = db.transaction((tx) => {
        
        const channelId = areJustUpdating ? existingChannel[0].id : crypto.randomUUID();
        
        // add the show to the database
        if (areJustUpdating) {
            // we were just updating the channel, so we don't need to add it again
            // but we should update lastIndexedAt
            tx.update(channels)
                .set({ lastIndexedAt: new Date() })
                .where(eq(channels.id, channelId))
                .run();
            return channelId;
        }
        else {
            tx.insert(channels).values({
                id: channelId,
                sourceId: tmdbId.toString(), 
                lastIndexedAt: new Date(),
                
                type: "tv-show",
                sourceType: "tmdb",
                
                name: tmdbShowData.name,
                description: tmdbShowData.overview,
            }).run();
        }
        
        // add all episodes to the database
        const rowsToInsert = [] as typeof events.$inferInsert[];
        for (const seasonData of seasonsData) {
            for (const episode of seasonData.episodes) {
                if (!episode.air_date) {
                    console.warn(`No air date for episode ${episode.name}`);
                    continue;
                }
                rowsToInsert.push({
                    id: crypto.randomUUID(),
                    // sourceId: `${tmdbId}`,
                    channelId: channelId,
                    eventTitle: episode.name,
                    day: episode.air_date,
                    hasTime: false,
                    description: episode.overview,
                    seasonNumber: seasonData.season_number.toString(),
                    episodeNumber: episode.episode_number.toString(),
                });
            }
        }
        if (areJustUpdating) {
            // delete all existing events for this channel, since we just got all of them
            tx.delete(events).where(eq(events.channelId, channelId)).run();
        }
        console.log("rowsToInsert", rowsToInsert.length);
        if (rowsToInsert.length > 0) {
            tx.insert(events).values(rowsToInsert).run();
        }
        else {
            console.warn("No episodes to insert");
        }

        // console.log("inserted")
        
        
        
        // .returning().all();
        return channelId;
    });
    return newlyCreatedChannelId;
}
// TODO: cron updating channel events




// link: `https://www.google.com/search?q=${tmdbShowData.name}+justwatch&btnI=I'm+Feeling+Lucky`
// link will be stored in seperate user specific table or generated on the fly