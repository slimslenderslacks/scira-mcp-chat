import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema';

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance with explicit schema configuration
export const db = drizzle(pool, {
    schema: {
        chats: schema.chats,
        messages: schema.messages,
    },
}); 