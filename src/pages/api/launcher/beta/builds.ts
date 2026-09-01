import type { APIRoute } from "astro";
import { requireStaff } from "@/lib/auth";
import {
  deleteBetaBuild,
  finalizeBetaBuild,
  listBetaBuilds,
  setBetaBuildActive,
  uploadBetaBuild,
} from "@/lib/beta-db";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export const GET: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const { status, data } = await listBetaBuilds(context.url.searchParams.get("active") === "1");
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

/**
 * Two shapes:
 *  - application/json  → finalize a direct-to-R2 upload (record the build row).
 *  - multipart/form-data (file, version, platform, notes) → legacy inline upload.
 */
export const POST: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const contentType = context.request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const meta = (await context.request.json().catch(() => ({}))) as Record<string, unknown>;
    const { status, data } = await finalizeBetaBuild(meta);
    return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
  }

  const form = await context.request.formData();
  const { status, data } = await uploadBetaBuild(form);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

export const PATCH: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = (await context.request.json()) as { id?: string; is_active?: boolean };
  if (!body.id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: jsonHeaders });
  const { status, data } = await setBetaBuildActive(body.id, body.is_active !== false);
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const id = context.url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400, headers: jsonHeaders });
  await deleteBetaBuild(id);
  return new Response(null, { status: 204 });
};
