import { Link, useLocation } from "@/lib/navigation";
import { Logo } from "./Logo";

const cols = [
  { title: "Product", links: [["Download", "/download"], ["Store", "/store"], ["Changelog", "/changelog"]] },
  { title: "Resources", links: [["Blog", "/blog"], ["Support", "/support"], ["Status", "/status"]] },
  { title: "Company", links: [["Jobs", "/jobs"], ["Terms", "/tos"], ["Privacy", "/privacy"]] },
];

export function SiteFooter() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/beta")) return null;
  return (
    <footer className="mt-32 px-4 pb-8">
      <div className="container mx-auto">
        <div className="glass-strong rounded-3xl p-10">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground max-w-xs">The next-generation Minecraft client. Crafted in pink, built for performance.</p>
            </div>
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-xs font-display uppercase tracking-widest text-primary/80 mb-4">{c.title}</div>
                <ul className="space-y-2">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link to={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Comet Client. Not affiliated with Mojang or Microsoft.</span>
            <span className="font-mono">v1.21.4 · build 0429</span>
          </div>
        </div>
      </div>
    </footer>
  );
}