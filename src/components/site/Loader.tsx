import { motion } from "framer-motion";

export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15), transparent 60%)" }} />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          />
          <motion.div
            className="absolute inset-3 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-[0_0_40px_hsl(var(--primary)/0.6)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-center">
          <div className="font-display text-lg text-gradient">{label}</div>
          <motion.div
            className="text-xs font-mono text-muted-foreground mt-1 tracking-widest"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            COMET · CLIENT
          </motion.div>
        </div>
      </div>
    </div>
  );
}
