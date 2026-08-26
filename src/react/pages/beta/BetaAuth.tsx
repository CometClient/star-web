import { useEffect, useState } from "react";
import { GlassCard } from "@/components/site/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { AlertTriangle, ArrowLeft, Check, Download, Loader2, ShieldCheck } from "lucide-react";
import { ApiError, confirmBetaIdentity, verifyBetaToken, type BetaVerifyResponse } from "@/lib/api";
import { toast } from "sonner";

type Step = "token" | "confirm" | "link";

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

/** Turns the API's `reason` codes into something a tester can act on. */
function readableError(e: unknown) {
  const raw = e instanceof ApiError ? e.message : String(e);
  try {
    const parsed = JSON.parse(raw) as { error?: string; reason?: string };
    if (parsed.reason === "already_redeemed") return "This token has already been used.";
    if (parsed.reason === "revoked") return "This token was revoked. Ask staff for a new one.";
    if (parsed.reason === "expired") return "This token has expired.";
    if (parsed.reason === "no_build") return "No beta build has been published yet.";
    return parsed.error ?? "Something went wrong.";
  } catch {
    return raw || "Something went wrong.";
  }
}

export default function BetaAuth() {
  const [step, setStep] = useState<Step>("token");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState<BetaVerifyResponse | null>(null);
  const [link, setLink] = useState<{ url: string; expires_at: string; filename: string } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    document.title = "Beta · Comet Client";
  }, []);

  // Count the one-time link down so nobody sits on an expired URL.
  useEffect(() => {
    if (!link) return;
    const tick = () => {
      const left = Math.max(0, Math.round((Date.parse(link.expires_at) - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [link]);

  const submitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await verifyBetaToken(token.trim());
      setVerified(result);
      setStep("confirm");
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmIdentity = async () => {
    if (!verified) return;
    setBusy(true);
    try {
      const result = await confirmBetaIdentity({
        token: token.trim(),
        build_id: verified.build?.id,
      });
      setLink({
        url: result.url,
        expires_at: result.expires_at,
        filename: result.build.filename,
      });
      setStep("link");
      // The token is spent the moment the link exists — don't keep it around.
      setToken("");
    } catch (err) {
      toast.error(readableError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>

      <GlassCard variant="strong" className="max-w-md w-full">
        {step === "token" && (
          <>
            <div className="text-center mb-6">
              <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Closed beta</div>
              <h1 className="font-display text-3xl font-bold text-gradient">Enter your token</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Tokens are personal and single-use. Don't share them.
              </p>
            </div>
            <form onSubmit={submitToken} className="space-y-4">
              <div className="space-y-2">
                <Label>Beta token</Label>
                <Input
                  required
                  autoFocus
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="cmt_…"
                  className="font-mono"
                />
              </div>
              <Button type="submit" variant="glow" className="w-full" disabled={busy}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                {busy ? "Verifying…" : "Verify token"}
              </Button>
            </form>
          </>
        )}

        {step === "confirm" && verified && (
          <>
            <div className="text-center mb-6">
              <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Step 2 of 2</div>
              <h1 className="font-display text-3xl font-bold text-gradient">Is this you?</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Confirming spends your token and creates a one-time download link.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl bg-white/5 p-5 mb-4">
              <img
                src={verified.tester.render_url}
                alt={verified.tester.mc_username ?? "Your Minecraft skin"}
                className="h-40 object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]"
              />
              <div className="text-center">
                <div className="font-display text-xl font-semibold">
                  {verified.tester.mc_username ?? verified.tester.display_name}
                </div>
                {verified.tester.mc_uuid && (
                  <div className="font-mono text-[10px] text-muted-foreground break-all mt-1">
                    {verified.tester.mc_uuid}
                  </div>
                )}
              </div>
            </div>

            {verified.build ? (
              <div className="rounded-lg bg-white/5 p-3 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Build</span>
                  <span className="font-mono">{verified.build.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-mono">{verified.build.platform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-mono">{formatBytes(verified.build.size_bytes)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4 text-sm text-amber-200">
                No beta build is published yet — your token is still unspent.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="glass"
                className="flex-1"
                onClick={() => {
                  setStep("token");
                  setVerified(null);
                }}
                disabled={busy}
              >
                <ArrowLeft size={14} /> Not me
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={confirmIdentity}
                disabled={busy || !verified.build}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {busy ? "Working…" : "That's me"}
              </Button>
            </div>
          </>
        )}

        {step === "link" && link && (
          <>
            <div className="text-center mb-6">
              <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Token spent</div>
              <h1 className="font-display text-3xl font-bold text-gradient">Your download</h1>
              <p className="text-sm text-muted-foreground mt-2 font-mono">{link.filename}</p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4 flex gap-3">
              <AlertTriangle className="text-amber-400 shrink-0" size={18} />
              <p className="text-sm text-muted-foreground">
                This link works <strong>once</strong> and your token is now used. Don't refresh after
                starting the download.
              </p>
            </div>

            <Button
              variant="glow"
              className="w-full"
              disabled={secondsLeft <= 0}
              onClick={() => {
                window.location.href = link.url;
              }}
            >
              <Download size={14} />
              {secondsLeft > 0 ? `Download (expires in ${secondsLeft}s)` : "Link expired"}
            </Button>

            {secondsLeft <= 0 && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                Ask staff to issue a new token.
              </p>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}
