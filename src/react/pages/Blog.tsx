import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { Link, useSearchParams } from "@/lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBlogPosts, type BlogPost as Post } from "@/lib/api";
import { Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function mcHead(name?: string | null, uuid?: string | null, size = 64) {
  if (uuid) return `https://mc-heads.net/avatar/${uuid}/${size}`;
  if (name) return `https://mc-heads.net/avatar/${name}/${size}`;
  return null;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag");
  const cat = params.get("cat");

  useEffect(() => {
    getBlogPosts().then(setPosts);
  }, []);

  const allTags = useMemo(() => Array.from(new Set(posts.flatMap(p => p.tags || []))).sort(), [posts]);
  const allCats = useMemo(() => Array.from(new Set(posts.map(p => p.category).filter(Boolean) as string[])).sort(), [posts]);
  const filtered = useMemo(() => posts.filter(p =>
    (!tag || (p.tags || []).includes(tag)) && (!cat || p.category === cat)
  ), [posts, tag, cat]);

  const setFilter = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    setParams(p);
  };

  const [featured, ...rest] = filtered;

  return (
    <>
      <SiteHeader />
      <PageShell title="Blog" description="Latest news, updates and stories from the Comet Client team.">
        <PageHero eyebrow="Blog" title="What's brewing" sub="Updates, deep-dives and behind-the-scenes from the Comet team." />

        {(allTags.length > 0 || allCats.length > 0) && (
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2 mb-8">
            <button onClick={() => setParams({})} className={cn("text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors", !tag && !cat ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20")}>All</button>
            {allCats.map(c => (
              <button key={c} onClick={() => setFilter("cat", cat === c ? null : c)} className={cn("text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors", cat === c ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20")}>{c}</button>
            ))}
            {allTags.length > 0 && <span className="w-px h-4 bg-white/10 mx-1" />}
            {allTags.map(t => (
              <button key={t} onClick={() => setFilter("tag", tag === t ? null : t)} className={cn("text-[11px] font-mono px-3 py-1.5 rounded-full border transition-colors", tag === t ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20")}>#{t}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center text-muted-foreground glass rounded-2xl p-10">
            No posts match. <button onClick={() => setParams({})} className="text-primary hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-10">
            {featured && <FeaturedCard p={featured} />}

            {rest.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">More posts</div>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((p, i) => <PostCard key={p.id} p={p} index={i} />)}
                </div>
              </>
            )}
          </div>
        )}
      </PageShell>
      <SiteFooter />
    </>
  );
}

function FeaturedCard({ p }: { p: Post }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Link to={`/blog/${p.slug}`} className="group block relative">
        <div className="absolute -inset-2 bg-primary/10 blur-3xl rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
        <div className="glass-strong rounded-3xl overflow-hidden grid md:grid-cols-5 gap-0">
          <div className="md:col-span-3 relative aspect-video md:aspect-auto md:min-h-[380px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
              style={{
                backgroundImage: p.cover_url
                  ? `url(${p.cover_url})`
                  : "radial-gradient(circle at 30% 30%, hsl(var(--primary)/.4), transparent 60%), radial-gradient(circle at 70% 70%, hsl(var(--primary-glow)/.25), transparent 60%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/20 to-transparent md:bg-gradient-to-r" />
            <div className="absolute top-5 left-5 inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Featured
            </div>
          </div>
          <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4 group-hover:text-pink-gradient transition-all duration-300">
              {p.title}
            </h2>
            {p.excerpt && <p className="text-muted-foreground mb-6 line-clamp-3">{p.excerpt}</p>}
            <PostMeta p={p} />
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary font-medium">
              Read post
              <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PostCard({ p, index }: { p: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link to={`/blog/${p.slug}`} className="group block h-full">
        <article className={cn(
          "h-full glass rounded-2xl overflow-hidden flex flex-col transition-all duration-500",
          "hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.4)] hover:border-primary/20"
        )}>
          <div className="relative aspect-[16/10] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage: p.cover_url
                  ? `url(${p.cover_url})`
                  : "linear-gradient(135deg, hsl(var(--primary)/.25), hsl(var(--primary-glow)/.05))",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            {p.read_minutes && (
              <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 text-[10px] font-mono text-foreground/90 flex items-center gap-1">
                <Clock size={10} /> {p.read_minutes} min
              </div>
            )}
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="font-display text-lg font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {p.title}
            </h3>
            {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-5">{p.excerpt}</p>}
            <div className="mt-auto pt-3 border-t border-white/5">
              <PostMeta p={p} small />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

function PostMeta({ p, small }: { p: Post; small?: boolean }) {
  const head = mcHead(p.mc_author_username, p.mc_author_uuid, small ? 48 : 64);
  return (
    <div className="flex items-center gap-2.5">
      {head ? (
        <img
          src={head}
          alt={p.mc_author_username || "author"}
          className={cn(
            "rounded-md ring-1 ring-white/10 [image-rendering:pixelated]",
            small ? "w-7 h-7" : "w-9 h-9"
          )}
        />
      ) : (
        <div className={cn("rounded-md bg-primary/10 ring-1 ring-white/10", small ? "w-7 h-7" : "w-9 h-9")} />
      )}
      <div className="min-w-0">
        {p.mc_author_username && (
          <div className={cn("font-display font-semibold text-foreground truncate", small ? "text-xs" : "text-sm")}>
            {p.mc_author_username}
          </div>
        )}
        <div className="text-[10px] font-mono text-muted-foreground">
          {p.published_at && new Date(p.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}
