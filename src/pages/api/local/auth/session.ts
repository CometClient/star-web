import type { APIRoute } from "astro";
import { getSessionToken, validateSession } from "@/lib/auth";

export const GET: APIRoute = async (context) => {
  const token = getSessionToken(context);
  return Response.json({ authenticated: await validateSession(token) });
};
