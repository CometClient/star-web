import type { APIRoute } from "astro";
import { getStaffById, upsertStaff, deleteStaff } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export const PUT: APIRoute = async (context) => {
  const denied = requireStaff(context);
  if (denied) return denied;

  const id = context.params.id!;
  const existing = getStaffById(id);
  const body = await context.request.json();

  const member = upsertStaff({
    id,
    display_name: body.display_name ?? existing?.display_name ?? "",
    mc_username: body.mc_username,
    mc_uuid: body.mc_uuid,
    role: body.role ?? existing?.role ?? "",
    role_tier: body.role_tier ?? existing?.role_tier ?? "team",
    bio: body.bio,
    avatar_url: body.avatar_url,
    sort_order: body.sort_order ?? existing?.sort_order ?? 0,
    published: body.published !== false ? 1 : 0,
  });
  return Response.json(member);
};

export const DELETE: APIRoute = async (context) => {
  const denied = requireStaff(context);
  if (denied) return denied;
  deleteStaff(context.params.id!);
  return new Response(null, { status: 204 });
};
