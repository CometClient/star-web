import { Link, NavLink, useLocation } from "@/lib/navigation";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, Download, ShoppingBag, FileText, Briefcase, LifeBuoy, Activity, History, Home } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Cat { label: string; items: { to: string; label: string; desc?: string; icon: any }[] }

const categories: Cat[] = [
  {
    label: "Product", items: [
      { to: "/download", label: "Download", desc: "Get the launcher", icon: Download },
      { to: "/store", label: "Store", desc: "Capes & cosmetics", icon: ShoppingBag },
      { to: "/changelog", label: "Changelog", desc: "Every release", icon: History },
    ],
  },
  {
    label: "Resources", items: [
      { to: "/blog", label: "Blog", desc: "News & updates", icon: FileText },
      { to: "/support", label: "Help center", desc: "Articles & tickets", icon: LifeBuoy },
      { to: "/status", label: "Status", desc: "Live system health", icon: Activity },
    ],
  },
  {
    label: "Company", items: [
      { to: "/jobs", label: "Jobs", desc: "Join the team", icon: Briefcase },
    ],
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const loc = useLocation();
  const closeTimer = useRef<number | null>(null);

  useEffect(() => { setOpen(false); setActiveCat(null); }, [loc.pathname]);
  if (loc.pathname.startsWith("/beta")) return null;

  const openCat = (label: string) => {
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
    setActiveCat(label);
  };
  const closeCat = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setActiveCat(null), 140);
  };

  const isHome = loc.pathname === "/";

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 px-4 pt-3 transition-all duration-300", isHome && "pt-4")}>
      <div className="container mx-auto relative">
        <div className={cn(
          "rounded-full pl-5 pr-3 py-2.5 flex items-center justify-between transition-all duration-300",
          isHome
            ? "border border-white/8 bg-black/25 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            : "glass-strong",
        )}>
          <Link to="/" aria-label="Comet Client home" className="shrink-0"><Logo /></Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) => cn("px-3 py-2 text-sm font-medium rounded-full transition-colors inline-flex items-center gap-1.5",
              isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}>
              <Home size={14} /> Home
            </NavLink>

            {categories.map((cat) => (
              <div key={cat.label} className="relative" onMouseEnter={() => openCat(cat.label)} onMouseLeave={closeCat}>
                <button
                  className={cn("px-3 py-2 text-sm font-medium rounded-full transition-colors inline-flex items-center gap-1",
                    activeCat === cat.label ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}
                >
                  {cat.label}
                  <ChevronDown size={12} className={cn("transition-transform", activeCat === cat.label && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {activeCat === cat.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-72 z-50"
                    >
                      <div className="rounded-2xl p-2 bg-[rgba(12,12,16,0.92)] backdrop-blur-xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]">
                        {cat.items.map((it) => (
                          <Link key={it.to} to={it.to}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                              <it.icon size={14} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{it.label}</div>
                              {it.desc && <div className="text-[11px] text-muted-foreground">{it.desc}</div>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="glow" size="sm" className="rounded-full">
              <Link to="/download">Get Comet</Link>
            </Button>
          </div>

          <button className="md:hidden text-foreground p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute left-0 right-0 top-full mt-2 glass-strong rounded-2xl p-4 space-y-4"
            >
              <NavLink to="/" end onClick={() => setOpen(false)}
                className={({ isActive }) => cn("block px-3 py-2 rounded-lg text-sm", isActive ? "text-primary bg-primary/5" : "text-muted-foreground")}>
                Home
              </NavLink>
              {categories.map((cat) => (
                <div key={cat.label}>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80 px-3 mb-1">{cat.label}</div>
                  {cat.items.map((it) => (
                    <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                      className={({ isActive }) => cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}>
                      <it.icon size={14} /> {it.label}
                    </NavLink>
                  ))}
                </div>
              ))}
              <Button asChild variant="glow" size="sm" className="w-full">
                <Link to="/download" onClick={() => setOpen(false)}>Download</Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
