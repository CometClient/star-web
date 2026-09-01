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
    <div className={cn("group flex items-center gap-2.5", className)}>
      <span className={cn("relative inline-flex shrink-0", s.icon)}>
        <span className="absolute inset-0 rounded-full bg-primary/30 blur-lg scale-125" aria-hidden />
        <svg
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden
          className={cn("relative h-full w-full text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)] transition-transform duration-500 group-hover:rotate-[18deg]", iconClassName)}
        >
          <path d="M245.11,60.68c-7.65-13.19-27.85-16.16-58.5-8.66A96,96,0,0,0,32.81,140.3C5.09,169,5.49,186,10.9,195.32,16,204.16,26.64,208,40.64,208a124.11,124.11,0,0,0,28.79-4,96,96,0,0,0,153.78-88.25c12.51-13,20.83-25.35,23.66-35.92C248.83,72.51,248.24,66.07,245.11,60.68Zm-13.69,15c-6.11,22.78-48.65,57.31-87.52,79.64-67.81,39-113.62,41.52-119.16,32-1.46-2.51-.65-7.24,2.22-13a80.06,80.06,0,0,1,10.28-15.05,95.53,95.53,0,0,0,6.23,14.18,4,4,0,0,0,4,2.12,122.14,122.14,0,0,0,16.95-3.32c21.23-5.55,46.63-16.48,71.52-30.78s47-30.66,62.45-46.15A122.74,122.74,0,0,0,209.7,82.45a4,4,0,0,0,.17-4.52,96.26,96.26,0,0,0-9.1-12.46c14.21-2.35,27.37-2.17,30.5,3.24C232.19,70.28,232.24,72.63,231.42,75.69Z" />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn("font-display font-bold tracking-tight text-foreground", s.text)}>
          comet<span className="text-primary">.</span>
        </span>
      )}
    </div>
  );
}
