import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@db/schema";

export type AppEnv = {
  DB: D1Database;
};

type DbInstance = DrizzleD1Database<typeof schema>;

const connectionCache = new WeakMap<D1Database, DbInstance>();

export function getDb(env: AppEnv): DbInstance {
  const existing = connectionCache.get(env.DB);
  if (existing) {
    return existing;
  }

  const db = drizzle(env.DB, { schema });
  connectionCache.set(env.DB, db);
  return db;
}

export { schema };
