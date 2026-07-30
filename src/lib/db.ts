export type {
  LauncherAnnouncement,
  LauncherVersion,
  NewsPost,
  StaffMember,
} from "@/lib/db-types";

import { useRemoteDb } from "@/lib/db-config";
import type {
  LauncherAnnouncement,
  LauncherVersion,
  NewsPost,
  StaffMember,
} from "@/lib/db-types";
import * as local from "@/lib/db-local";
import * as remote from "@/lib/db-remote";

export function mcRender(username: string | null | undefined) {
  if (username) return `https://render.crafty.gg/3d/full/${encodeURIComponent(username)}?x=-30&z=50`;
  return `https://render.crafty.gg/3d/full/Steve?x=-30&z=50`;
}

export function mcBust(username: string | null | undefined) {
  if (username) return `https://render.crafty.gg/3d/bust/${encodeURIComponent(username)}`;
  return `https://render.crafty.gg/3d/bust/Steve`;
}

export async function listNews(publishedOnly = true): Promise<NewsPost[]> {
  if (useRemoteDb()) return remote.listNewsRemote(publishedOnly);
  return local.listNewsLocal(publishedOnly);
}

export async function getNewsBySlug(slug: string): Promise<NewsPost | undefined> {
  if (useRemoteDb()) return remote.getNewsBySlugRemote(slug);
  return local.getNewsBySlugLocal(slug);
}

export async function getNewsById(id: string): Promise<NewsPost | undefined> {
  if (useRemoteDb()) {
    const all = await remote.listNewsRemote(false);
    return all.find((p) => p.id === id);
  }
  return local.getNewsByIdLocal(id);
}

export async function upsertNews(
  post: Partial<NewsPost> & { id: string; slug: string; title: string },
): Promise<NewsPost> {
  if (useRemoteDb()) return remote.upsertNewsRemote(post);
  return local.upsertNewsLocal(post);
}

export async function deleteNews(id: string, slug?: string): Promise<void> {
  if (useRemoteDb()) {
    const s = slug ?? (await getNewsById(id))?.slug;
    if (s) await remote.deleteNewsRemote(id, s);
    return;
  }
  local.deleteNewsLocal(id);
}

export async function listStaff(publishedOnly = true): Promise<StaffMember[]> {
  if (useRemoteDb()) return remote.listStaffRemote(publishedOnly);
  return local.listStaffLocal(publishedOnly);
}

export async function getStaffById(id: string): Promise<StaffMember | undefined> {
  if (useRemoteDb()) return remote.getStaffByIdRemote(id);
  return local.getStaffByIdLocal(id);
}

export async function upsertStaff(
  member: Partial<StaffMember> & { id: string; display_name: string; role: string },
): Promise<StaffMember> {
  if (useRemoteDb()) return remote.upsertStaffRemote(member);
  return local.upsertStaffLocal(member);
}

export async function deleteStaff(id: string): Promise<void> {
  if (useRemoteDb()) return remote.deleteStaffRemote(id);
  local.deleteStaffLocal(id);
}

export async function listLauncherAnnouncements(activeOnly = true): Promise<LauncherAnnouncement[]> {
  if (useRemoteDb()) return remote.listLauncherAnnouncementsRemote(activeOnly);
  return local.listLauncherAnnouncementsLocal(activeOnly);
}

export async function listLauncherVersions(publishedOnly = true): Promise<LauncherVersion[]> {
  if (useRemoteDb()) return remote.listLauncherVersionsRemote(publishedOnly);
  return local.listLauncherVersionsLocal(publishedOnly);
}

export async function getLatestLauncherVersion(): Promise<LauncherVersion | undefined> {
  if (useRemoteDb()) return remote.getLatestLauncherVersionRemote();
  return local.getLatestLauncherVersionLocal();
}

export async function persistSession(tokenHash: string, expiresAt: string): Promise<void> {
  if (useRemoteDb()) return remote.createSessionRemote(tokenHash, expiresAt);
  local.createSessionLocal(tokenHash, expiresAt);
}

export async function checkSession(tokenHash: string): Promise<boolean> {
  if (useRemoteDb()) return remote.validateSessionRemote(tokenHash);
  return local.validateSessionLocal(tokenHash);
}

export async function revokeSession(tokenHash: string): Promise<void> {
  if (useRemoteDb()) return remote.destroySessionRemote(tokenHash);
  local.destroySessionLocal(tokenHash);
}
