import type { NewsPost } from "./db";

const WORDS_PER_MINUTE = 200;

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function formatNewsDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatNewsDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function wasEdited(post: NewsPost): boolean {
  if (!post.updated_at || !post.published_at) return false;
  const updated = new Date(post.updated_at).getTime();
  const published = new Date(post.published_at).getTime();
  const created = new Date(post.created_at).getTime();
  const baseline = Math.max(published, created);
  return updated - baseline > 60_000;
}

export function authorUsername(post: NewsPost): string | null {
  return post.mc_author_username || post.author || null;
}

export function authorDisplayName(post: NewsPost): string {
  if (post.mc_author_username) return post.mc_author_username;
  return post.author || "Comet";
}

export function readMinutes(post: NewsPost): number {
  return estimateReadMinutes(post.body_md);
}
