import { z } from "zod";
import { warnParse } from "../utils";
import { db } from "../db";
import { events, channels } from "../schema";



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


export async function createTmdbSubscription(tmdbId: number) {
    const tmdbShowData = await getTmdbShowData(tmdbId);
    const seasons = tmdbShowData.seasons.map(season => season.season_number);
    
    const seasonsData = await Promise.all(seasons.map(season => getTmdbSeason(tmdbId, season)));
    
    await db.transaction(async (tx) => {
        // add the show to the database
        await tx.insert(channels).values({
            id: crypto.randomUUID(),
            sourceId: tmdbId.toString(),
            name: tmdbShowData.name,
            description: tmdbShowData.overview,
            type: "tv-show",
        });
        // add all episodes to the database
        for (const seasonData of seasonsData) {
            for (const episode of seasonData.episodes) {
                if (!episode.air_date) {
                    console.warn(`No air date for episode ${episode.name}`);
                    continue;
                }
                await tx.insert(events).values({
                    id: crypto.randomUUID(),
                    sourceId: `${tmdbId}`,
                    eventTitle: episode.name,
                    day: episode.air_date,
                    hasTime: false,
                    description: episode.overview,
                });
            }
        }
    });
}
// link: `https://www.google.com/search?q=${tmdbShowData.name}+justwatch&btnI=I'm+Feeling+Lucky`
// link will be stored in seperate user specific table or generated on the fly