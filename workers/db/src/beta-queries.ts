import type { BetaBuild, BetaDownload, BetaTester, BetaToken } from "./beta";

export async function listTesters(db: D1Database) {
  const rows = await db
    .prepare(`SELECT * FROM beta_testers ORDER BY created_at DESC`)
    .all<BetaTester>();
  return rows.results ?? [];
}

export async function getTester(db: D1Database, id: string) {
  return db.prepare(`SELECT * FROM beta_testers WHERE id = ?`).bind(id).first<BetaTester>();
}

export async function upsertTester(db: D1Database, tester: BetaTester) {
  await db
    .prepare(
      `INSERT INTO beta_testers (id, display_name, mc_username, mc_uuid, email, note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         display_name = excluded.display_name,
         mc_username = excluded.mc_username,
         mc_uuid = excluded.mc_uuid,
         email = excluded.email,
         note = excluded.note,
         status = excluded.status,
         updated_at = excluded.updated_at`,
    )
    .bind(
      tester.id,
      tester.display_name,
      tester.mc_username,
      tester.mc_uuid,
      tester.email,
      tester.note,
      tester.status,
      tester.created_at,
      tester.updated_at,
    )
    .run();
  return getTester(db, tester.id);
}

export async function deleteTester(db: D1Database, id: string) {
  // D1 does not enable foreign keys by default, so clear dependants explicitly.
  await db.batch([
    db.prepare(`DELETE FROM beta_tokens WHERE tester_id = ?`).bind(id),
    db.prepare(`DELETE FROM beta_downloads WHERE tester_id = ?`).bind(id),
    db.prepare(`DELETE FROM beta_testers WHERE id = ?`).bind(id),
  ]);
}

export async function listTokens(db: D1Database, testerId?: string) {
  const sql = testerId
    ? `SELECT * FROM beta_tokens WHERE tester_id = ? ORDER BY created_at DESC`
    : `SELECT * FROM beta_tokens ORDER BY created_at DESC`;
  const stmt = testerId ? db.prepare(sql).bind(testerId) : db.prepare(sql);
  return (await stmt.all<BetaToken>()).results ?? [];
}

