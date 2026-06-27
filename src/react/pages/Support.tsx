import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupportArticles, getSupportCategories } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import * as Icons from "lucide-react";
import { MessageSquare, LifeBuoy, Search, ArrowRight, Inbox, Send } from "lucide-react";

interface Cat { id: string; slug: string; name: string; description: string | null; icon: string | null; }
interface Article { id: string; slug: string; title: string; excerpt: string | null; category_id: string | null; }

export default function Support() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [arts, setArts] = useState<Article[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    getSupportCategories().then((data) => setCats(data as Cat[]));
    getSupportArticles().then((data) =>
      setArts(data.map((a) => ({ id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt, category_id: a.category_id }))),
    );
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return arts.filter(a =>
      (!activeCat || a.category_id === activeCat) &&
      (!t || a.title.toLowerCase().includes(t) || (a.excerpt || "").toLowerCase().includes(t))
    );
  }, [arts, activeCat, q]);

  return (
    <>
      <SiteHeader />
      <PageShell title="Support" description="Find answers, browse guides, or open a ticket.">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center pt-6 pb-10">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3 inline-flex items-center gap-1.5">
              <LifeBuoy size={11} /> Help center
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">How can we help?</h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Search the knowledge base, jump into Discord, or open a ticket.</p>
            <div className="relative max-w-xl mx-auto mt-7">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" className="pl-10 h-12 bg-white/[0.03] border-white/10" />
            </div>
          </div>

          {/* Categories */}
          {cats.length > 0 && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
              <button onClick={() => setActiveCat(null)} className={`text-left rounded-xl border p-4 transition-all ${!activeCat ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                <Inbox size={18} className="text-primary mb-2" />
                <div className="font-display font-semibold text-sm">All articles</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{arts.length} total</div>
              </button>
              {cats.map(c => {
                const Icon = (Icons as any)[c.icon || "BookOpen"] || Icons.BookOpen;
                const count = arts.filter(a => a.category_id === c.id).length;
                const active = activeCat === c.id;
                return (
                  <button key={c.id} onClick={() => setActiveCat(active ? null : c.id)} className={`text-left rounded-xl border p-4 transition-all ${active ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                    <Icon size={18} className="text-primary mb-2" />
                    <div className="font-display font-semibold text-sm">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{count} article{count !== 1 ? "s" : ""}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Articles */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</div>
              <div className="space-y-2">
                {filtered.map(a => (
                  <Link key={a.id} to={`/support/${a.slug}`} className="group flex items-start justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.04] transition-all">
                    <div className="min-w-0">
                      <div className="font-display font-semibold group-hover:text-primary transition-colors">{a.title}</div>
                      {a.excerpt && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</div>}
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Link>
                ))}
                {filtered.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
                    No articles match. <Link to="/support/new" className="text-primary hover:underline">Open a ticket</Link> instead.
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <MessageSquare size={18} className="text-indigo-400 mb-2" />
                <div className="font-display font-semibold mb-1">Discord community</div>
                <p className="text-xs text-muted-foreground mb-4">38k members, fast peer help, datapack drops.</p>
                <Button asChild variant="glass" size="sm" className="w-full"><a href="#">Open Discord</a></Button>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
                <Send size={18} className="text-primary mb-2" />
                <div className="font-display font-semibold mb-1">Open a ticket</div>
                <p className="text-xs text-muted-foreground mb-4">{user ? "Account, billing, bugs — we reply within 24h." : "Sign in to open a ticket with our team."}</p>
                <Button asChild variant="glow" size="sm" className="w-full">
                  <Link to={user ? "/support/new" : "/auth"}>{user ? "New ticket" : "Sign in"}</Link>
                </Button>
                {user && (
                  <Link to="/support/tickets" className="block text-center text-[11px] font-mono text-muted-foreground hover:text-primary mt-3">View my tickets →</Link>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="font-display font-semibold text-sm mb-2">System status</div>
                <Link to="/status" className="text-xs text-primary hover:underline">View live status →</Link>
              </div>
            </aside>
          </div>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
