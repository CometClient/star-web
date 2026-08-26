import { resolveUsername, undashUuid } from "./presence";

/** How long a minted one-time download link stays usable. */
export const DOWNLOAD_LINK_TTL_SECONDS = 300;

export interface BetaTester {
  id: string;
  display_name: string;
  mc_username: string | null;
  mc_uuid: string | null;
  email: string | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BetaToken {
  id: string;
  tester_id: string;
  token_hash: string;
  token_hint: string;
  label: string | null;
  build_id: string | null;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  revoked_at: string | null;
}

export interface BetaBuild {
  id: string;
  version: string;
  platform: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  sha256: string | null;
  storage_key: string;
  notes: string | null;
  is_active: number;
  created_at: string;
}

export interface BetaDownload {
  id: string;
  token_id: string;
  tester_id: string;
  build_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  ip_hash: string | null;
  user_agent: string | null;
}

export function generateBetaToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `cmt_${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export async function hashBetaToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token.trim()));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A non-secret fragment so staff can tell tokens apart in the admin list. */
export function tokenHint(token: string): string {
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

export async function sha256Hash(input: ArrayBuffer | string): Promise<string> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Skin renders shown on the "confirm it's you" step. */
export function skinUrls(username: string | null, uuid: string | null) {
  const name = username || "Steve";
  return {
    render_url: `https://render.crafty.gg/3d/full/${encodeURIComponent(name)}?x=-30&z=50`,
    bust_url: `https://render.crafty.gg/3d/bust/${encodeURIComponent(name)}`,
    skin_url: uuid ? `https://crafatar.com/skins/${undashUuid(uuid)}` : null,
  };
}

export { resolveUsername };
