import type { APIRoute } from "astro";
import { verifyLogin, createSession, setSessionCookie } from "@/lib/auth";

export const POST: APIRoute = async (context) => {
  const body = await context.request.json();
  const ok = await verifyLogin(body.email ?? "", body.password ?? "");
  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = await createSession();
  setSessionCookie(context, token);
  return Response.json({ ok: true });
};
