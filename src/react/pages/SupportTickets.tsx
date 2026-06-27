import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { Link, useNavigate } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { getTicketMessages, getTickets, postTicketMessage, updateTicket } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Ticket { id: string; subject: string; status: string; priority: string; category: string | null; created_at: string; updated_at: string; }
interface Msg { id: string; body: string; is_staff: boolean; created_at: string; author_id: string; }

const statusTone: Record<string, string> = {
  open: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  pending: "bg-sky-400/10 text-sky-400 border-sky-400/30",
  resolved: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  closed: "bg-white/5 text-muted-foreground border-white/10",
};
const priorityTone: Record<string, string> = {
  low: "text-muted-foreground", normal: "text-foreground", high: "text-amber-400", urgent: "text-red-400",
};

export default function SupportTickets() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");

  const loadTickets = () => {
    if (!user) return;
    getTickets(user.id).then(setTickets).catch(() => setTickets([]));
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/auth"); return; }
    loadTickets();
    const id = window.setInterval(loadTickets, 30_000);
    return () => window.clearInterval(id);
  }, [user, loading, nav]);

  useEffect(() => {
    if (!active) return;
    getTicketMessages(active.id).then(setMsgs).catch(() => setMsgs([]));
    const id = window.setInterval(() => {
      getTicketMessages(active.id).then(setMsgs).catch(() => {});
    }, 15_000);
    return () => window.clearInterval(id);
  }, [active?.id]);

  const send = async () => {
    if (!user || !active || !reply.trim()) return;
    try {
      await postTicketMessage({
        ticket_id: active.id,
        author_id: user.id,
        body: reply.trim(),
        is_staff: false,
      });
      await updateTicket(active.id, { status: "open", updated_at: new Date().toISOString() });
      setReply("");
      setMsgs(await getTicketMessages(active.id));
      loadTickets();
    } catch (err: any) {
      toast.error(err.message || "Could not send reply");
    }
  };

  if (!user) return null;

  return (
    <>
      <SiteHeader />
      <PageShell title="My tickets" description="Your support ticket history.">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link to="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={14} /> Help center</Link>
            <Button asChild variant="glow" size="sm"><Link to="/support/new"><Plus size={14} /> New ticket</Link></Button>
          </div>

          {!active ? (
            <>
              <h1 className="font-display text-3xl font-bold mb-6">My tickets</h1>
              <div className="space-y-2">
                {tickets.map(t => (
                  <button key={t.id} onClick={() => setActive(t)} className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display font-semibold truncate">{t.subject}</div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                          <span>{t.category || "general"}</span>
                          <span className={priorityTone[t.priority]}>{t.priority}</span>
                          <span>Updated {new Date(t.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded border", statusTone[t.status] || statusTone.open)}>{t.status}</span>
                    </div>
                  </button>
                ))}
                {tickets.length === 0 && (
                  <div className="rounded-xl border border-white/10 p-8 text-center text-sm text-muted-foreground">
                    No tickets yet. <Link to="/support/new" className="text-primary hover:underline">Open one</Link>.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <button onClick={() => setActive(null)} className="text-xs text-muted-foreground hover:text-primary mb-4 flex items-center gap-1"><ArrowLeft size={12} /> All tickets</button>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="font-display text-xl font-bold">{active.subject}</h2>
                  <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded border", statusTone[active.status] || statusTone.open)}>{active.status}</span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">#{active.id.slice(0, 8)} · {active.category || "general"} · {active.priority}</div>
              </div>

              <div className="space-y-3 mb-5">
                {msgs.map(m => (
                  <div key={m.id} className={cn("rounded-xl border p-4", m.is_staff ? "border-primary/30 bg-primary/[0.04]" : "border-white/10 bg-white/[0.02]")}>
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className={m.is_staff ? "text-primary" : "text-muted-foreground"}>{m.is_staff ? "Comet staff" : "You"}</span>
                      <span className="text-muted-foreground">· {new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>

              {active.status !== "closed" && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a reply…" />
                  <div className="flex justify-end"><Button variant="glow" onClick={send} disabled={!reply.trim()}>Send reply</Button></div>
                </div>
              )}
            </div>
          )}
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
