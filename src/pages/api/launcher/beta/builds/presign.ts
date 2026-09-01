import type { APIRoute } from "astro";
import { requireStaff } from "@/lib/auth";
import { presignBetaBuild } from "@/lib/beta-db";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

/** Mint a presigned R2 PUT URL so the admin's browser uploads the build directly
 *  to storage, bypassing the ~100 MB Worker request-body limit. */
export const POST: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = (await context.request.json().catch(() => ({}))) as {
    filename?: string;
    content_type?: string;
  };
  if (!body.filename) {
    return new Response(JSON.stringify({ error: "filename is required" }), { status: 400, headers: jsonHeaders });
  }

  const { status, data } = await presignBetaBuild({
    filename: body.filename,
    content_type: body.content_type,
  });
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};
