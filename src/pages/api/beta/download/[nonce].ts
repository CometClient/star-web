import type { APIRoute } from "astro";
import { fetchBetaDownload } from "@/lib/beta-db";

export const prerender = false;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Let a browser-based launcher read the filename it should save as.
  "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
};

/**
 * Step 3: the single-use link. The worker claims the link before it streams,
 * so a second request — even a concurrent one — gets 410 instead of the file.
 */
export const GET: APIRoute = async ({ params }) => {
  const nonce = String(params.nonce ?? "");
  if (!/^[A-Za-z0-9_-]+$/.test(nonce)) {
    return new Response(JSON.stringify({ error: "Invalid link", reason: "invalid" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const res = await fetchBetaDownload(nonce);
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });
