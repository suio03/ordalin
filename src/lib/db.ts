import { localReadOnlyEnv } from "./local-read-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import * as schema from "@/db/schema";

export function createDb(database: D1Database) {
  return drizzle(database, { schema });
}

export type AppDatabase = ReturnType<typeof createDb>;

export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return createDb(process.env.NODE_ENV === "development" ? localReadOnlyEnv(env).DB : env.DB);
});

export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return createDb(process.env.NODE_ENV === "development" ? localReadOnlyEnv(env).DB : env.DB);
});

export function getCatalogAssetsBucket() {
  const { env } = getCloudflareContext();
  return process.env.NODE_ENV === "development" ? localReadOnlyEnv(env).CATALOG_ASSETS : env.CATALOG_ASSETS;
}
