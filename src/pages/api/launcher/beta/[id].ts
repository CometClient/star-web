import type { APIRoute } from "astro";
import { requireStaff } from "@/lib/auth";
import { deleteBetaTester, upsertBetaTester } from "@/lib/beta-db";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export const PUT: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const body = await context.request.json();
  const { status, data } = await upsertBetaTester({ ...body, id: context.params.id });
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
};

export const DELETE: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  await deleteBetaTester(String(context.params.id));
  return new Response(null, { status: 204 });
};
