import type { APIRoute } from "astro";
import { pingPresence } from "@/lib/db";
import { PING_INTERVAL_SECONDS, normalizeUuid } from "@/lib/presence";

export const prerender = false;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function reply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
  });
}

/**
 * Launcher heartbeat. The client posts its Minecraft UUID every
 * PING_INTERVAL_SECONDS; the UUID is resolved to a username (cached) and the
 * account counts as online until the ping goes stale.
 */
async function handle(uuid: unknown, username: unknown, launcherVersion: unknown) {
  const mcUuid = normalizeUuid(uuid);
  if (!mcUuid) {
    return reply({ error: "Missing or malformed Minecraft uuid" }, 400);
  }

  try {
    const result = await pingPresence({
      uuid: mcUuid,
      username: typeof username === "string" && username.trim() ? username.trim() : null,
      launcher_version:
        typeof launcherVersion === "string" && launcherVersion.trim()
          ? launcherVersion.trim()
          : null,
    });
    return reply(result);
  } catch (e) {
    return reply({ error: String(e), next_ping_seconds: PING_INTERVAL_SECONDS }, 502);
  }
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    const contentType = request.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, unknown>;
    } else {
      body = Object.fromEntries(await request.formData());
    }
  } catch {
    return reply({ error: "Malformed body" }, 400);
  }
  return handle(body.uuid ?? body.mc_uuid ?? body.id, body.username, body.launcher_version);
};

/** Convenience form for launchers that can only fire a GET. */
export const GET: APIRoute = async ({ url }) => {
  const p = url.searchParams;
  return handle(
    p.get("uuid") ?? p.get("mc_uuid") ?? p.get("id"),
    p.get("username"),
    p.get("launcher_version") ?? p.get("v"),
  );
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });
