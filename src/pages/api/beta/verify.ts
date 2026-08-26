import type { APIRoute } from "astro";
import { verifyBetaTokenRemote } from "@/lib/beta-db";

export const prerender = false;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS };

/**
 * Step 1 of the beta flow: check the token and hand back the identity the
 * player is asked to confirm. Nothing is consumed here — the token stays
 * valid until /api/beta/confirm.
 */
export const POST: APIRoute = async ({ request }) => {
  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Malformed body" }), { status: 400, headers: jsonHeaders });
  }
  if (!token) {
    return new Response(JSON.stringify({ error: "Enter your beta token", reason: "missing" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const { status, data } = await verifyBetaTokenRemote(token);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });
