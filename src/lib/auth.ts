import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { APIContext } from "astro";
import { getDb } from "./db";

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

export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  const id = randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  getDb()
    .prepare(`INSERT INTO staff_sessions (id, token_hash, expires_at) VALUES (?, ?, ?)`)
    .run(id, hashToken(token), expires);
  return token;
}

export function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const row = getDb()
    .prepare(`SELECT expires_at FROM staff_sessions WHERE token_hash = ?`)
    .get(hashToken(token)) as { expires_at: string } | undefined;
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) {
    getDb().prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).run(hashToken(token));
    return false;
  }
  return true;
}

export function destroySession(token: string | undefined) {
  if (!token) return;
  getDb().prepare(`DELETE FROM staff_sessions WHERE token_hash = ?`).run(hashToken(token));
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

export function requireStaff(context: APIContext): Response | null {
  const token = getSessionToken(context);
  if (!validateSession(token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export { SESSION_COOKIE };
