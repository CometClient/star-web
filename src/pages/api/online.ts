import type { APIRoute } from "astro";
import { countOnline, listOnline, mcBust, mcRender } from "@/lib/db";

export const prerender = false;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const TRUTHY = new Set(["1", "true", "yes", ""]);

/**
 * ?c (or ?c=true) → just the count and when it was last refreshed.
 * No ?c → the same header plus the list of online players.
 */
export const GET: APIRoute = async ({ url }) => {
  const c = url.searchParams.get("c");
  const countOnly = c !== null && TRUTHY.has(c.toLowerCase());

  try {
    const payload = countOnly
      ? await countOnline()
      : await (async () => {
          const data = await listOnline();
          return {
            ...data,
            players: data.players.map((p) => ({
              ...p,
              avatar_url: mcBust(p.username),
              render_url: mcRender(p.username),
            })),
          };
        })();

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Short cache: presence only moves as fast as the ping interval.
        "Cache-Control": "public, max-age=15",
        ...CORS,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });
