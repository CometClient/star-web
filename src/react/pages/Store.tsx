import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { Link, useSearchParams } from "@/lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api";
import { ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface P { id: string; slug: string; name: string; description: string | null; price_cents: number; currency: string; type: string; rarity: string; image_url: string | null; }

const rarityTone: Record<string, string> = {
  common: "text-muted-foreground border-white/10",
  rare: "text-sky-400 border-sky-400/30",
  epic: "text-purple-400 border-purple-400/30",
  legendary: "text-amber-400 border-amber-400/30",
};

function fmt(cents: number, cur = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(cents / 100);
}

export default function Store() {
  const [items, setItems] = useState<P[]>([]);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    getProducts().then((data) => setItems(data));
  }, []);

  const type = params.get("type");
  const rarity = params.get("rarity");

  const types = useMemo(() => Array.from(new Set(items.map(i => i.type))), [items]);
  const rarities = useMemo(() => Array.from(new Set(items.map(i => i.rarity))), [items]);

  const filtered = useMemo(() => items.filter(i =>
    (!type || i.type === type) && (!rarity || i.rarity === rarity)
  ), [items, type, rarity]);

  const setFilter = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    setParams(p);
  };

  return (
    <>
      <SiteHeader />
      <PageShell title="Store" description="Cosmetics, capes, and bundles for Comet Client.">
        <div className="max-w-6xl mx-auto">
          <div className="text-center pt-2 pb-10">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3 inline-flex items-center gap-1.5">
              <ShoppingBag size={11} /> Comet store
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">Cosmetics & capes</h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Optional cosmetics that support the team. Nothing gates gameplay.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <FilterChip label="All" active={!type && !rarity} onClick={() => setParams({})} />
            {types.map(t => <FilterChip key={t} label={t} active={type === t} onClick={() => setFilter("type", type === t ? null : t)} />)}
            <span className="w-px h-4 bg-white/10 mx-1" />
            {rarities.map(r => <FilterChip key={r} label={r} active={rarity === r} onClick={() => setFilter("rarity", rarity === r ? null : r)} />)}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => (
              <Link key={p.id} to={`/store/${p.slug}`} className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-primary/30 hover:-translate-y-0.5 transition-all">
                <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="absolute inset-0 w-full h-full object-cover [image-rendering:pixelated] group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><Sparkles /></div>
                  )}
                  <span className={cn("absolute top-3 left-3 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-background/60 backdrop-blur", rarityTone[p.rarity] || rarityTone.common)}>{p.rarity}</span>
                </div>
                <div className="p-4">
                  <div className="font-display font-semibold group-hover:text-primary transition-colors">{p.name}</div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{p.type}</div>
                  <div className="mt-3 font-display text-lg">{fmt(p.price_cents, p.currency)}</div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-white/10 p-10 text-center text-sm text-muted-foreground">Nothing here yet.</div>
            )}
          </div>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors capitalize",
      active ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20")}>
      {label}
    </button>
  );
}