export async function createToken(db: D1Database, token: BetaToken) {
  await db
    .prepare(
      `INSERT INTO beta_tokens (id, tester_id, token_hash, token_hint, label, build_id, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      token.id,
      token.tester_id,
      token.token_hash,
      token.token_hint,
      token.label,
      token.build_id,
      token.created_at,
      token.expires_at,
    )
    .run();
  return db.prepare(`SELECT * FROM beta_tokens WHERE id = ?`).bind(token.id).first<BetaToken>();
}

export async function getTokenByHash(db: D1Database, hash: string) {
  return db.prepare(`SELECT * FROM beta_tokens WHERE token_hash = ?`).bind(hash).first<BetaToken>();
}

export async function revokeToken(db: D1Database, id: string, now: string) {
  await db
    .prepare(`UPDATE beta_tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`)
    .bind(now, id)
    .run();
}

export async function deleteToken(db: D1Database, id: string) {
  await db.prepare(`DELETE FROM beta_tokens WHERE id = ?`).bind(id).run();
}

/**
 * Burn the token and mint its one-time link in one shot. The conditional
 * UPDATE is the lock: if two requests race, only the one that actually
 * changed a row gets to create the download.
 */
export async function redeemToken(
  db: D1Database,
  token: BetaToken,
  download: BetaDownload,
  now: string,
): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE beta_tokens SET redeemed_at = ?
         WHERE id = ? AND redeemed_at IS NULL AND revoked_at IS NULL`,
    )
    .bind(now, token.id)
    .run();
  if (!res.meta.changes) return false;

  await db
    .prepare(
      `INSERT INTO beta_downloads (id, token_id, tester_id, build_id, created_at, expires_at, ip_hash, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      download.id,
      download.token_id,
      download.tester_id,
      download.build_id,
      download.created_at,
      download.expires_at,
      download.ip_hash,
      download.user_agent,
    )
    .run();
  return true;
}

export async function getDownload(db: D1Database, id: string) {
  return db.prepare(`SELECT * FROM beta_downloads WHERE id = ?`).bind(id).first<BetaDownload>();
}

/** Same conditional-update trick: the first caller to flip used_at wins. */
export async function consumeDownload(db: D1Database, id: string, now: string): Promise<boolean> {
  const res = await db
    .prepare(`UPDATE beta_downloads SET used_at = ? WHERE id = ? AND used_at IS NULL AND expires_at > ?`)
    .bind(now, id, now)
    .run();
  return Boolean(res.meta.changes);
}

export async function listBuilds(db: D1Database, activeOnly = false) {
  const sql = activeOnly
    ? `SELECT * FROM beta_builds WHERE is_active = 1 ORDER BY created_at DESC`
    : `SELECT * FROM beta_builds ORDER BY created_at DESC`;
  return (await db.prepare(sql).all<BetaBuild>()).results ?? [];
}

export async function getBuild(db: D1Database, id: string) {
  return db.prepare(`SELECT * FROM beta_builds WHERE id = ?`).bind(id).first<BetaBuild>();
}

export async function getLatestBuild(db: D1Database) {
  return db
    .prepare(`SELECT * FROM beta_builds WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1`)
    .first<BetaBuild>();
}

export async function createBuild(db: D1Database, build: BetaBuild) {
  await db
    .prepare(
      `INSERT INTO beta_builds (id, version, platform, filename, content_type, size_bytes, sha256, storage_key, notes, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      build.id,
      build.version,
      build.platform,
      build.filename,
      build.content_type,
      build.size_bytes,
      build.sha256,
      build.storage_key,
      build.notes,
      build.is_active,
      build.created_at,
    )
    .run();
  return getBuild(db, build.id);
}

export async function setBuildActive(db: D1Database, id: string, active: boolean) {
  await db.prepare(`UPDATE beta_builds SET is_active = ? WHERE id = ?`).bind(active ? 1 : 0, id).run();
  return getBuild(db, id);
}

export async function deleteBuild(db: D1Database, id: string) {
  await db.prepare(`DELETE FROM beta_builds WHERE id = ?`).bind(id).run();
}

export async function logEvent(
  db: D1Database,
  event: {
    kind: string;
    tester_id?: string | null;
    token_id?: string | null;
    build_id?: string | null;
    detail?: string | null;
  },
  now: string,
) {
  await db
    .prepare(
      `INSERT INTO beta_events (kind, tester_id, token_id, build_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      event.kind,
      event.tester_id ?? null,
      event.token_id ?? null,
      event.build_id ?? null,
      event.detail ?? null,
      now,
    )
    .run();
}

export async function betaAnalytics(db: D1Database, since: string) {
  const [totals, byKind, recent, perBuild] = await db.batch([
    db.prepare(
      `SELECT
         (SELECT COUNT(*) FROM beta_testers)                              AS testers,
         (SELECT COUNT(*) FROM beta_testers WHERE status = 'active')      AS active_testers,
         (SELECT COUNT(*) FROM beta_tokens)                               AS tokens_issued,
         (SELECT COUNT(*) FROM beta_tokens WHERE redeemed_at IS NOT NULL) AS tokens_redeemed,
         (SELECT COUNT(*) FROM beta_tokens
            WHERE redeemed_at IS NULL AND revoked_at IS NULL)             AS tokens_outstanding,
         (SELECT COUNT(*) FROM beta_downloads WHERE used_at IS NOT NULL)  AS downloads,
         (SELECT COUNT(*) FROM beta_downloads
            WHERE used_at IS NULL AND expires_at > datetime('now'))       AS links_pending,
         (SELECT COUNT(*) FROM beta_builds WHERE is_active = 1)           AS active_builds`,
    ),
    db.prepare(
      `SELECT kind, COUNT(*) AS count FROM beta_events WHERE created_at >= ? GROUP BY kind`,
    ).bind(since),
    db.prepare(
      `SELECT e.*, t.display_name AS tester_name
         FROM beta_events e
         LEFT JOIN beta_testers t ON t.id = e.tester_id
        ORDER BY e.created_at DESC LIMIT 50`,
    ),
    db.prepare(
      `SELECT b.id, b.version, b.platform, b.filename,
              COUNT(d.id) FILTER (WHERE d.used_at IS NOT NULL) AS downloads
         FROM beta_builds b
         LEFT JOIN beta_downloads d ON d.build_id = b.id
        GROUP BY b.id ORDER BY b.created_at DESC`,
    ),
  ]);

  return {
    totals: totals.results?.[0] ?? {},
    events_by_kind: byKind.results ?? [],
    recent_events: recent.results ?? [],
    downloads_by_build: perBuild.results ?? [],
    since,
  };
}
