import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/site/Hero";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { ModsMarquee } from "@/components/site/ModsMarquee";
import { PreviewSection } from "@/components/site/PreviewSection";
import { SocialProof } from "@/components/site/SocialProof";
import { CTABand } from "@/components/site/CTABand";
import { PixelCharacter, PixelCube } from "@/components/site/PixelCharacter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/lib/navigation";
import { getBlogPosts } from "@/lib/api";
import { ArrowRight, ShoppingBag } from "lucide-react";

interface BlogTeaser {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string;
  category: string | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-primary">{children}</div>
  );
}

function LatestBlog() {
  const [posts, setPosts] = useState<BlogTeaser[]>([]);
  useEffect(() => {
    getBlogPosts().then((data) => setPosts(data.slice(0, 3)));
  }, []);
  if (posts.length === 0) return null;
  return (
    <section className="relative px-4 py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Updates</SectionLabel>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">From the team</h2>
          </div>
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline">
            all posts <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                to={`/blog/${p.slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 to-transparent">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PixelCube className="h-20 w-20 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {p.category && (
                    <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary">{p.category}</div>
                  )}
                  <h3 className="mb-2 line-clamp-2 font-display text-lg font-semibold transition-colors group-hover:text-primary">
                    {p.title}
                  </h3>
                  {p.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CosmeticsStrip() {
  return (
    <section className="relative overflow-hidden px-4 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_right,hsl(309_92%_91%/0.08),transparent_60%)]" />
      <div className="container mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="relative mx-auto grid max-w-md grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative flex aspect-[3/4] items-end justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-emerald-950/30" />
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(90deg,#3a7a3a_0_8px,#2f6630_8px_16px)] opacity-60" />
              <motion.div
                className="relative w-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              >
                <PixelCharacter />
              </motion.div>
            </motion.div>
          ))}
        </div>
        <div>
          <SectionLabel>Cosmetics</SectionLabel>
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
            Stand out on every <span className="text-pink-gradient">server.</span>
          </h2>
          <p className="mb-6 text-muted-foreground">
            Capes, cloaks, and seasonal drops crafted by our team. Free or optional — never pay-to-win.
          </p>
          <Link
            to="/store"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
          >
            <ShoppingBag size={14} /> Browse store <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  useEffect(() => {
    document.title = "Comet Client · The Minecraft launcher, refined";
    const setMeta = (name: string, content: string) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", name);
        document.head.appendChild(m);
      }
      m.setAttribute("content", content);
    };
    setMeta(
      "description",
      "Comet Client is a modern Minecraft launcher with boosted FPS, 40+ mods, voice chat, free cosmetics, and free server hosting. Free forever.",
    );
  }, []);

  return (
    <>
      <SiteHeader />
      <Hero />
      <FeatureGrid />
      <PreviewSection />
      <ModsMarquee />
      <CosmeticsStrip />
      <LatestBlog />
      <SocialProof />
      <CTABand />
      <SiteFooter />
    </>
  );
}
