import type { APIRoute } from "astro";
import { confirmBetaTokenRemote } from "@/lib/beta-db";

export const prerender = false;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS };

/**
 * Step 2: the player confirmed the name and skin are theirs. This burns the
 * token and returns a single-use download link.
 */
export const POST: APIRoute = async ({ request, url }) => {
  let token = "";
  let buildId: string | undefined;
  try {
    const body = (await request.json()) as { token?: unknown; build_id?: unknown; confirmed?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
    buildId = typeof body.build_id === "string" && body.build_id ? body.build_id : undefined;
    if (body.confirmed === false) {
      return new Response(JSON.stringify({ error: "Identity not confirmed", reason: "unconfirmed" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Malformed body" }), { status: 400, headers: jsonHeaders });
  }
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token", reason: "missing" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const { status, data } = await confirmBetaTokenRemote(token, buildId);
  if (status >= 400) return new Response(JSON.stringify(data), { status, headers: jsonHeaders });

  return new Response(
    JSON.stringify({ ...data, url: new URL(`/api/beta/download/${data.download_id}`, url).toString() }),
    { status, headers: jsonHeaders },
  );
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });
