import { drizzle } from 'drizzle-orm/better-sqlite3';
import 'dotenv/config';
import * as authSchema from './auth-schema';
import * as schema from './main/schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}
export const db = drizzle(process.env.DATABASE_URL, { schema: { ...authSchema, ...schema } });

