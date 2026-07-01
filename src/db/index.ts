import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let instance: Db | null = null;

function createDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to the environment (e.g. Vercel → Settings → Environment Variables).",
    );
  }
  return drizzle(neon(connectionString), { schema });
}

/** Lazy singleton — avoids throwing at import time during `next build`. */
export function getDb(): Db {
  if (!instance) instance = createDb();
  return instance;
}

/**
 * Drizzle client. Access is deferred until first use so production builds
 * succeed before env vars are read at runtime.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});

export { schema };
