// Fallback HTTP URL used in local dev (wrangler dev) and as a base for
// public client-side calls. In production the service binding is used instead.
const DB_API_URL_FALLBACK = "https://comet-db.cold-mc.workers.dev";
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
  const cfEnv = await getCfEnv();
  const binding = cfEnv["DB_WORKER"] as { fetch: typeof fetch } | undefined;
  return binding ?? null;
}

export function getDbApiUrl(): string | undefined {
  return DB_API_URL_FALLBACK;
}

export function getDbApiSecret(): string | undefined {
  return DB_API_SECRET;
}

export function getPublicDbApiUrl(): string | undefined {
  return DB_API_URL_FALLBACK;
}

export function useRemoteDb(): boolean {
  return true;
}