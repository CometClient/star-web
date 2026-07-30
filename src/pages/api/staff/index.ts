import type { APIRoute } from "astro";
import { listStaff, upsertStaff } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export const GET: APIRoute = async ({ url }) => {
  const all = url.searchParams.get("all") === "1";
  return Response.json(await listStaff(!all));
};

export const POST: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = await context.request.json();
  const member = await upsertStaff({
    id: body.id || randomUUID(),
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
  return Response.json(member, { status: 201 });
};
