import { apiGet, apiMutate, resolveFetch, secretHeaders } from "@/lib/db-transport";
import type {
  LauncherAnnouncement,
  LauncherVersion,
  NewsPost,
  OnlineCount,
  OnlineList,
  PingResult,
  StaffMember,
} from "@/lib/db-types";

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
  const { fetcher, url } = await resolveFetch("/internal/sessions/validate");
  const res = await fetcher(url, {
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

export async function pingPresenceRemote(payload: {
  uuid: string;
  username?: string | null;
  launcher_version?: string | null;
}): Promise<PingResult> {
  const result = await apiMutate<PingResult>("/launcher/ping", "POST", payload);
  if (!result) throw new Error("Failed to record ping");
  return result;
}

export async function listOnlineRemote(): Promise<OnlineList> {
  return apiGet<OnlineList>("/launcher/online");
}

export async function countOnlineRemote(): Promise<OnlineCount> {
  return apiGet<OnlineCount>("/launcher/online?c=1");
}
