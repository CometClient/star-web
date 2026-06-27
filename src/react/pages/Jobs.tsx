import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { GlassCard } from "@/components/site/GlassCard";
import { ArrowUpRight, Briefcase, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getJobs, getJobsSettings } from "@/lib/api";
import { motion } from "framer-motion";

interface Job { id: string; title: string; team: string; location: string; description: string | null; apply_url: string | null; }

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [intro, setIntro] = useState("Small team. Big mission. Fully remote, async-first.");
  const [formUrl, setFormUrl] = useState("");

  useEffect(() => {
    getJobs().then((data) => setJobs(data as Job[]));
    getJobsSettings().then((v) => {
      if (v?.intro) setIntro(v.intro);
      if (v?.form_url) setFormUrl(v.form_url);
    });
  }, []);

  return (
    <>
      <SiteHeader />
      <PageShell title="Jobs · Comet Client" description="Open positions at Comet Client. Remote-first team.">
        <PageHero eyebrow="Careers" title="Build with us" sub={intro} />

        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-3 mb-10">
            {[
              { Icon: Users, k: "Remote-first", v: "Across 12 timezones" },
              { Icon: Briefcase, k: "Async by default", v: "No standups. Ever." },
              { Icon: MapPin, k: "Worldwide", v: "Hire from anywhere" },
            ].map((b) => (
              <div key={b.k} className="glass rounded-2xl p-5">
                <b.Icon className="w-5 h-5 text-primary mb-3" />
                <div className="font-display font-semibold">{b.k}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">{b.v}</div>
              </div>
            ))}
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Open positions · {jobs.length}</div>
          <div className="space-y-3">
            {jobs.map((j, i) => {
              const href = j.apply_url || (formUrl ? "#apply" : "#apply");
              const external = !!j.apply_url;
              return (
                <motion.a
                  key={j.id}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="block group"
                >
                  <GlassCard glow className="flex items-start justify-between gap-4 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30">
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-lg group-hover:text-primary transition-colors">{j.title}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-1">{j.team} · {j.location}</div>
                      {j.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{j.description}</p>}
                    </div>
                    <ArrowUpRight className="text-muted-foreground group-hover:text-primary group-hover:rotate-45 transition-all shrink-0" />
                  </GlassCard>
                </motion.a>
              );
            })}
            {jobs.length === 0 && <GlassCard className="text-center text-muted-foreground py-8">No openings right now — check back soon.</GlassCard>}
          </div>

          {formUrl && (
            <div id="apply" className="mt-16">
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Apply</div>
              <h2 className="font-display text-3xl font-bold tracking-tight mb-6">Tell us about you</h2>
              <GlassCard variant="strong" className="overflow-hidden p-0">
                <iframe
                  src={formUrl}
                  title="Application form"
                  className="w-full"
                  style={{ height: 1100, border: 0 }}
                  loading="lazy"
                />
              </GlassCard>
            </div>
          )}
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
