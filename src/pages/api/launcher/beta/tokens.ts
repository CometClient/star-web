import type { APIRoute } from "astro";
import { requireStaff } from "@/lib/auth";
import { createBetaToken, listBetaTokens, revokeBetaToken } from "@/lib/beta-db";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export const GET: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const testerId = context.url.searchParams.get("tester_id") ?? undefined;
  const { status, data } = await listBetaTokens(testerId);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

/** Returns the plaintext token exactly once — it is only stored hashed. */
export const POST: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = await context.request.json();
  const { status, data } = await createBetaToken(body);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const id = context.url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: jsonHeaders });
  await revokeBetaToken(id, context.url.searchParams.get("hard") === "1");
  return new Response(null, { status: 204 });
};
