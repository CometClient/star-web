const mods = [
  "Sodium", "OptiFine", "Iris Shaders", "Lithium", "Phosphor", "Mod Menu", "Litematica",
  "Coordinates HUD", "Toggle Sneak", "Auto-Sprint", "FPS Counter", "Inventory Tweaks",
  "Better F3", "Custom Skin Loader", "Replay Mod", "Voice Chat", "Mini Map",
];
export function ModsMarquee() {
  const items = [...mods, ...mods];
  return (
    <section className="py-16 overflow-hidden">
      <div className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
        Pre-installed mods · zero setup
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-3 animate-marquee whitespace-nowrap">
          {items.map((m, i) => (
            <span key={i} className="glass rounded-full px-5 py-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors">
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}