import { useCallback, useEffect, useState } from "react";
import { platformLabel } from "@/lib/beta-platforms";

type Tester = {
  id: string;
  display_name: string;
  mc_username: string | null;
  mc_uuid: string | null;
  email?: string | null;
  note: string | null;
  status: string;
  created_at: string;
  bust_url: string;
  tokens_issued?: number;
  tokens_active?: number;
};

type Token = {
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
  token?: string;
};

type Build = {
  id: string;
  version: string;
  platform: string;
  filename: string;
  size_bytes: number;
  sha256: string | null;
  notes: string | null;
  is_active: number;
  created_at: string;
};

type Analytics = {
  totals: Record<string, number>;
  events_by_kind: { kind: string; count: number }[];
  recent_events: Record<string, unknown>[];
  downloads_by_build: Record<string, unknown>[];
  days: number;
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-pink-400/40";
const labelClass = "mb-1 block text-xs uppercase tracking-wider text-white/40";
const btnPrimary = "rounded-lg bg-pink-300/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-pink-200 disabled:opacity-50";
const btnGhost = "rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 disabled:opacity-50";

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="text-2xl font-semibold">{value ?? 0}</div>
      <div className="text-xs uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}

/** PUT a file straight to a presigned URL, reporting upload progress (0–100). */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage upload failed (${xhr.status})`));
    xhr.onerror = () =>
      reject(new Error("Storage upload failed — check the bucket's CORS policy allows PUT from this site."));
    // No Content-Type header: it isn't part of the presigned signature, so
    // sending one risks a signature mismatch on some S3 implementations.
    xhr.send(file);
  });
}

// Hashing reads the whole file into memory, so only fingerprint builds under this
// size in the browser; larger ones store no sha256 (the size + R2 etag still verify).
const SHA256_MAX_BYTES = 512 * 1024 * 1024;

async function maybeSha256(file: File): Promise<string | null> {
  if (file.size > SHA256_MAX_BYTES || !globalThis.crypto?.subtle) return null;
  try {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export default function BetaAdmin() {
  const [section, setSection] = useState<"testers" | "builds" | "analytics">("testers");
  const [testers, setTesters] = useState<Tester[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState<Partial<Tester> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  /** Plaintext tokens live only in this component, only until the page reloads. */
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const [upload, setUpload] = useState({ version: "", platform: "windows-x64", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const loadTesters = useCallback(async () => {
    const res = await fetch("/api/launcher/beta");
    if (res.ok) setTesters(await res.json());
  }, []);

  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/launcher/beta/tokens");
    if (res.ok) setTokens(await res.json());
  }, []);

  const loadBuilds = useCallback(async () => {
    const res = await fetch("/api/launcher/beta/builds");
    if (res.ok) setBuilds(await res.json());
  }, []);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch("/api/launcher/beta/analytics?days=30");
    if (res.ok) setAnalytics(await res.json());
  }, []);

  useEffect(() => {
    loadTesters();
    loadTokens();
    loadBuilds();
    loadAnalytics();
  }, [loadTesters, loadTokens, loadBuilds, loadAnalytics]);

  const saveTester = async () => {
    if (!draft?.display_name && !draft?.mc_username) {
      setError("Give the tester a display name or Minecraft username.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/launcher/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save tester");
      return;
    }
    setDraft(null);
    await Promise.all([loadTesters(), loadTokens()]);
  };

  const removeTester = async (t: Tester) => {
    if (!confirm(`Remove ${t.display_name} from the beta? Their tokens are deleted too.`)) return;
    await fetch(`/api/launcher/beta/${t.id}`, { method: "DELETE" });
    await Promise.all([loadTesters(), loadTokens(), loadAnalytics()]);
  };

  const issueToken = async (testerId: string) => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/launcher/beta/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tester_id: testerId }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not issue token");
      return;
    }
    setRevealed((prev) => ({ ...prev, [data.id]: data.token }));
    setExpanded(testerId);
    await Promise.all([loadTokens(), loadTesters(), loadAnalytics()]);
  };

  const revokeToken = async (id: string) => {
    await fetch(`/api/launcher/beta/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await Promise.all([loadTokens(), loadTesters(), loadAnalytics()]);
  };

  const finishUpload = async () => {
    setFile(null);
    setUpload({ version: "", platform: "windows-x64", notes: "" });
    await Promise.all([loadBuilds(), loadAnalytics()]);
  };

  /** Legacy path: stream the file through the workers (bounded by the ~100 MB
   *  request-body limit). Used only when R2 direct upload isn't configured. */
  const uploadInline = async (version: string, platform: string) => {
    const form = new FormData();
    form.set("file", file!);
    form.set("version", version);
    form.set("platform", platform);
    form.set("notes", upload.notes);
    const res = await fetch("/api/launcher/beta/builds", { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Upload failed");
    await finishUpload();
  };

  const uploadBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !upload.version.trim()) {
      setError("Pick a file and set a version.");
      return;
    }
    const version = upload.version.trim();
    const platform = upload.platform.trim() || "universal";
    setUploading(true);
    setError("");
    setProgress(0);
    try {
      // 1. Ask for a presigned R2 URL (skips the worker body limit).
      const presRes = await fetch("/api/launcher/beta/builds/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type }),
      });
      if (presRes.status === 501) {
        // Direct upload not configured — fall back to streaming through the worker.
        setProgress(null);
        await uploadInline(version, platform);
        return;
      }
      if (!presRes.ok) {
        throw new Error((await presRes.json().catch(() => ({}))).error ?? "Could not start upload");
      }
      const { id, storage_key, upload_url } = (await presRes.json()) as {
        id: string;
        storage_key: string;
        upload_url: string;
      };

      // 2. PUT the file straight to R2, reporting progress.
      await putWithProgress(upload_url, file, setProgress);

      // 3. Fingerprint smaller builds in the browser (skip very large ones).
      const sha256 = await maybeSha256(file);

      // 4. Record the build row.
      const finRes = await fetch("/api/launcher/beta/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          storage_key,
          version,
          platform,
          notes: upload.notes,
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          sha256,
        }),
      });
      if (!finRes.ok) {
        throw new Error((await finRes.json().catch(() => ({}))).error ?? "Could not save build");
      }
      await finishUpload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const toggleBuild = async (b: Build) => {
    await fetch("/api/launcher/beta/builds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, is_active: !b.is_active }),
    });
    await loadBuilds();
  };

  const deleteBuild = async (b: Build) => {
    if (!confirm(`Delete ${b.filename}? The file is removed from storage.`)) return;
    await fetch(`/api/launcher/beta/builds?id=${encodeURIComponent(b.id)}`, { method: "DELETE" });
    await Promise.all([loadBuilds(), loadAnalytics()]);
  };

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(["testers", "builds", "analytics"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${section === s ? "bg-white/10 text-white" : "text-white/45 hover:text-white"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}

      {section === "testers" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[Fastelar] text-xl">Beta testers</h2>
            <button type="button" className={btnPrimary} onClick={() => setDraft({ status: "active" })}>
              Add tester
            </button>
          </div>

          {draft && (
            <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Display name</label>
                  <input
                    className={inputClass}
                    value={draft.display_name ?? ""}
                    onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Minecraft UUID</label>
                  <input
                    className={inputClass}
                    placeholder="dashed or plain — the username is resolved for you"
                    value={draft.mc_uuid ?? ""}
                    onChange={(e) => setDraft({ ...draft, mc_uuid: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Minecraft username</label>
                  <input
                    className={inputClass}
                    value={draft.mc_username ?? ""}
                    onChange={(e) => setDraft({ ...draft, mc_username: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email (staff only)</label>
                  <input
                    className={inputClass}
                    type="email"
                    value={draft.email ?? ""}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Note</label>
                  <input
                    className={inputClass}
                    value={draft.note ?? ""}
                    onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    className={inputClass}
                    value={draft.status ?? "active"}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="revoked">revoked</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="button" className={btnPrimary} disabled={busy} onClick={saveTester}>
                  Save
                </button>
                <button type="button" className={btnGhost} onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {testers.map((t) => {
              const mine = tokens.filter((tok) => tok.tester_id === t.id);
              return (
                <div key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={t.bust_url} alt="" className="h-9 w-9 rounded" />
                      <div>
                        <p className="font-medium">
                          {t.display_name}
                          {t.status !== "active" && (
                            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">
                              {t.status}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/35">
                          {t.mc_username ?? "no username"} · {t.mc_uuid ?? "no uuid"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/35">
                        {t.tokens_active ?? 0} active / {t.tokens_issued ?? 0} issued
                      </span>
                      <button type="button" className={btnGhost} disabled={busy} onClick={() => issueToken(t.id)}>
                        Issue token
                      </button>
                      <button
                        type="button"
                        className="text-sm text-pink-300/80 hover:text-pink-200"
                        onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      >
                        {expanded === t.id ? "Hide" : "Tokens"}
                      </button>
                      <button type="button" className="text-sm text-white/45 hover:text-white" onClick={() => setDraft(t)}>
                        Edit
                      </button>
                      <button type="button" className="text-sm text-red-400/70 hover:text-red-300" onClick={() => removeTester(t)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  {expanded === t.id && (
                    <div className="border-t border-white/10 px-4 py-3">
                      {mine.length === 0 && <p className="text-sm text-white/35">No tokens issued yet.</p>}
                      {mine.map((tok) => (
                        <div key={tok.id} className="flex items-center justify-between py-1.5 text-sm">
                          <div>
                            <span className="font-mono text-white/70">{revealed[tok.id] ?? tok.token_hint}</span>
                            {revealed[tok.id] && (
                              <span className="ml-2 text-[10px] uppercase text-amber-300">copy now — shown once</span>
                            )}
                            <span className="ml-2 text-xs text-white/35">
                              {tok.state}
                              {tok.redeemed_at ? ` · redeemed ${new Date(tok.redeemed_at).toLocaleString()}` : ""}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {revealed[tok.id] && (
                              <button
                                type="button"
                                className={btnGhost}
                                onClick={() => navigator.clipboard.writeText(revealed[tok.id])}
                              >
                                Copy
                              </button>
                            )}
                            {tok.state === "active" && (
                              <button type="button" className="text-sm text-red-400/70" onClick={() => revokeToken(tok.id)}>
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {testers.length === 0 && <p className="text-sm text-white/35">Nobody in the beta yet.</p>}
          </div>
        </div>
      )}

      {section === "builds" && (
        <div>
          <h2 className="mb-4 font-[Fastelar] text-xl">Beta builds</h2>

          <form onSubmit={uploadBuild} className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Version</label>
                <input
                  className={inputClass}
                  placeholder="1.21.4-beta.3"
                  value={upload.version}
                  onChange={(e) => setUpload({ ...upload, version: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Platform</label>
                <select
                  className={inputClass}
                  value={upload.platform}
                  onChange={(e) => setUpload({ ...upload, platform: e.target.value })}
                >
                  <option value="windows-x64">Windows · x64</option>
                  <option value="windows-arm64">Windows · ARM64</option>
                  <option value="macos-arm64">macOS · Apple Silicon (arm64)</option>
                  <option value="macos-x64">macOS · Intel (x64)</option>
                  <option value="linux-x64">Linux · x64</option>
                  <option value="linux-arm64">Linux · ARM64</option>
                  <option value="windows">Windows (any arch)</option>
                  <option value="macos">macOS (any arch)</option>
                  <option value="linux">Linux (any arch)</option>
                  <option value="universal">universal</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Build file</label>
                <input
                  type="file"
                  className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white`}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Notes</label>
                <input
                  className={inputClass}
                  value={upload.notes}
                  onChange={(e) => setUpload({ ...upload, notes: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className={`${btnPrimary} mt-4`} disabled={uploading}>
              {uploading
                ? progress !== null
                  ? `Uploading… ${progress}%`
                  : "Uploading…"
                : "Upload build"}
            </button>
            {progress !== null && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-300 transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-white/35">
              Uploaded directly to storage — large builds skip the 100&nbsp;MB request limit. Testers
              only ever reach it through a single-use link.
            </p>
          </form>

          <div className="space-y-2">
            {builds.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="font-medium">
                    {b.version} <span className="text-white/35">· {platformLabel(b.platform)}</span>
                    {!b.is_active && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">inactive</span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-white/35">
                    {b.filename} · {formatBytes(b.size_bytes)} · {b.sha256?.slice(0, 16) ?? "no hash"}…
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="button" className={btnGhost} onClick={() => toggleBuild(b)}>
                    {b.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" className="text-sm text-red-400/70 hover:text-red-300" onClick={() => deleteBuild(b)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {builds.length === 0 && <p className="text-sm text-white/35">No builds uploaded yet.</p>}
          </div>
        </div>
      )}

      {section === "analytics" && analytics && (
        <div className="space-y-6">
          <h2 className="font-[Fastelar] text-xl">Beta analytics</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Testers" value={analytics.totals.testers} />
            <StatCard label="Active testers" value={analytics.totals.active_testers} />
            <StatCard label="Tokens issued" value={analytics.totals.tokens_issued} />
            <StatCard label="Tokens redeemed" value={analytics.totals.tokens_redeemed} />
            <StatCard label="Outstanding" value={analytics.totals.tokens_outstanding} />
            <StatCard label="Downloads" value={analytics.totals.downloads} />
            <StatCard label="Links pending" value={analytics.totals.links_pending} />
            <StatCard label="Active builds" value={analytics.totals.active_builds} />
          </div>

          <div>
            <h3 className="mb-2 text-sm uppercase tracking-wider text-white/40">Downloads by build</h3>
            <div className="space-y-1">
              {analytics.downloads_by_build.map((row) => (
                <div key={String(row.id)} className="flex justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm">
                  <span>
                    {String(row.version)} <span className="text-white/35">· {platformLabel(String(row.platform))}</span>
                  </span>
                  <span className="font-mono">{String(row.downloads ?? 0)}</span>
                </div>
              ))}
              {analytics.downloads_by_build.length === 0 && <p className="text-sm text-white/35">No builds yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm uppercase tracking-wider text-white/40">
              Events (last {analytics.days} days)
            </h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {analytics.events_by_kind.map((e) => (
                <span key={e.kind} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                  {e.kind} <span className="text-white/40">{e.count}</span>
                </span>
              ))}
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {analytics.recent_events.map((e) => (
                <div key={String(e.id)} className="flex justify-between rounded border border-white/5 px-3 py-1.5 text-xs">
                  <span className="font-mono text-white/60">{String(e.kind)}</span>
                  <span className="text-white/40">
                    {String(e.tester_name ?? e.detail ?? "")} · {new Date(String(e.created_at)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
