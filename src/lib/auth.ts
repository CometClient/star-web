import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { APIContext } from "astro";
import { checkSession, persistSession, revokeSession } from "./db";

const SESSION_COOKIE = "comet_staff_session";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function staffCredentials() {
  const email = process.env.STAFF_EMAIL || "ray.dev@cometclient.dev";
  const password = process.env.STAFF_PASSWORD || "Cm7t_Xk9pR2mNwQ4";
  return { email, password };
}

export async function verifyLogin(email: string, password: string): Promise<boolean> {
  const creds = staffCredentials();
  if (email.toLowerCase() !== creds.email.toLowerCase()) return false;
  if (password === creds.password) return true;
  if (creds.password.startsWith("$2")) return bcrypt.compare(password, creds.password);
  return false;
}

export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await persistSession(hashToken(token), expires);
  return token;
}

export async function validateSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return checkSession(hashToken(token));
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  await revokeSession(hashToken(token));
}

export function getSessionToken(context: APIContext): string | undefined {
  return context.cookies.get(SESSION_COOKIE)?.value;
}

export function setSessionCookie(context: APIContext, token: string) {
  context.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export function clearSessionCookie(context: APIContext) {
  context.cookies.delete(SESSION_COOKIE, { path: "/" });
}

export async function requireStaff(context: APIContext): Promise<Response | null> {
  const token = getSessionToken(context);
  if (!(await validateSession(token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export { SESSION_COOKIE };
