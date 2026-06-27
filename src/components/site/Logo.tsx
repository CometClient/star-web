import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { icon: "h-6 w-6", text: "text-base" },
  md: { icon: "h-8 w-8", text: "text-xl" },
  lg: { icon: "h-11 w-11", text: "text-2xl" },
  xl: { icon: "h-16 w-16 md:h-20 md:w-20", text: "text-3xl md:text-4xl" },
};

export function Logo({ className, iconClassName, showWordmark = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("relative inline-flex shrink-0", s.icon)}>
        <span className="absolute inset-0 rounded-full bg-primary/30 blur-lg scale-125" aria-hidden />
        <img
          src="/comet-logo.png"
          alt=""
          className={cn("relative h-full w-full object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)]", iconClassName)}
          width={80}
          height={80}
        />
      </span>
      {showWordmark && (
        <span className={cn("font-display font-bold tracking-tight text-foreground", s.text)}>
          comet<span className="text-primary">.</span>
        </span>
      )}
    </div>
  );
}
