import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { STAFF_TIER_DEFAULT, STAFF_TIER_ORDER_SQL } from "@/lib/staff-tiers";
import type {
  LauncherAnnouncement,
  LauncherVersion,
  NewsPost,
  StaffMember,
} from "@/lib/db-types";

function getRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "../..");
}
function getDataDir() { return join(getRoot(), "db/data"); }
function getDbPath() {
  return process.env.DATABASE_PATH || join(getDataDir(), "comet.db");
}

let db: Database.Database | null = null;

function runMigrations(database: Database.Database) {
  const migrationsDir = join(getRoot(), "db/migrations");
  if (!existsSync(migrationsDir)) return;

  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const applied = database.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(file);
    if (applied) continue;
    database.exec(readFileSync(join(migrationsDir, file), "utf8"));
    database.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  }
}

function getDb(): Database.Database {
  if (db) return db;
  if (!existsSync(getDataDir())) mkdirSync(getDataDir(), { recursive: true });
  db = new Database(getDbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}

export function listNewsLocal(publishedOnly = true): NewsPost[] {
  const sql = publishedOnly
    ? `SELECT * FROM news_posts WHERE published = 1 ORDER BY pinned DESC, published_at DESC`
    : `SELECT * FROM news_posts ORDER BY pinned DESC, updated_at DESC`;
  return getDb().prepare(sql).all() as NewsPost[];
}

export function getNewsBySlugLocal(slug: string): NewsPost | undefined {
  return getDb().prepare(`SELECT * FROM news_posts WHERE slug = ?`).get(slug) as NewsPost | undefined;
}

export function getNewsByIdLocal(id: string): NewsPost | undefined {
  return getDb().prepare(`SELECT * FROM news_posts WHERE id = ?`).get(id) as NewsPost | undefined;
}

export function upsertNewsLocal(post: Partial<NewsPost> & { id: string; slug: string; title: string }) {
  const now = new Date().toISOString();
  const existing = getNewsByIdLocal(post.id);
  if (existing) {
    getDb()
      .prepare(
        `UPDATE news_posts SET slug=?, title=?, excerpt=?, body_md=?, cover_url=?, published=?, published_at=?, author=?, mc_author_username=?, pinned=?, updated_at=? WHERE id=?`,
      )
      .run(
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
      );
  } else {
    getDb()
      .prepare(
        `INSERT INTO news_posts (id, slug, title, excerpt, body_md, cover_url, published, published_at, author, mc_author_username, pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
      );
  }
  return getNewsByIdLocal(post.id)!;
}

export function deleteNewsLocal(id: string) {
  getDb().prepare(`DELETE FROM news_posts WHERE id = ?`).run(id);
}

export function listStaffLocal(publishedOnly = true): StaffMember[] {
  const sql = publishedOnly
    ? `SELECT * FROM staff_members WHERE published = 1 ORDER BY ${STAFF_TIER_ORDER_SQL}, sort_order`
    : `SELECT * FROM staff_members ORDER BY ${STAFF_TIER_ORDER_SQL}, sort_order`;
  return getDb().prepare(sql).all() as StaffMember[];
}

export function getStaffByIdLocal(id: string): StaffMember | undefined {
  return getDb().prepare(`SELECT * FROM staff_members WHERE id = ?`).get(id) as StaffMember | undefined;
}

export function upsertStaffLocal(
  member: Partial<StaffMember> & { id: string; display_name: string; role: string },
) {
  const now = new Date().toISOString();
  const existing = getStaffByIdLocal(member.id);
  if (existing) {
    getDb()
      .prepare(
        `UPDATE staff_members SET display_name=?, mc_username=?, mc_uuid=?, role=?, role_tier=?, bio=?, avatar_url=?, sort_order=?, published=?, updated_at=? WHERE id=?`,
      )
      .run(
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
      );
  } else {
    getDb()
      .prepare(
        `INSERT INTO staff_members (id, display_name, mc_username, mc_uuid, role, role_tier, bio, avatar_url, sort_order, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
      );
  }
  return getStaffByIdLocal(member.id)!;
}

export function deleteStaffLocal(id: string) {
  getDb().prepare(`DELETE FROM staff_members WHERE id = ?`).run(id);
}

export function listLauncherAnnouncementsLocal(activeOnly = true): LauncherAnnouncement[] {
  const sql = activeOnly
    ? `SELECT * FROM launcher_announcements WHERE is_active = 1 ORDER BY published_at DESC`
    : `SELECT * FROM launcher_announcements ORDER BY published_at DESC`;
  return getDb().prepare(sql).all() as LauncherAnnouncement[];
}

export function listLauncherVersionsLocal(publishedOnly = true): LauncherVersion[] {
  const sql = publishedOnly
    ? `SELECT * FROM launcher_versions WHERE published = 1 ORDER BY published_at DESC`
    : `SELECT * FROM launcher_versions ORDER BY published_at DESC`;
  return getDb().prepare(sql).all() as LauncherVersion[];
}

export function getLatestLauncherVersionLocal(): LauncherVersion | undefined {
  return getDb()
    .prepare(`SELECT * FROM launcher_versions WHERE published = 1 ORDER BY published_at DESC LIMIT 1`)
    .get() as LauncherVersion | undefined;
}

export function createSessionLocal(tokenHash: string, expiresAt: string) {
  const id = crypto.randomUUID().replace(/-/g, "");
  getDb()
    .prepare(`INSERT INTO staff_sessions (id, token_hash, expires_at) VALUES (?, ?, ?)`)
    .run(id, tokenHash, expiresAt);
}

export function validateSessionLocal(tokenHash: string): boolean {
  const row = getDb()
    .prepare(`SELECT expires_at FROM staff_sessions WHERE token_hash = ?`)
    .get(tokenHash) as { expires_at: string } | undefined;
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) {
    getDb().prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).run(tokenHash);
    return false;
  }
  return true;
}

export function destroySessionLocal(tokenHash: string) {
  getDb().prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).run(tokenHash);
}
