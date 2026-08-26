import type { Env } from "./queries";
import { handleBetaRoute } from "./beta-routes";
import {
  NAME_TTL_SECONDS,
  PING_INTERVAL_SECONDS,
  PRESENCE_RETENTION_SECONDS,
  PRESENCE_WINDOW_SECONDS,
  isoSecondsAgo,
  normalizeUuid,
  resolveUsernameDetailed,
} from "./presence";
import {
  corsHeaders,
  countOnlinePresence,
  createSession,
  deleteNews,
  deleteStaff,
  destroySession,
  getLatestLauncherVersion,
  getNewsBySlug,
  getPresence,
  getStaffById,
  json,
  listLauncherAnnouncements,
  listLauncherVersions,
  listNews,
  listOnlinePresence,
  listStaff,
  requireSecret,
  slugify,
  touchPresence,
  upsertNews,
  upsertStaff,
  validateSession,
} from "./queries";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const attachCors = (res: Response) => {
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
        return res;
      };

      // Health
      if (path === "/" || path === "/health") {
        return attachCors(json({ ok: true, service: "comet-db" }));
      }

      // --- Public reads ---
      if (path === "/news" && request.method === "GET") {
        const all = url.searchParams.get("all") === "1";
        return attachCors(json(await listNews(env.DB, !all)));
      }

      const newsSlug = path.match(/^\/news\/([^/]+)$/);
      if (newsSlug && request.method === "GET") {
        const post = await getNewsBySlug(env.DB, decodeURIComponent(newsSlug[1]));
        if (!post || !(post as { published: number }).published) {
          return attachCors(json({ error: "Not found" }, 404));
        }
        return attachCors(json(post));
      }

      if (path === "/staff" && request.method === "GET") {
        const all = url.searchParams.get("all") === "1";
        return attachCors(json(await listStaff(env.DB, !all)));
      }

      if (path === "/launcher/announcements" && request.method === "GET") {
        return attachCors(
          json(await listLauncherAnnouncements(env.DB, true), 200, {
            "Cache-Control": "public, max-age=30",
          }),
        );
      }

      if (path === "/launcher/version" && request.method === "GET") {
        const all = url.searchParams.get("all");
        if (all === "1" || all === "true") {
          return attachCors(
            json(await listLauncherVersions(env.DB, true), 200, {
              "Cache-Control": "public, max-age=60",
            }),
          );
        }
        const latest = await getLatestLauncherVersion(env.DB);
        if (!latest) return attachCors(json({ error: "No published version" }, 404));
        return attachCors(
          json(latest, 200, { "Cache-Control": "public, max-age=60" }),
        );
      }

      if (path === "/launcher/online" && request.method === "GET") {
        const countOnly = ["1", "true", "yes"].includes(
          (url.searchParams.get("c") ?? "").toLowerCase(),
        );
        const now = new Date();
        const since = isoSecondsAgo(PRESENCE_WINDOW_SECONDS, now);
        const headers = { "Cache-Control": "public, max-age=15" };

        if (countOnly) {
          const { count, last_ping } = await countOnlinePresence(env.DB, since);
          return attachCors(
            json(
              {
                count,
                last_ping,
                updated_at: now.toISOString(),
                window_seconds: PRESENCE_WINDOW_SECONDS,
              },
              200,
              headers,
            ),
          );
        }

        const rows = await listOnlinePresence(env.DB, since);
        return attachCors(
          json(
            {
              count: rows.length,
              last_ping: rows[0]?.last_seen ?? null,
              updated_at: now.toISOString(),
              window_seconds: PRESENCE_WINDOW_SECONDS,
              players: rows.map((row) => ({
                uuid: row.mc_uuid,
                username: row.mc_username,
                launcher_version: row.launcher_version,
                first_seen: row.first_seen,
                last_seen: row.last_seen,
                seconds_since_ping: Math.max(
                  0,
                  Math.round((now.getTime() - Date.parse(row.last_seen)) / 1000),
                ),
              })),
            },
            200,
            headers,
          ),
        );
      }

      // --- Protected writes (frontend proxies with X-Comet-Secret) ---
      const denied = requireSecret(request, env);
      if (denied && request.method !== "GET") {
        // only block mutating routes below; GET already handled
      }

      if (path === "/news" && request.method === "POST") {
        if (denied) return attachCors(denied);
        const body = (await request.json()) as Record<string, unknown>;
        const id = String(body.id || crypto.randomUUID());
        const slug = String(body.slug || slugify(String(body.title || id)));
        const post = await upsertNews(env.DB, {
          id,
          slug,
          title: body.title,
          excerpt: body.excerpt,
          body_md: body.body_md ?? "",
          cover_url: body.cover_url,
          published: body.published ? 1 : 0,
          published_at: body.published ? body.published_at || new Date().toISOString() : null,
          author: body.author,
          mc_author_username: body.mc_author_username,
          pinned: body.pinned ? 1 : 0,
        });
        return attachCors(json(post, 201));
      }

      if (newsSlug && request.method === "PUT") {
        if (denied) return attachCors(denied);
        const slug = decodeURIComponent(newsSlug[1]);
        const existing = await getNewsBySlug(env.DB, slug);
        const body = (await request.json()) as Record<string, unknown>;
        const id = String(body.id || (existing as { id: string } | null)?.id);
        if (!id) return attachCors(json({ error: "Not found" }, 404));
        const post = await upsertNews(env.DB, {
          id,
          slug: String(body.slug || slug),
          title: body.title,
          excerpt: body.excerpt,
          body_md: body.body_md ?? "",
          cover_url: body.cover_url,
          published: body.published ? 1 : 0,
          published_at: body.published ? body.published_at || new Date().toISOString() : null,
          author: body.author,
          mc_author_username: body.mc_author_username,
          pinned: body.pinned ? 1 : 0,
        });
        return attachCors(json(post));
      }

      if (newsSlug && request.method === "DELETE") {
        if (denied) return attachCors(denied);
        const slug = decodeURIComponent(newsSlug[1]);
        const existing = await getNewsBySlug(env.DB, slug);
        if (!existing) return attachCors(json({ error: "Not found" }, 404));
        await deleteNews(env.DB, (existing as { id: string }).id);
        return attachCors(new Response(null, { status: 204, headers: cors }));
      }

      if (path === "/staff" && request.method === "POST") {
        if (denied) return attachCors(denied);
        const body = (await request.json()) as Record<string, unknown>;
        const member = await upsertStaff(env.DB, {
          id: String(body.id || crypto.randomUUID()),
          display_name: body.display_name,
          mc_username: body.mc_username,
          mc_uuid: body.mc_uuid,
          role: body.role,
          role_tier: body.role_tier || "support",
          bio: body.bio,
          avatar_url: body.avatar_url,
          sort_order: body.sort_order ?? 0,
          published: body.published !== false ? 1 : 0,
        });
        return attachCors(json(member, 201));
      }

      const staffId = path.match(/^\/staff\/([^/]+)$/);
      if (staffId && request.method === "PUT") {
        if (denied) return attachCors(denied);
        const id = decodeURIComponent(staffId[1]);
        const existing = await getStaffById(env.DB, id);
        const body = (await request.json()) as Record<string, unknown>;
        const member = await upsertStaff(env.DB, {
          id,
          display_name: body.display_name ?? (existing as { display_name: string } | null)?.display_name ?? "",
          mc_username: body.mc_username,
          mc_uuid: body.mc_uuid,
          role: body.role ?? (existing as { role: string } | null)?.role ?? "",
          role_tier: body.role_tier ?? (existing as { role_tier: string } | null)?.role_tier ?? "support",
          bio: body.bio,
          avatar_url: body.avatar_url,
          sort_order: body.sort_order ?? (existing as { sort_order: number } | null)?.sort_order ?? 0,
          published: body.published !== false ? 1 : 0,
        });
        return attachCors(json(member));
      }

      if (staffId && request.method === "DELETE") {
        if (denied) return attachCors(denied);
        await deleteStaff(env.DB, decodeURIComponent(staffId[1]));
        return attachCors(new Response(null, { status: 204, headers: cors }));
      }

      if (path === "/launcher/ping" && request.method === "POST") {
        if (denied) return attachCors(denied);
        const body = (await request.json()) as Record<string, unknown>;
        const uuid = normalizeUuid(body.uuid ?? body.mc_uuid ?? body.id);
        if (!uuid) return attachCors(json({ error: "Invalid or missing uuid" }, 400));

        const now = new Date();
        const existing = await getPresence(env.DB, uuid);

        // Only hit Mojang when we have no name yet or the cached one is stale;
        // a launcher pinging every couple of minutes must not become a scraper.
        const nameStale =
          !existing?.mc_username ||
          !existing.name_checked_at ||
          Date.parse(existing.name_checked_at) < now.getTime() - NAME_TTL_SECONDS * 1000;

        let username = existing?.mc_username ?? null;
        let nameCheckedAt: string | null = null;
        let resolveAttempts: unknown[] = [];
        if (nameStale) {
          const resolved = await resolveUsernameDetailed(uuid);
          resolveAttempts = resolved.attempts;
          if (resolved.username) {
            username = resolved.username;
            nameCheckedAt = now.toISOString();
          } else if (typeof body.username === "string" && body.username.trim()) {
            // Every provider failed: fall back to the launcher's claim, but
            // leave name_checked_at unset so we retry on the next ping.
            username = body.username.trim();
          }
        }

        const row = await touchPresence(
          env.DB,
          {
            mc_uuid: uuid,
            mc_username: username,
            launcher_version:
              typeof body.launcher_version === "string" ? body.launcher_version : null,
            name_checked_at: nameCheckedAt,
          },
          now.toISOString(),
          isoSecondsAgo(PRESENCE_RETENTION_SECONDS, now),
        );

        return attachCors(
          json({
            ok: true,
            uuid,
            username: row?.mc_username ?? username,
            first_seen: row?.first_seen ?? now.toISOString(),
            last_seen: row?.last_seen ?? now.toISOString(),
            next_ping_seconds: PING_INTERVAL_SECONDS,
            ...(url.searchParams.get("debug") === "1" ? { resolve_attempts: resolveAttempts } : {}),
          }),
        );
      }

      // Beta: testers, tokens, uploaded builds, one-time download links.
      if (path.startsWith("/beta")) {
        if (denied) return attachCors(denied);
        const handled = await handleBetaRoute(request, env, path, url);
        if (handled) return attachCors(handled);
      }

      // Internal session API (Astro auth proxy)
      if (path === "/internal/sessions" && request.method === "POST") {
        if (denied) return attachCors(denied);
        const body = (await request.json()) as { token_hash: string; expires_at: string };
        await createSession(env.DB, body.token_hash, body.expires_at);
        return attachCors(json({ ok: true }));
      }

      if (path === "/internal/sessions/validate" && request.method === "POST") {
        if (denied) return attachCors(denied);
        const body = (await request.json()) as { token_hash: string };
        const ok = await validateSession(env.DB, body.token_hash);
        return attachCors(json({ valid: ok }));
      }

      if (path === "/internal/sessions" && request.method === "DELETE") {
        if (denied) return attachCors(denied);
        const body = (await request.json()) as { token_hash: string };
        await destroySession(env.DB, body.token_hash);
        return attachCors(json({ ok: true }));
      }

      return attachCors(json({ error: "Not found" }, 404));
    } catch (e) {
      return json({ error: String(e) }, 500, cors);
    }
  },
};
