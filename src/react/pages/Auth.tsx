import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { GlassCard } from "@/components/site/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { signIn, useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@/lib/navigation";
import { toast } from "sonner";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();
  useEffect(() => { if (user) nav("/support/tickets"); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
      nav("/support/tickets");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally { setBusy(false); }
  };

  return (
    <>
      <SiteHeader />
      <PageShell title="Sign in" description="Sign in to view and manage your support tickets.">
        <div className="max-w-md mx-auto pt-12">
          <GlassCard variant="strong" className="space-y-5">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-gradient">Account</h1>
              <p className="text-sm text-muted-foreground mt-2">Sign in to open and track support tickets.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" variant="glow" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </GlassCard>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
