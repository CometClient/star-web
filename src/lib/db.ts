import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
import { STAFF_TIER_DEFAULT, STAFF_TIER_ORDER_SQL } from "@/lib/staff-tiers";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = join(root, "db/data");
const dbPath = process.env.DATABASE_PATH || join(dataDir, "comet.db");

let db: Database.Database | null = null;

function runMigrations(database: Database.Database) {
  const migrationsDir = join(root, "db/migrations");
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

export function getDb(): Database.Database {
  if (db) return db;
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  return db;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  cover_url: string | null;
  published: number;
  published_at: string | null;
  author: string | null;
  mc_author_username: string | null;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  display_name: string;
  mc_username: string | null;
  mc_uuid: string | null;
  role: string;
  role_tier: string;
  bio: string | null;
  avatar_url: string | null;
  sort_order: number;
  published: number;
  created_at: string;
  updated_at: string;
}

export function listNews(publishedOnly = true): NewsPost[] {
  const sql = publishedOnly
    ? `SELECT * FROM news_posts WHERE published = 1 ORDER BY pinned DESC, published_at DESC`
    : `SELECT * FROM news_posts ORDER BY pinned DESC, updated_at DESC`;
  return getDb().prepare(sql).all() as NewsPost[];
}

export function getNewsBySlug(slug: string): NewsPost | undefined {
  return getDb().prepare(`SELECT * FROM news_posts WHERE slug = ?`).get(slug) as NewsPost | undefined;
}

export function getNewsById(id: string): NewsPost | undefined {
  return getDb().prepare(`SELECT * FROM news_posts WHERE id = ?`).get(id) as NewsPost | undefined;
}

export function upsertNews(post: Partial<NewsPost> & { id: string; slug: string; title: string }) {
  const now = new Date().toISOString();
  const existing = getNewsById(post.id);
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
  return getNewsById(post.id)!;
}

export function deleteNews(id: string) {
  getDb().prepare(`DELETE FROM news_posts WHERE id = ?`).run(id);
}

export function listStaff(publishedOnly = true): StaffMember[] {
  const sql = publishedOnly
    ? `SELECT * FROM staff_members WHERE published = 1 ORDER BY ${STAFF_TIER_ORDER_SQL}, sort_order`
    : `SELECT * FROM staff_members ORDER BY ${STAFF_TIER_ORDER_SQL}, sort_order`;
  return getDb().prepare(sql).all() as StaffMember[];
}

export function getStaffById(id: string): StaffMember | undefined {
  return getDb().prepare(`SELECT * FROM staff_members WHERE id = ?`).get(id) as StaffMember | undefined;
}

export function upsertStaff(member: Partial<StaffMember> & { id: string; display_name: string; role: string }) {
  const now = new Date().toISOString();
  const existing = getStaffById(member.id);
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
  return getStaffById(member.id)!;
}

export function deleteStaff(id: string) {
  getDb().prepare(`DELETE FROM staff_members WHERE id = ?`).run(id);
}

export function mcRender(username: string | null | undefined) {
  if (username) return `https://render.crafty.gg/3d/full/${encodeURIComponent(username)}?x=-30&z=50`;
  return `https://render.crafty.gg/3d/full/Steve?x=-30&z=50`;
}

export function mcBust(username: string | null | undefined) {
  if (username) return `https://render.crafty.gg/3d/bust/${encodeURIComponent(username)}`;
  return `https://render.crafty.gg/3d/bust/Steve`;
}
