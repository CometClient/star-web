import { getDbApiSecret, getDbApiUrl, getDbWorkerBinding } from "@/lib/db-config";
import type {
  LauncherAnnouncement,
  LauncherVersion,
  NewsPost,
  StaffMember,
} from "@/lib/db-types";

function baseUrl() {
  const url = getDbApiUrl();
  if (!url) throw new Error("DB_API_URL is not configured");
  return url;
}

function secretHeaders(): Record<string, string> {
  const secret = getDbApiSecret();
  if (!secret) throw new Error("DB_API_SECRET is not configured");
  return { "X-Comet-Secret": secret, "Content-Type": "application/json" };
}

/**
 * Resolve a fetcher: prefer the CF service binding (internal, zero-hop) so we
 * never hit the *.workers.dev → *.workers.dev HTTP loopback that CF blocks.
 * Falls back to globalThis.fetch + a real URL in local dev.
 */
async function resolveFetch(path: string): Promise<{ fetcher: typeof fetch; url: string }> {
  const binding = await getDbWorkerBinding();
  if (binding) {
    // Service binding: the URL just needs a valid origin — the binding ignores it.
    return { fetcher: binding.fetch.bind(binding) as typeof fetch, url: `https://internal${path}` };
  }
  return { fetcher: fetch, url: `${baseUrl()}${path}` };
}

async function apiGet<T>(path: string): Promise<T> {
  const { fetcher, url } = await resolveFetch(path);
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`DB API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiMutate<T>(path: string, method: string, body?: unknown): Promise<T | void> {
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

export async function listNewsRemote(publishedOnly = true): Promise<NewsPost[]> {
  return apiGet<NewsPost[]>(publishedOnly ? "/news" : "/news?all=1");
}

export async function getNewsBySlugRemote(slug: string): Promise<NewsPost | undefined> {
  try {
    return await apiGet<NewsPost>(`/news/${encodeURIComponent(slug)}`);
  } catch {
    return undefined;
  }
}

export async function upsertNewsRemote(
  post: Partial<NewsPost> & { id: string; slug: string; title: string },
): Promise<NewsPost> {
  const existing = await getNewsBySlugRemote(post.slug);
  if (existing) {
    const result = await apiMutate<NewsPost>(`/news/${encodeURIComponent(post.slug)}`, "PUT", post);
    if (!result) throw new Error("Failed to update news post");
    return result;
  }
  const result = await apiMutate<NewsPost>("/news", "POST", post);
  if (!result) throw new Error("Failed to create news post");
  return result;
}

export async function deleteNewsRemote(id: string, slug: string) {
  await apiMutate(`/news/${encodeURIComponent(slug)}`, "DELETE");
}

export async function listStaffRemote(publishedOnly = true): Promise<StaffMember[]> {
  return apiGet<StaffMember[]>(publishedOnly ? "/staff" : "/staff?all=1");
}

export async function getStaffByIdRemote(id: string): Promise<StaffMember | undefined> {
  const all = await listStaffRemote(false);
  return all.find((m) => m.id === id);
}

export async function upsertStaffRemote(
  member: Partial<StaffMember> & { id: string; display_name: string; role: string },
): Promise<StaffMember> {
  const existing = await getStaffByIdRemote(member.id);
  if (existing) {
    const result = await apiMutate<StaffMember>(`/staff/${encodeURIComponent(member.id)}`, "PUT", member);
    if (!result) throw new Error("Failed to update staff member");
    return result;
  }
  const result = await apiMutate<StaffMember>("/staff", "POST", member);
  if (!result) throw new Error("Failed to create staff member");
  return result;
}

export async function deleteStaffRemote(id: string) {
  await apiMutate(`/staff/${encodeURIComponent(id)}`, "DELETE");
}

export async function listLauncherAnnouncementsRemote(activeOnly = true): Promise<LauncherAnnouncement[]> {
  return apiGet<LauncherAnnouncement[]>("/launcher/announcements");
}

export async function listLauncherVersionsRemote(publishedOnly = true): Promise<LauncherVersion[]> {
  return apiGet<LauncherVersion[]>("/launcher/version?all=1");
}

export async function getLatestLauncherVersionRemote(): Promise<LauncherVersion | undefined> {
  try {
    return await apiGet<LauncherVersion>("/launcher/version");
  } catch {
    return undefined;
  }
}

export async function createSessionRemote(tokenHash: string, expiresAt: string) {
  await apiMutate("/internal/sessions", "POST", { token_hash: tokenHash, expires_at: expiresAt });
}

export async function validateSessionRemote(tokenHash: string): Promise<boolean> {
  const res = await fetch(`${baseUrl()}/internal/sessions/validate`, {
    method: "POST",
    headers: secretHeaders(),
    body: JSON.stringify({ token_hash: tokenHash }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { valid: boolean };
  return Boolean(data.valid);
}

export async function destroySessionRemote(tokenHash: string) {
  await apiMutate("/internal/sessions", "DELETE", { token_hash: tokenHash });
}