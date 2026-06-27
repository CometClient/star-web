import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { Link, useParams } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { createStoreOrder, getProductBySlug } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface P { id: string; slug: string; name: string; description: string | null; price_cents: number; currency: string; type: string; rarity: string; image_url: string | null; }

function fmt(cents: number, cur = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(cents / 100);
}

export default function StoreProduct() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState<P | null>(null);
  const [mc, setMc] = useState("");
  const [mcUuid, setMcUuid] = useState<string | null>(null);
  const [checkingMc, setCheckingMc] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getProductBySlug(slug).then(setP);
  }, [slug]);

  const verifyMc = async () => {
    if (!mc.trim()) return;
    setCheckingMc(true);
    setMcUuid(null);
    try {
      const r = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(mc.trim())}`);
      if (!r.ok) { toast.error("Minecraft user not found"); return; }
      const j = await r.json();
      setMcUuid(j.id);
      toast.success(`Found ${j.name}`);
    } catch {
      toast.error("Couldn't reach Mojang");
    } finally {
      setCheckingMc(false);
    }
  };

  const buy = async () => {
    if (!p) return;
    if (!mc.trim()) return toast.error("Enter your Minecraft username first");
    setSubmitting(true);
    try {
      await createStoreOrder({
        user_id: user?.id ?? null,
        product_id: p.id,
        mc_username: mc.trim(),
        mc_uuid: mcUuid,
        amount_cents: p.price_cents,
        currency: p.currency,
        status: "pending_payment",
      });
      toast.success("Payments coming soon — your order is queued.", { description: "We'll grant the cosmetic once checkout goes live." });
      setMc(""); setMcUuid(null);
    } catch (err: any) {
      toast.error(err.message || "Could not queue order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!p) return (
    <><SiteHeader /><PageShell title="Loading"><div className="text-center text-muted-foreground py-20">Loading…</div></PageShell><SiteFooter /></>
  );

  const skinUrl = mcUuid ? `https://mc-heads.net/body/${mcUuid}/300` : (mc ? `https://mc-heads.net/body/${mc}/300` : null);

  return (
    <>
      <SiteHeader />
      <PageShell title={p.name} description={p.description || "Comet Client store item."}>
        <div className="max-w-5xl mx-auto">
          <Link to="/store" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft size={14} /> Back to store</Link>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent aspect-square overflow-hidden flex items-center justify-center">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover [image-rendering:pixelated]" />
              ) : <Sparkles className="text-muted-foreground" size={48} />}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{p.type} · {p.rarity}</div>
              <h1 className="font-display text-4xl font-bold mb-3">{p.name}</h1>
              <div className="font-display text-2xl text-primary mb-4">{fmt(p.price_cents, p.currency)}</div>
              {p.description && <p className="text-muted-foreground mb-6">{p.description}</p>}

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Minecraft username <span className="text-red-400">*</span></Label>
                  <div className="flex gap-2">
                    <Input value={mc} onChange={(e) => { setMc(e.target.value); setMcUuid(null); }} placeholder="Notch" />
                    <Button type="button" variant="glass" onClick={verifyMc} disabled={checkingMc || !mc.trim()}>{checkingMc ? "…" : "Verify"}</Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">We grant cosmetics directly to your MC account.</p>
                </div>
                {skinUrl && (
                  <div className="flex justify-center py-2">
                    <img src={skinUrl} alt="skin preview" className="h-32 [image-rendering:pixelated] opacity-90" />
                  </div>
                )}
                <Button variant="glow" size="lg" className="w-full" onClick={buy} disabled={submitting || !mc.trim()}>
                  {submitting ? "Queuing…" : `Buy for ${fmt(p.price_cents, p.currency)}`}
                </Button>
                <p className="text-[11px] text-center text-amber-400/80 font-mono uppercase tracking-widest">Payments coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
