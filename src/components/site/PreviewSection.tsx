import { motion } from "framer-motion";
import { Layers, Wrench, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Three launcher surfaces, all Fabric-flavored: pick a version, drop your own
 * mods in, then tweak everything from one menu.
 */
const surfaces = [
  {
    Icon: Layers, tone: "from-primary/20 to-primary/0",
    title: "Pick your Fabric version", desc: "Switch between 1.20.x, 1.21.x and snapshots. Each instance ships with the matching curated mod pack.",
    mock: (
      <div className="space-y-1.5">
        {[["1.21.4", "Fabric · 18 mods", true], ["1.21.1", "Fabric · 16 mods", false], ["1.20.4", "Fabric · 15 mods", false], ["snapshot 25w03a", "Fabric · 12 mods", false]].map(([n, sub, active]) => (
          <div key={n as string} className={cn("flex items-center justify-between rounded-md px-3 py-2 text-[11px] font-mono",
            active ? "bg-primary/10 border border-primary/30 text-primary" : "bg-white/[0.03] border border-white/5 text-muted-foreground")}>
            <span>{n as string}</span>
            <span className="text-[10px] opacity-70">{sub as string}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    Icon: Wrench, tone: "from-emerald-400/20 to-emerald-400/0",
    title: "Drop in your own mods", desc: "Drag any Fabric jar into the launcher. We resolve dependencies, validate compatibility, and load it cleanly next launch.",
    mock: (
      <div className="space-y-1.5">
        {[["sodium.jar", "ok"], ["iris-shaders.jar", "ok"], ["my-cool-mod.jar", "loading"], ["+ drag any .jar here", "drop"]].map(([n, s]) => (
          <div key={n as string} className="flex items-center justify-between rounded-md bg-white/[0.03] border border-white/5 px-3 py-1.5 font-mono text-[11px]">
            <span className={s === "drop" ? "text-muted-foreground/60" : "text-foreground/90"}>{n as string}</span>
            <span className={cn(
              "text-[9px] uppercase tracking-wider px-1.5 rounded-sm",
              s === "ok" && "text-emerald-300 bg-emerald-500/10",
              s === "loading" && "text-amber-300 bg-amber-500/10",
              s === "drop" && "text-muted-foreground/60 border border-dashed border-white/10",
            )}>{s as string}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    Icon: Sliders, tone: "from-sky-400/20 to-sky-400/0",
    title: "One mod menu, every mod", desc: "Every bundled mod (and yours) is configurable from one unified panel — no rebinding keys across twelve different GUIs.",
    mock: (
      <div className="space-y-1.5">
        {[["Render distance", "16", true], ["FPS limit", "240", true], ["Shader pack", "complementary", true], ["HUD scale", "1.0", false]].map(([k, v, on]) => (
          <div key={k as string} className="flex items-center justify-between rounded-md bg-white/[0.03] border border-white/5 px-3 py-1.5 font-mono text-[11px]">
            <span className="text-foreground/80">{k as string}</span>
            <span className="flex items-center gap-2">
              <span className="text-primary">{v as string}</span>
              <span className={cn("h-2.5 w-4 rounded-full relative transition-colors", on ? "bg-primary/60" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-1.5 w-1.5 rounded-full bg-white transition-all", on ? "left-2" : "left-0.5")} />
              </span>
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

export function PreviewSection() {
  return (
    <section className="relative py-28 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-primary">02 · Launcher</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient tracking-tight">Three surfaces. Zero clutter.</h2>
        </motion.div>

        <div className="space-y-4">
          {surfaces.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <div className="group glass-strong rounded-3xl p-6 md:p-8 grid md:grid-cols-[1fr,1.1fr] gap-8 items-center hover:border-primary/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    <span className="text-primary">0{i + 1}</span> · surface
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <s.Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl font-bold">{s.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base max-w-md">{s.desc}</p>
                </div>

                <div className={cn("relative rounded-2xl border border-white/10 bg-gradient-to-br p-5 overflow-hidden", s.tone)}>
                  <div className="absolute top-2 left-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="mt-5">{s.mock}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
