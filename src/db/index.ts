import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Fail loudly in dev rather than silently connecting to nothing.
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
