import type { APIRoute } from "astro";
import { requireStaff } from "@/lib/auth";
import { betaAnalytics } from "@/lib/beta-db";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const denied = await requireStaff(context);
  if (denied) return denied;

  const days = Number(context.url.searchParams.get("days") ?? 30) || 30;
  const { status, data } = await betaAnalytics(days);
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
