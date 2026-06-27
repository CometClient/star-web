import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import {
  ArrowRight,
  ChevronDown,
  Download,
  Gauge,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBlogPosts, getServiceStatus } from "@/lib/api";
import launcherImg from "@/assets/launcher-preview.jpg";
import { Logo } from "./Logo";

const HERO_ART =
  "https://i.redd.it/i-made-a-recreation-of-the-birch-forest-concept-art-on-v0-9t277tc3orec1.png?width=2400&format=png&auto=webp";

const highlights = [
  { icon: Gauge, label: "2× FPS", sub: "Sodium + Iris" },
  { icon: Layers, label: "15+ mods", sub: "Pre-installed" },
  { icon: Zap, label: "Fabric", sub: "Every version" },
];

export function Hero() {
  const [latest, setLatest] = useState<{ slug: string; title: string } | null>(null);
  const [statusLabel, setStatusLabel] = useState("Checking systems…");
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const artScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    getBlogPosts().then((posts) => {
      const first = posts[0];
      if (first) setLatest({ slug: first.slug, title: first.title });
    });
    getServiceStatus().then((services) => {
      if (!services.length) return;
      const down = services.filter((s) => s.status !== "operational");
      setStatusOk(down.length === 0);
      setStatusLabel(
        down.length === 0
          ? "All systems operational"
          : down.length === 1
            ? `${down[0].service_name} · ${down[0].status.replace(/_/g, " ")}`
            : `${down.length} services affected`,
      );
    });
  }, []);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden">
      {/* Concept art + atmospheric fade */}
      <div className="absolute inset-0 -z-20">
        <motion.div style={{ y: artY, scale: artScale }} className="absolute inset-0 origin-center">
          <img
            src={HERO_ART}
            alt=""
            className="h-full w-full object-cover object-[center_35%] opacity-90"
            fetchPriority="high"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(309_60%_70%/0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c0f]/30 via-[#080808]/75 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,transparent_40%,hsl(var(--background))_85%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/95 to-transparent" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/40"
            style={{ left: `${12 + i * 14}%`, top: `${20 + (i % 3) * 18}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      <motion.div style={{ y: contentY, opacity: fade }} className="relative flex min-h-[100svh] flex-col">
        <div className="container mx-auto flex flex-1 flex-col justify-center px-4 pb-28 pt-28 md:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Copy */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <Logo size="xl" className="mb-8" />

                <Link
                  to={latest ? `/blog/${latest.slug}` : "/blog"}
                  className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-xs font-mono backdrop-blur-md transition-colors hover:border-primary/40"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-glow-pulse" />
                  <span className="truncate text-muted-foreground">{latest?.title || "Fabric 1.21.4 ready"}</span>
                  <ArrowRight size={11} className="shrink-0 text-primary" />
                </Link>

                <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-tighter">
                  <span className="block text-gradient">Minecraft,</span>
                  <span className="mt-1 block font-minecraft text-[clamp(3rem,8vw,6.5rem)] leading-[0.88] text-pink-gradient">
                    reimagined.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground/90 md:text-lg">
                  A Fabric launcher with boosted frames, curated mods, and a UI that feels like it belongs in 2026 — not 2014.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button asChild variant="glow" size="xl" className="rounded-full px-8 shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
                    <Link to="/download">
                      <Download className="mr-1" /> Download free
                    </Link>
                  </Button>
                  <Button asChild variant="glass" size="xl" className="rounded-full">
                    <Link to="/beta/auth">Join beta</Link>
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {highlights.map((h) => (
                    <div
                      key={h.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 backdrop-blur-sm"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <h.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-display text-sm font-semibold">{h.label}</div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{h.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/status"
                  className="mt-6 inline-flex items-center gap-2 text-[11px] font-mono text-muted-foreground transition-colors hover:text-primary"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${statusOk === null ? "bg-muted-foreground" : statusOk ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`}
                  />
                  {statusLabel}
                </Link>
              </motion.div>
            </div>

            {/* Launcher showcase */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-xl lg:max-w-none"
            >
              <div className="absolute -inset-8 -z-10 rounded-full bg-primary/20 blur-[90px] animate-glow-pulse" />
              <div className="absolute -left-6 top-1/4 hidden h-24 w-24 rounded-3xl border border-white/10 bg-emerald-950/40 backdrop-blur-xl lg:block">
                <div className="flex h-full flex-col items-center justify-center gap-1 font-mono text-[10px] text-emerald-300/80">
                  <span className="text-lg font-display font-bold text-emerald-300">144</span>
                  <span>FPS</span>
                </div>
              </div>
              <div className="absolute -right-4 bottom-1/4 hidden rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 backdrop-blur-xl lg:block">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>18 mods loaded</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-black/40 p-2 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85),0_0_80px_hsl(var(--primary)/0.12)] ring-1 ring-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-3 text-[10px] font-mono text-muted-foreground">comet · fabric 1.21.4</span>
                </div>
                <div className="relative overflow-hidden rounded-[1.25rem]">
                  <img
                    src={launcherImg}
                    alt="Comet Client launcher"
                    className="block w-full"
                    width={1536}
                    height={1024}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue — Dawn-style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70"
        >
          <span>Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <ChevronDown className="h-4 w-4 text-primary/70" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
