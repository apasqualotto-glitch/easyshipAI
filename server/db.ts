import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

export const hasDatabase = !!process.env.DATABASE_URL;

let pool: any = null;
let db: any = null;

if (hasDatabase) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.warn(
    "⚠️  DATABASE_URL not set — running in-memory only mode.\n" +
    "   Quotes, bookings, and chats will not persist after restart.\n" +
    "   Perfect for local development and demos. Set DATABASE_URL to enable persistence."
  );
}

export { pool, db };
