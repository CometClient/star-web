import { getDbApiSecret, getDbApiUrl, getDbWorkerBinding } from "@/lib/db-config";

function baseUrl() {
  const url = getDbApiUrl();
  if (!url) throw new Error("DB_API_URL is not configured");
  return url;
}

export function dbSecret(): string {
  const secret = getDbApiSecret();
  if (!secret) throw new Error("DB_API_SECRET is not configured");
  return secret;
}

export function secretHeaders(): Record<string, string> {
  return { "X-Comet-Secret": dbSecret(), "Content-Type": "application/json" };
}

/**
 * Resolve a fetcher: prefer the CF service binding (internal, zero-hop) so we
 * never hit the *.workers.dev → *.workers.dev HTTP loopback that CF blocks.
 * Falls back to globalThis.fetch + a real URL in local dev.
 */
export async function resolveFetch(path: string): Promise<{ fetcher: typeof fetch; url: string }> {
  const binding = await getDbWorkerBinding();
  if (binding) {
    // Service binding: the URL just needs a valid origin — the binding ignores it.
    return { fetcher: binding.fetch.bind(binding) as typeof fetch, url: `https://internal${path}` };
  }
  return { fetcher: fetch, url: `${baseUrl()}${path}` };
}

export async function apiGet<T>(path: string): Promise<T> {
  const { fetcher, url } = await resolveFetch(path);
  const res = await fetcher(url, { headers: { "X-Comet-Secret": dbSecret() } });
  if (!res.ok) throw new Error(`DB API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiMutate<T>(path: string, method: string, body?: unknown): Promise<T | void> {
  const { fetcher, url } = await resolveFetch(path);
  const res = await fetcher(url, {
    method,
    headers: secretHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(`DB API ${method} ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Raw passthrough: returns the worker's Response untouched so callers can read
 * error bodies, forward status codes, or stream a file back to the browser.
 */
export async function apiRaw(
  path: string,
  init?: { method?: string; body?: BodyInit | null; headers?: Record<string, string> },
): Promise<Response> {
  const { fetcher, url } = await resolveFetch(path);
  return fetcher(url, {
    method: init?.method ?? "GET",
    // No Content-Type here: FormData bodies must set their own multipart boundary.
    headers: { "X-Comet-Secret": dbSecret(), ...(init?.headers ?? {}) },
    body: init?.body ?? undefined,
  });
}

/** apiRaw + JSON decoding that preserves the worker's status and error payload. */
export async function apiJson<T>(
  path: string,
  init?: { method?: string; body?: BodyInit | null; headers?: Record<string, string> },
): Promise<{ status: number; data: T }> {
  const res = await apiRaw(path, init);
  if (res.status === 204) return { status: 204, data: {} as T };
  const text = await res.text();
  let data: T;
  try {
    data = (text ? JSON.parse(text) : {}) as T;
  } catch {
    data = { error: text.slice(0, 300) } as T;
  }
  return { status: res.status, data };
}
