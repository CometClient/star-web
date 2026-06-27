import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { GlassCard } from "@/components/site/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { verifyBetaToken } from "@/lib/beta";
import { toast } from "sonner";

export default function BetaAuth() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  useEffect(() => { document.title = "Beta · Comet Client"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await verifyBetaToken(email.trim().toLowerCase(), token.trim());
    setBusy(false);
    if (!ok) return toast.error("Invalid email or token");
    sessionStorage.setItem("beta_ok", token);
    sessionStorage.setItem("beta_email", email);
    nav("/beta/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-6 left-6"><Logo /></div>
      <GlassCard variant="strong" className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Closed beta</div>
          <h1 className="font-display text-3xl font-bold text-gradient">Enter your token</h1>
          <p className="text-sm text-muted-foreground mt-2">Tokens are personal. Don't share them.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label>Token</Label><Input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="cmt_…" className="font-mono" /></div>
          <Button type="submit" variant="glow" className="w-full" disabled={busy}>{busy ? "Verifying…" : "Enter beta"}</Button>
        </form>
      </GlassCard>
    </div>
  );
}