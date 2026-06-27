import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { GlassCard } from "@/components/site/GlassCard";
import { Button } from "@/components/ui/button";
import { Lock, Mail, Sparkles } from "lucide-react";
import { Link } from "@/lib/navigation";

export default function Download() {
  return (
    <>
      <SiteHeader />
      <PageShell title="Download — Closed beta" description="Comet Client is currently in closed beta. Public downloads are not yet available.">
        <PageHero
          eyebrow="Closed beta"
          title="Comet is in closed beta"
          sub="Public downloads aren't open yet. Beta testers receive invites with a personal token to access the build."
        />
        <div className="max-w-2xl mx-auto">
          <GlassCard variant="strong" glow className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">No public download</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We're hand-picking testers to keep the experience tight. Want in? Request access and we'll reach out as slots open.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="glow"><Link to="/support"><Mail size={14} /> Request access</Link></Button>
              <Button asChild variant="glass"><Link to="/beta/auth"><Sparkles size={14} /> I have a beta token</Link></Button>
            </div>
          </GlassCard>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
