import type { Env } from "./queries";
import {
  corsHeaders,
  createSession,
  deleteNews,
  deleteStaff,
  destroySession,
  getLatestLauncherVersion,
  getNewsBySlug,
  getStaffById,
  json,
  listLauncherAnnouncements,
  listLauncherVersions,
  listNews,
  listStaff,
  requireSecret,
  slugify,
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
