import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong";
  glow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, Props>(
  ({ className, variant = "default", glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-6 transition-all duration-500",
        variant === "strong" ? "glass-strong" : "glass",
        glow && "hover:glow-pink",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";