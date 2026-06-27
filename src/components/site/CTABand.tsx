import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { Download, ArrowRight } from "lucide-react";

export function CTABand() {
  return (
    <section className="py-28 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="relative glass-strong rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-primary/5" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-primary/25 blur-[100px] rounded-full" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 mb-6 text-[10px] font-mono uppercase tracking-widest text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Free forever
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-5 text-gradient leading-tight">
              Ready to launch?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-9 text-base">
              No account required. No card. Just download and play.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="glow" size="xl">
                <Link to="/download"><Download className="mr-1" /> Download Comet</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/support">Get help <ArrowRight /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
