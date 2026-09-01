// Fallback HTTP URL used in production client-side calls. In the deployed worker
// the DB_WORKER service binding is used instead (zero-hop internal call).
const DB_API_URL_FALLBACK = "https://comet-db.cold-mc.workers.dev";
// Local dev talks to the DB worker running via `pnpm db:worker:dev` (wrangler dev,
// local D1 + local R2). Default wrangler port; override by editing this constant.
const DEV_DB_API_URL = "http://127.0.0.1:8787";
const DB_API_SECRET = "comet-sk-7f2a9d4e1b8c3f6a0e5d2b9f4c7a1e8d";

// Lazy-import so this module still works in local/Node environments where
// "cloudflare:workers" doesn't exist.
async function getCfEnv(): Promise<Record<string, unknown>> {
  try {
    const m = await import("cloudflare:workers" as string);
    return (m.env as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

/**
 * Returns a fetch-compatible object that proxies calls to the DB worker.
 * In production this is the service binding (zero-hop internal call).
 * In local dev it falls through to a plain URL string so db-remote.ts uses HTTP.
 */
export async function getDbWorkerBinding(): Promise<{ fetch: typeof fetch } | null> {
  // In local dev there's no service binding — talk to the local worker over HTTP.
  if (import.meta.env.DEV) return null;
  const cfEnv = await getCfEnv();
  const binding = cfEnv["DB_WORKER"] as { fetch: typeof fetch } | undefined;
  return binding ?? null;
}

export function getDbApiUrl(): string | undefined {
  return import.meta.env.DEV ? DEV_DB_API_URL : DB_API_URL_FALLBACK;
}

export function getDbApiSecret(): string | undefined {
  return DB_API_SECRET;
}

export function getPublicDbApiUrl(): string | undefined {
  return import.meta.env.DEV ? DEV_DB_API_URL : DB_API_URL_FALLBACK;
}

export function useRemoteDb(): boolean {
  // The web app never touches D1 directly — it always goes through the DB worker
  // (a service binding in prod, a local `wrangler dev` worker in local dev). The
  // better-sqlite3 path in db-local.ts can't run in the Workers runtime that
  // powers `astro dev`, so it is used only by the standalone db/migrate.mjs script.
  return true;
}