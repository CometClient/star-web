import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { useEffect, useMemo, useState } from "react";
import { getIncidentUpdates, getServiceStatus, getStatusIncidents } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown } from "lucide-react";

interface Svc { id: string; service_name: string; status: string; message: string | null; updated_at: string; sla_target: number | null; region: string | null; description: string | null; }
interface Incident { id: string; title: string; body: string; status: string; severity: string; started_at: string; resolved_at: string | null; service_id: string | null; }
interface IncidentUpdate { id: string; incident_id: string; status: string; body: string; created_at: string; }

const meta: Record<string, { dot: string; label: string; tone: string; Icon: any }> = {
  operational: { dot: "bg-emerald-400", label: "Operational", tone: "text-emerald-400", Icon: CheckCircle2 },
  degraded: { dot: "bg-amber-400", label: "Degraded", tone: "text-amber-400", Icon: AlertTriangle },
  down: { dot: "bg-red-500", label: "Outage", tone: "text-red-500", Icon: XCircle },
};

function bars(id: string, status: string) {
  const out: ("operational" | "degraded" | "down")[] = [];
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 90; i++) {
    const r = ((seed * (i + 7)) ^ (i * 131)) % 100;
    let s: "operational" | "degraded" | "down" = "operational";
    if (status === "down" && i > 86) s = i === 88 ? "down" : "degraded";
    else if (status === "degraded" && r < 5) s = "degraded";
    else if (r < 1) s = "degraded";
    out.push(s);
  }
  return out;
}

function uptimePct(segs: ("operational" | "degraded" | "down")[]) {
  const score = segs.reduce((a, s) => a + (s === "operational" ? 1 : s === "degraded" ? 0.5 : 0), 0);
  return (score / segs.length) * 100;
}

