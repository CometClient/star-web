import { Link, useLocation } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/site/GlassCard";
import { ShieldOff, ArrowLeft, LogIn } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { motion } from "framer-motion";

export default function Denied() {
  const { search } = useLocation();
  const reason =
    new URLSearchParams(search).get("reason") ?? "You don't have access to this area.";
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, hsl(0 84% 60% / 0.12), transparent 60%)" }} />
      <div className="absolute top-6 left-6"><Link to="/"><Logo /></Link></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <GlassCard variant="strong" className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center">
              <ShieldOff className="text-destructive" size={28} />
            </div>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-destructive mb-2">403 · Access denied</div>
          <h1 className="font-display text-3xl font-bold text-gradient mb-3">Restricted area</h1>
          <p className="text-sm text-muted-foreground mb-6">{reason}</p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="glass"><Link to="/"><ArrowLeft size={14} /> Home</Link></Button>
            <Button asChild variant="glow"><Link to="/auth"><LogIn size={14} /> Sign in</Link></Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
