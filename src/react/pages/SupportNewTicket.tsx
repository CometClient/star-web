import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "@/lib/navigation";
import { useState } from "react";
import { createTicket, postTicketMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function SupportNewTicket() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("account");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (!user) {
    nav("/auth", { replace: true });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return toast.error("Subject and message required");
    setSubmitting(true);
    try {
      const ticket = await createTicket({
        user_id: user.id,
        subject: subject.trim(),
        body: body.trim(),
        priority,
        category,
      });
      await postTicketMessage({
        ticket_id: ticket.id,
        author_id: user.id,
        body: body.trim(),
        is_staff: false,
      });
      toast.success("Ticket opened");
      nav("/support/tickets");
    } catch (err: any) {
      toast.error(err.message || "Could not open ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <PageShell title="New ticket" description="Open a support ticket with the Comet team.">
        <div className="max-w-2xl mx-auto">
          <Link to="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft size={14} /> Back</Link>
          <h1 className="font-display text-3xl font-bold mb-2">Open a ticket</h1>
          <p className="text-muted-foreground mb-8 text-sm">Tell us what's going on. We typically reply within 24 hours.</p>
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} maxLength={140} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="launcher">Launcher</SelectItem>
                    <SelectItem value="cosmetics">Cosmetics</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="bug">Bug report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={8} value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} placeholder="What happened? Steps, expected vs actual, screenshots links…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => nav("/support")}>Cancel</Button>
              <Button type="submit" variant="glow" disabled={submitting}>{submitting ? "Opening…" : "Open ticket"}</Button>
            </div>
          </form>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
