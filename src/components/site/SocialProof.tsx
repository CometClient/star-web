import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { ServerLogo, type ServerName } from "./ServerLogos";

const testimonials = [
  { quote: "Imagine a world where simplicity and enjoyment came together — that's Comet.", name: "Adeebur", tag: "Survival", stars: 5 },
  { quote: "OREOREOREOREOREOREO I love comet :3", name: "nocturnify", tag: "PvP enjoyer", stars: 5 },
  { quote: "I've been waiting for Comet, and it's a masterpiece.", name: "carson4685", tag: "Modded SMP", stars: 5 },
];

// mc-heads.net serves the rendered 3D head for any username, no UUID needed.
const headUrl = (name: string) => `https://mc-heads.net/avatar/${encodeURIComponent(name)}/96`;

const networks: ServerName[] = ["hypixel", "mineplex", "hive", "wynncraft"];

export function SocialProof() {
  return (
    <section className="py-28 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Player reviews</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            What players are <span className="text-pink-gradient">actually saying.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={i === 1 ? "md:translate-y-6" : ""}
            >
              <div className="relative h-full glass-strong rounded-2xl p-6 group hover:border-primary/30 transition-colors">
                <div className="absolute top-3 right-5 font-display text-7xl leading-none text-primary/10 select-none">"</div>

                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, k) => (
                    <Star key={k} size={12} className="fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-[15px] text-foreground/90 leading-relaxed mb-6 relative min-h-[5rem]">{t.quote}</p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <img
                    src={headUrl(t.name)}
                    alt={`${t.name}'s Minecraft head`}
                    loading="lazy"
                    className="w-11 h-11 rounded-lg ring-1 ring-white/10 [image-rendering:pixelated] bg-white/[0.03]"
                  />
                  <div>
                    <div className="font-display font-semibold text-sm">{t.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{t.tag}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* More via Discord */}
        <div className="flex justify-center mb-20">
          <a
            href="https://discord.gg/h9wm7XeV86"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 text-sm font-medium hover:border-primary/40 hover:-translate-y-0.5 transition-all"
          >
            More from the community on Discord <ArrowRight size={14} />
          </a>
        </div>

        {/* Compatible networks — only real servers */}
        <div className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
          Compatible with the networks you already play on
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {networks.map((n) => (
            <div key={n} className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5 hover:border-primary/30 hover:-translate-y-0.5 transition-all">
              <ServerLogo name={n} className="w-7 h-7" />
              <span className="font-display font-bold text-sm tracking-tight capitalize">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
