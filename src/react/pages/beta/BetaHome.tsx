import { useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { GlassCard } from "@/components/site/GlassCard";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { AlertTriangle, KeyRound } from "lucide-react";

export default function BetaHome() {
  const nav = useNavigate();
  useEffect(() => {
    document.title = "Beta · Comet Client";
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-12">
        <Logo />
      </div>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Closed beta</div>
          <h1 className="font-display text-5xl font-bold text-gradient">Comet beta access</h1>
        </div>

        <GlassCard variant="strong" className="border border-amber-500/30 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" />
            <div className="text-sm">
              <div className="font-display font-semibold text-amber-200 mb-1">Confidential build</div>
              <p className="text-muted-foreground">
                Do NOT share, stream, or leak this build. Each token is tied to one tester — leaks are
                traceable. Tokens are single-use, and the download link they mint expires within minutes.
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="strong">
          <h2 className="font-display text-xl font-semibold mb-3">How it works</h2>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
            <li>Enter the token staff issued you.</li>
            <li>Confirm the Minecraft name and skin we have on file are yours.</li>
            <li>Your token is spent and a single-use download link is created.</li>
            <li>Download immediately — the link works once and then expires.</li>
            <li>Need another? Ask staff to issue a fresh token.</li>
          </ol>
        </GlassCard>

        <GlassCard variant="strong" glow>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Have a token?</h2>
              <p className="text-sm text-muted-foreground">Redeem it for the latest beta build.</p>
            </div>
            <Button variant="glow" onClick={() => nav("/beta/auth")}>
              <KeyRound size={14} /> Redeem token
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
