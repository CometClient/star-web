import { motion } from "framer-motion";
import { Package, Sparkles, Gauge, Sliders, Layers, Wrench } from "lucide-react";

const features = [
  { icon: Gauge, title: "Boosted FPS", desc: "Sodium + Iris baked in. Frames more than double on most setups, with stable 1% lows." },
  { icon: Package, title: "15+ Fabric mods bundled", desc: "Performance, QoL, and visuals — curated and version-locked. Zero setup." },
  { icon: Layers, title: "Pick your version", desc: "Switch between 1.20.x, 1.21.x and snapshots. Each ships with the right mod set." },
  { icon: Wrench, title: "Add your own mods", desc: "Drop any Fabric jar into the launcher. We sort, validate, and load it cleanly." },
  { icon: Sliders, title: "Built-in mod menu", desc: "Every bundled mod is configurable from one panel — no flipping through 12 GUIs." },
  { icon: Sparkles, title: "Clean, native UI", desc: "A launcher that feels like a real app, not a fan project." },
];

export function FeatureGrid() {
  return (
    <section className="relative px-4 py-28 md:py-36">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 text-[10px] font-mono uppercase tracking-[0.25em] text-primary">01 · Client</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Fabric-first.{" "}
            <span className="text-pink-gradient">Yours to bend.</span>
          </h2>
          <p className="text-muted-foreground mt-5 text-base">
            One install, every Fabric version. Add the mods you want, tweak the ones we ship — all from one menu.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <div className="group relative h-full glass rounded-2xl p-7 overflow-hidden transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/20">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