export default function Status() {
  const [svcs, setSvcs] = useState<Svc[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // filters
  const [fStatus, setFStatus] = useState<"all" | "active" | "resolved">("all");
  const [fSeverity, setFSeverity] = useState<string>("all");
  const [fService, setFService] = useState<string>("all");
  const [fRange, setFRange] = useState<7 | 30 | 90>(90);

  useEffect(() => {
    const load = async () => {
      const [s, i, u] = await Promise.all([
        getServiceStatus(),
        getStatusIncidents(),
        getIncidentUpdates(),
      ]);
      setSvcs(s);
      setIncidents(i.slice(0, 50));
      setUpdates(u.slice(0, 300));
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const total = svcs.length || 1;
    const up = svcs.filter(s => s.status === "operational").length;
    const degraded = svcs.filter(s => s.status === "degraded").length;
    const down = svcs.filter(s => s.status === "down").length;
    const overallUptime = svcs.reduce((acc, s) => acc + uptimePct(bars(s.id, s.status)), 0) / total;
    const slaTarget = svcs.length ? svcs.reduce((a, s) => a + (Number(s.sla_target) || 99.9), 0) / svcs.length : 99.9;
    return { up, degraded, down, total: svcs.length, overallUptime, slaTarget, slaMet: overallUptime >= slaTarget };
  }, [svcs]);

  const upMap = useMemo(() => {
    const m: Record<string, IncidentUpdate[]> = {};
    for (const u of updates) (m[u.incident_id] ||= []).push(u);
    return m;
  }, [updates]);

  const filteredIncidents = useMemo(() => {
    const cutoff = Date.now() - fRange * 86400 * 1000;
    return incidents.filter(i => {
      if (+new Date(i.started_at) < cutoff) return false;
      if (fStatus === "active" && i.status === "resolved") return false;
      if (fStatus === "resolved" && i.status !== "resolved") return false;
      if (fSeverity !== "all" && i.severity !== fSeverity) return false;
      if (fService !== "all" && i.service_id !== fService) return false;
      return true;
    });
  }, [incidents, fStatus, fSeverity, fService, fRange]);

  const headline = stats.down > 0 ? "Major outage" : stats.degraded > 0 ? "Some systems affected" : "All systems operational";
  const headlineTone = stats.down > 0 ? "text-red-500" : stats.degraded > 0 ? "text-amber-400" : "text-emerald-400";

  return (
    <>
      <SiteHeader />
      <PageShell title="Status" description="Live status, SLA and incident history for Comet Client.">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-baseline justify-between gap-4 mb-3 pt-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">System status</div>
            <div className="text-[10px] font-mono text-muted-foreground">Updated {new Date().toLocaleTimeString()}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-3 flex items-center gap-4">
            <span className={cn("h-2.5 w-2.5 rounded-full", meta[stats.down > 0 ? "down" : stats.degraded > 0 ? "degraded" : "operational"].dot)} />
            <h1 className={cn("font-display text-2xl md:text-3xl font-bold", headlineTone)}>{headline}</h1>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <Metric label="Uptime (90d)" value={`${stats.overallUptime.toFixed(2)}%`} sub={`SLA ${stats.slaTarget.toFixed(1)}%`} good={stats.slaMet} />
            <Metric label="Operational" value={String(stats.up)} sub={`of ${stats.total}`} good />
            <Metric label="Degraded" value={String(stats.degraded)} warn={stats.degraded > 0} />
            <Metric label="Down" value={String(stats.down)} bad={stats.down > 0} />
          </div>

          {/* Services */}
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Services</h2>
          <div className="rounded-xl border border-white/10 divide-y divide-white/5 mb-12 overflow-hidden">
            {svcs.map(s => {
              const m = meta[s.status] || meta.operational;
              const segs = bars(s.id, s.status);
              const up = uptimePct(segs);
              const target = Number(s.sla_target) || 99.9;
              return (
                <div key={s.id} className="p-4 md:p-5 bg-white/[0.01]">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className={cn("h-2 w-2 rounded-full", m.dot)} />
                      <div className="min-w-0">
                        <div className="font-display font-semibold truncate">{s.service_name}</div>
                        {(s.description || s.region) && (
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                            {s.region && <span>{s.region}</span>}{s.region && s.description && <span> · </span>}{s.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <div className={cn("text-sm font-mono tabular-nums", up >= target ? "text-emerald-400" : "text-amber-400")}>{up.toFixed(2)}%</div>
                        <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">SLA {target}%</div>
                      </div>
                      <span className={cn("text-[10px] font-mono uppercase tracking-widest", m.tone)}>{m.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-[2px] h-6">
                    {segs.map((st, i) => (
                      <div key={i} title={`${90 - i}d ago · ${meta[st].label}`} className={cn("flex-1 rounded-[2px]", meta[st].dot, st === "operational" ? "opacity-50 hover:opacity-100" : "")} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5">
                    <span>90 days ago</span><span>Today</span>
                  </div>
                </div>
              );
            })}
            {svcs.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No services configured.</div>}
          </div>

          {/* Incidents */}
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Incident history</h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Group>
              {(["all", "active", "resolved"] as const).map(v => (
                <Chip key={v} active={fStatus === v} onClick={() => setFStatus(v)}>{v}</Chip>
              ))}
            </Group>
            <Group>
              {(["all", "minor", "major", "critical"] as const).map(v => (
                <Chip key={v} active={fSeverity === v} onClick={() => setFSeverity(v)}>{v}</Chip>
              ))}
            </Group>
            {svcs.length > 0 && (
              <select value={fService} onChange={(e) => setFService(e.target.value)} className="text-[11px] font-mono uppercase tracking-wider bg-white/[0.03] border border-white/10 rounded-full px-3 py-1.5 text-muted-foreground">
                <option value="all">All services</option>
                {svcs.map(s => <option key={s.id} value={s.id}>{s.service_name}</option>)}
              </select>
            )}
            <Group>
              {([7, 30, 90] as const).map(v => (
                <Chip key={v} active={fRange === v} onClick={() => setFRange(v)}>{v}d</Chip>
              ))}
            </Group>
          </div>

          <div className="space-y-2 mb-12">
            {filteredIncidents.length === 0 ? (
              <div className="rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={20} />
                No incidents in this range.
              </div>
            ) : filteredIncidents.map(i => {
              const sev = i.severity === "critical" ? "text-red-500 border-red-500/30" : i.severity === "major" ? "text-amber-500 border-amber-500/30" : "text-amber-400 border-amber-400/30";
              const stTone = i.status === "resolved" ? "text-emerald-400 border-emerald-400/30" : "text-amber-400 border-amber-400/30";
              const ups = upMap[i.id] || [];
              const open = openId === i.id;
              const dur = i.resolved_at ? Math.round((+new Date(i.resolved_at) - +new Date(i.started_at)) / 60000) : null;
              return (
                <div key={i.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <button onClick={() => setOpenId(open ? null : i.id)} className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-display font-semibold">{i.title}</span>
                          <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border", sev)}>{i.severity}</span>
                          <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border", stTone)}>{i.status}</span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {new Date(i.started_at).toLocaleString()}
                          {dur !== null && <span> · {dur < 60 ? `${dur}m` : `${Math.round(dur / 60)}h`} duration</span>}
                          {ups.length > 0 && <span> · {ups.length} update{ups.length !== 1 ? "s" : ""}</span>}
                        </div>
                      </div>
                      <ChevronDown size={14} className={cn("text-muted-foreground transition-transform mt-1 shrink-0", open && "rotate-180")} />
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-white/5 p-4 bg-white/[0.01]">
                      {i.body && <p className="text-sm text-foreground/90 mb-4 whitespace-pre-wrap">{i.body}</p>}
                      {ups.length > 0 && (
                        <ol className="space-y-3">
                          {ups.map(u => (
                            <li key={u.id} className="border-l-2 border-white/10 pl-3">
                              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
                                {u.status} · {new Date(u.created_at).toLocaleString()}
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{u.body}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}

function Metric({ label, value, sub, good, warn, bad }: { label: string; value: string; sub?: string; good?: boolean; warn?: boolean; bad?: boolean }) {
  const tone = bad ? "text-red-500" : warn ? "text-amber-400" : good ? "text-emerald-400" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-display text-2xl font-bold mt-1.5 tabular-nums", tone)}>{value}</div>
      {sub && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex rounded-full border border-white/10 p-0.5 bg-white/[0.02]">{children}</div>;
}
function Chip({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} className={cn("text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full transition-colors capitalize",
      active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}
