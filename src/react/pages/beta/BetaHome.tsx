import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { GlassCard } from "@/components/site/GlassCard";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { Download, AlertTriangle, LogOut, Loader2 } from "lucide-react";
import { requestBetaDownload } from "@/lib/api";
import { toast } from "sonner";

const VERSION = "1.21.4-beta.3";
const PLATFORMS: { key: "macos" | "windows" | "linux"; label: string }[] = [
  { key: "macos", label: "macOS · Apple Silicon (.dmg)" },
  { key: "windows", label: "Windows · x64 (.exe)" },
  { key: "linux", label: "Linux (.AppImage)" },
];

export default function BetaHome() {
  const nav = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    document.title = "Beta · Comet Client";
    if (!sessionStorage.getItem("beta_ok")) nav("/beta/auth");
  }, [nav]);

  const email = sessionStorage.getItem("beta_email") || "";
  const token = sessionStorage.getItem("beta_ok") || "";

  const download = async (platform: string) => {
    setBusy(platform);
    try {
      const data = await requestBetaDownload({ email, token, version: VERSION, platform });
      window.location.href = data.url;
      toast.success("Download starting…");
    } catch (e: any) {
      const msg = String(e.message || e);
      toast.error(msg.includes("already_downloaded") ? "You've already downloaded this build." : msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-12">
        <Logo />
        <Button variant="glass" size="sm" onClick={() => { sessionStorage.clear(); nav("/beta/auth"); }}>
          <LogOut size={14} /> Sign out
        </Button>
      </div>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Beta channel · {VERSION}</div>
          <h1 className="font-display text-5xl font-bold text-gradient">Welcome back</h1>
          <p className="text-muted-foreground mt-2 font-mono text-xs">{email}</p>
        </div>

        <GlassCard variant="strong" className="border border-amber-500/30 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" />
            <div className="text-sm">
              <div className="font-display font-semibold text-amber-200 mb-1">Confidential build</div>
              <p className="text-muted-foreground">
                Do NOT share, stream, or leak this build. Each token is tied to you — leaks are traceable.
                Download links are single-use and expire in 60 seconds. You can download each build <strong>once per platform</strong>.
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="strong">
          <h2 className="font-display text-xl font-semibold mb-3">Getting started</h2>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
            <li>Pick your platform below and click <strong>Get</strong>.</li>
            <li>The signed link opens immediately — don't refresh, it's single-use.</li>
            <li>Install, launch, and report bugs in the <code>#beta-feedback</code> Discord channel.</li>
            <li>Need a re-download? Ask staff to reset your token.</li>
          </ol>
        </GlassCard>

        <GlassCard variant="strong" glow>
          <h2 className="font-display text-xl font-semibold mb-4">Latest beta build</h2>
          <div className="space-y-2">
            {PLATFORMS.map((p) => (
              <div key={p.key} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="font-mono text-sm">{p.label}</div>
                <Button variant="glow" size="sm" disabled={busy === p.key} onClick={() => download(p.key)}>
                  {busy === p.key ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Get
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
