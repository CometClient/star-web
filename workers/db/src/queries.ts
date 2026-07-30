import { STAFF_TIER_DEFAULT, STAFF_TIER_ORDER_SQL } from "./staff-tiers";

export interface Env {
  DB: D1Database;
  DB_API_SECRET: string;
  STAFF_EMAIL?: string;
  STAFF_PASSWORD?: string;
  ALLOWED_ORIGINS?: string;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  const ok = !origin || allowed.includes("*") || allowed.includes(origin);
  if (!ok) return {};
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Comet-Secret",
    "Access-Control-Max-Age": "86400",
  };
}

export function requireSecret(request: Request, env: Env): Response | null {
  const secret = request.headers.get("X-Comet-Secret");
  if (!secret || secret !== env.DB_API_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

export async function listNews(db: D1Database, publishedOnly: boolean) {
  const sql = publishedOnly
    ? `SELECT * FROM news_posts WHERE published = 1 ORDER BY pinned DESC, published_at DESC`
    : `SELECT * FROM news_posts ORDER BY pinned DESC, updated_at DESC`;
  return (await db.prepare(sql).all()).results ?? [];
}

export async function getNewsBySlug(db: D1Database, slug: string) {
  return db.prepare(`SELECT * FROM news_posts WHERE slug = ?`).bind(slug).first();
}

export async function getNewsById(db: D1Database, id: string) {
  return db.prepare(`SELECT * FROM news_posts WHERE id = ?`).bind(id).first();
}

export async function upsertNews(db: D1Database, post: Record<string, unknown>) {
  const now = new Date().toISOString();
  const existing = await getNewsById(db, String(post.id));
  if (existing) {
    await db
      .prepare(
        `UPDATE news_posts SET slug=?, title=?, excerpt=?, body_md=?, cover_url=?, published=?, published_at=?, author=?, mc_author_username=?, pinned=?, updated_at=? WHERE id=?`,
      )
      .bind(
        post.slug,
        post.title,
        post.excerpt ?? null,
        post.body_md ?? "",
        post.cover_url ?? null,
        post.published ?? 0,
        post.published_at ?? null,
        post.author ?? null,
        post.mc_author_username ?? null,
        post.pinned ?? 0,
        now,
        post.id,
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO news_posts (id, slug, title, excerpt, body_md, cover_url, published, published_at, author, mc_author_username, pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        post.id,
        post.slug,
        post.title,
        post.excerpt ?? null,
        post.body_md ?? "",
        post.cover_url ?? null,
        post.published ?? 0,
        post.published_at ?? null,
        post.author ?? null,
        post.mc_author_username ?? null,
        post.pinned ?? 0,
        now,
        now,
      )
      .run();
  }
  return getNewsById(db, String(post.id));
}

export async function deleteNews(db: D1Database, id: string) {
  await db.prepare(`DELETE FROM news_posts WHERE id = ?`).bind(id).run();
}

export async function listStaff(db: D1Database, publishedOnly: boolean) {
  const sql = publishedOnly
    ? `SELECT * FROM staff_members WHERE published = 1 ORDER BY ${STAFF_TIER_ORDER_SQL}, sort_order`
    : `SELECT * FROM staff_members ORDER BY ${STAFF_TIER_ORDER_SQL}, sort_order`;
  return (await db.prepare(sql).all()).results ?? [];
}

export async function getStaffById(db: D1Database, id: string) {
  return db.prepare(`SELECT * FROM staff_members WHERE id = ?`).bind(id).first();
}

export async function upsertStaff(db: D1Database, member: Record<string, unknown>) {
  const now = new Date().toISOString();
  const existing = await getStaffById(db, String(member.id));
  if (existing) {
    await db
      .prepare(
        `UPDATE staff_members SET display_name=?, mc_username=?, mc_uuid=?, role=?, role_tier=?, bio=?, avatar_url=?, sort_order=?, published=?, updated_at=? WHERE id=?`,
      )
      .bind(
        member.display_name,
        member.mc_username ?? null,
        member.mc_uuid ?? null,
        member.role,
        member.role_tier ?? STAFF_TIER_DEFAULT,
        member.bio ?? null,
        member.avatar_url ?? null,
        member.sort_order ?? 0,
        member.published ?? 1,
        now,
        member.id,
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO staff_members (id, display_name, mc_username, mc_uuid, role, role_tier, bio, avatar_url, sort_order, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        member.id,
        member.display_name,
        member.mc_username ?? null,
        member.mc_uuid ?? null,
        member.role,
        member.role_tier ?? STAFF_TIER_DEFAULT,
        member.bio ?? null,
        member.avatar_url ?? null,
        member.sort_order ?? 0,
        member.published ?? 1,
        now,
        now,
      )
      .run();
  }
  return getStaffById(db, String(member.id));
}

export async function deleteStaff(db: D1Database, id: string) {
  await db.prepare(`DELETE FROM staff_members WHERE id = ?`).bind(id).run();
}

export async function listLauncherAnnouncements(db: D1Database, activeOnly: boolean) {
  const sql = activeOnly
    ? `SELECT * FROM launcher_announcements WHERE is_active = 1 ORDER BY published_at DESC`
    : `SELECT * FROM launcher_announcements ORDER BY published_at DESC`;
  return (await db.prepare(sql).all()).results ?? [];
}

export async function listLauncherVersions(db: D1Database, publishedOnly: boolean) {
  const sql = publishedOnly
    ? `SELECT * FROM launcher_versions WHERE published = 1 ORDER BY published_at DESC`
    : `SELECT * FROM launcher_versions ORDER BY published_at DESC`;
  return (await db.prepare(sql).all()).results ?? [];
}

export async function getLatestLauncherVersion(db: D1Database) {
  return db
    .prepare(`SELECT * FROM launcher_versions WHERE published = 1 ORDER BY published_at DESC LIMIT 1`)
    .first();
}

export async function createSession(db: D1Database, tokenHash: string, expiresAt: string) {
  const id = crypto.randomUUID().replace(/-/g, "");
  await db
    .prepare(`INSERT INTO staff_sessions (id, token_hash, expires_at) VALUES (?, ?, ?)`)
    .bind(id, tokenHash, expiresAt)
    .run();
}

export async function validateSession(db: D1Database, tokenHash: string) {
  const row = await db
    .prepare(`SELECT expires_at FROM staff_sessions WHERE token_hash = ?`)
    .bind(tokenHash)
    .first<{ expires_at: string }>();
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) {
    await db.prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).bind(tokenHash).run();
    return false;
  }
  return true;
}

export async function destroySession(db: D1Database, tokenHash: string) {
  await db.prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).bind(tokenHash).run();
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
