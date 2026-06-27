import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { useEffect, useState } from "react";
import { getLauncherVersions } from "@/lib/api";
import { GitBranch, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Version {
  id: string; channel: string; version: string; notes: string | null;
  download_url: string | null; published_at: string;
}

const channelTone: Record<string, string> = {
  stable: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  beta: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  dev: "text-sky-400 border-sky-400/30 bg-sky-400/5",
};

export default function Changelog() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Changelog · Comet Client";
    getLauncherVersions()
      .then((data) => {
        setVersions(
          data.map((v) => ({
            id: v.id,
            channel: v.channel,
            version: v.version,
            notes: v.notes,
            download_url: null,
            published_at: v.published_at ?? "",
          })),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <SiteHeader />
      <PageShell title="Changelog" description="Every Comet release, in order. Pulled live from our build pipeline.">
        <div className="max-w-3xl mx-auto">
          {loading && <div className="text-center text-sm text-muted-foreground py-12">Loading…</div>}
          {!loading && versions.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
              No releases published yet.
            </div>
          )}

          <div className="relative">
            {/* timeline rail */}
            {versions.length > 0 && <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />}
            <div className="space-y-6">
              {versions.map((v) => (
                <div key={v.id} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center">
                    <Tag size={11} className="text-primary" />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-display text-xl font-bold">v{v.version}</span>
                      <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded border", channelTone[v.channel] || channelTone.stable)}>
                        <GitBranch size={9} className="inline mr-1" />{v.channel}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground ml-auto">
                        {new Date(v.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </span>
                    </div>
                    {v.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{v.notes}</p>}
                    {v.download_url && (
                      <a href={v.download_url} className="inline-block mt-3 text-xs font-mono text-primary hover:underline">
                        Download →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
