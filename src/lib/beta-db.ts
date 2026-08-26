import { apiJson, apiRaw } from "@/lib/db-transport";

export interface BetaTesterRow {
  id: string;
  display_name: string;
  mc_username: string | null;
  mc_uuid: string | null;
  email?: string | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  render_url: string;
  bust_url: string;
  skin_url: string | null;
  tokens_issued?: number;
  tokens_active?: number;
  last_token_at?: string | null;
}

export interface BetaTokenRow {
  id: string;
  tester_id: string;
  token_hint: string;
  label: string | null;
  build_id: string | null;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  revoked_at: string | null;
  state: string;
  /** Present only in the response that created the token. */
  token?: string;
}

export interface BetaBuildRow {
  id: string;
  version: string;
  platform: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  sha256: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
}

export interface BetaVerifyResult {
  ok: true;
  token_id: string;
  tester: {
    id: string;
    display_name: string;
    mc_username: string | null;
    mc_uuid: string | null;
    render_url: string;
    bust_url: string;
    skin_url: string | null;
  };
  build: {
    id: string;
    version: string;
    platform: string;
    filename: string;
    size_bytes: number;
    sha256: string | null;
    notes: string | null;
  } | null;
  link_ttl_seconds: number;
}

export interface BetaConfirmResult {
  ok: true;
  download_id: string;
  expires_in: number;
  expires_at: string;
  build: { id: string; version: string; platform: string; filename: string; size_bytes: number };
}

export interface BetaAnalytics {
  totals: Record<string, number>;
  events_by_kind: { kind: string; count: number }[];
  recent_events: Record<string, unknown>[];
  downloads_by_build: Record<string, unknown>[];
  since: string;
  days: number;
}

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) s.set(k, v);
  const out = s.toString();
  return out ? `?${out}` : "";
};

export function listBetaTesters(includeEmail = false) {
  return apiJson<BetaTesterRow[]>(`/beta/testers${q({ full: includeEmail ? "1" : undefined })}`);
}

export function upsertBetaTester(body: Record<string, unknown>) {
  return apiJson<BetaTesterRow>("/beta/testers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteBetaTester(id: string) {
  return apiJson<unknown>(`/beta/testers/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listBetaTokens(testerId?: string) {
  return apiJson<BetaTokenRow[]>(`/beta/tokens${q({ tester_id: testerId })}`);
}

export function createBetaToken(body: Record<string, unknown>) {
  return apiJson<BetaTokenRow>("/beta/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function revokeBetaToken(id: string, hard = false) {
  return apiJson<unknown>(`/beta/tokens/${encodeURIComponent(id)}${q({ hard: hard ? "1" : undefined })}`, {
    method: "DELETE",
  });
}

export function listBetaBuilds(activeOnly = false) {
  return apiJson<BetaBuildRow[]>(`/beta/builds${q({ active: activeOnly ? "1" : undefined })}`);
}

/** Streams the multipart body straight through to the worker, which puts it in R2. */
export function uploadBetaBuild(form: FormData) {
  return apiJson<BetaBuildRow>("/beta/builds", { method: "POST", body: form });
}

export function setBetaBuildActive(id: string, isActive: boolean) {
  return apiJson<BetaBuildRow>(`/beta/builds/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function deleteBetaBuild(id: string) {
  return apiJson<unknown>(`/beta/builds/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function verifyBetaTokenRemote(token: string) {
  return apiJson<BetaVerifyResult & { error?: string; reason?: string }>("/beta/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export function confirmBetaTokenRemote(token: string, buildId?: string) {
  return apiJson<BetaConfirmResult & { error?: string; reason?: string }>("/beta/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, build_id: buildId }),
  });
}

/** Raw so the file body can be streamed back to the browser unbuffered. */
export function fetchBetaDownload(downloadId: string) {
  return apiRaw(`/beta/download/${encodeURIComponent(downloadId)}`);
}

export function betaAnalytics(days = 30) {
  return apiJson<BetaAnalytics>(`/beta/analytics${q({ days: String(days) })}`);
}
