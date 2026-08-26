import type { APIRoute } from "astro";
import { requireStaff } from "@/lib/auth";
import { deleteBetaTester, listBetaTesters, upsertBetaTester } from "@/lib/beta-db";
import { getSessionToken, validateSession } from "@/lib/auth";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

/**
 * The beta roster: who is in the closed beta, with their Minecraft identity.
 * Emails are only attached for a signed-in staff session — the launcher and
 * anyone else gets names, UUIDs and skins.
 */
export const GET: APIRoute = async (context) => {
  const isStaff = await validateSession(getSessionToken(context));
  const { status, data } = await listBetaTesters(isStaff);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

export const POST: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = await context.request.json();
  const { status, data } = await upsertBetaTester(body);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

/** Convenience for the admin UI: DELETE /api/launcher/beta?id=… */
export const DELETE: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const id = context.url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: jsonHeaders });
  await deleteBetaTester(id);
  return new Response(null, { status: 204 });
};
