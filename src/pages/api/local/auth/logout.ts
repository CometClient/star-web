import type { APIRoute } from "astro";
import { destroySession, getSessionToken, clearSessionCookie } from "@/lib/auth";

export const POST: APIRoute = async (context) => {
  await destroySession(getSessionToken(context));
  clearSessionCookie(context);
  return Response.json({ ok: true });
};
