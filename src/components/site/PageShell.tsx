import { ReactNode, useEffect } from "react";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageShell({ title, description, children }: Props) {
  useEffect(() => {
    document.title = `${title} · Comet Client`;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", description);
    }
    let c = document.querySelector('link[rel="canonical"]');
    if (!c) {
      c = document.createElement("link");
      c.setAttribute("rel", "canonical");
      document.head.appendChild(c);
    }
    c.setAttribute("href", window.location.href);
  }, [title, description]);
  return <main className="min-h-[60vh] pt-28 pb-24 px-4 container mx-auto">{children}</main>;
}

export function PageHero({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto py-16 animate-fade-in">
      {eyebrow && <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">{eyebrow}</div>}
      <h1 className="font-display text-5xl md:text-7xl font-bold text-gradient leading-tight">{title}</h1>
      {sub && <p className="mt-6 text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}