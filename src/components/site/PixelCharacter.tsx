import { cn } from "@/lib/utils";

/**
 * Pixel-art Minecraft-style character (Steve-ish, unbranded).
 * Pure SVG, no external assets. Uses currentColor-friendly palette via design tokens.
 * variant="hero" — large standing character with glow plate.
 * variant="mini" — small head-only chip.
 */
export function PixelCharacter({
  variant = "hero",
  className,
}: { variant?: "hero" | "mini" | "wave"; className?: string }) {
  if (variant === "mini") {
    // 8x8 head
    return (
      <svg viewBox="0 0 8 8" className={cn("w-8 h-8 [image-rendering:pixelated]", className)} aria-hidden>
        <g shapeRendering="crispEdges">
          {/* skin */}
          <rect width="8" height="8" fill="#c8956d" />
          {/* hair */}
          <rect width="8" height="3" fill="#2b1d10" />
          <rect x="0" y="3" width="2" height="1" fill="#2b1d10" />
          <rect x="6" y="3" width="2" height="1" fill="#2b1d10" />
          {/* eyes */}
          <rect x="2" y="4" width="1" height="1" fill="#fff" />
          <rect x="3" y="4" width="1" height="1" fill="#3a6ea5" />
          <rect x="4" y="4" width="1" height="1" fill="#fff" />
          <rect x="5" y="4" width="1" height="1" fill="#3a6ea5" />
          {/* mouth */}
          <rect x="3" y="6" width="2" height="1" fill="#7a4a32" />
        </g>
      </svg>
    );
  }

  // Hero: full body 16x32 grid
  return (
    <svg viewBox="0 0 16 32" className={cn("[image-rendering:pixelated] w-full h-full", className)} aria-hidden>
      <g shapeRendering="crispEdges">
        {/* HEAD 8x8 centered at x=4 */}
        {/* hair */}
        <rect x="4" y="0" width="8" height="3" fill="#2b1d10" />
        <rect x="4" y="3" width="2" height="1" fill="#2b1d10" />
        <rect x="10" y="3" width="2" height="1" fill="#2b1d10" />
        {/* face skin */}
        <rect x="4" y="3" width="8" height="5" fill="#c8956d" />
        <rect x="6" y="3" width="4" height="1" fill="#c8956d" />
        {/* eyes */}
        <rect x="6" y="5" width="1" height="1" fill="#fff" />
        <rect x="7" y="5" width="1" height="1" fill="#3a6ea5" />
        <rect x="9" y="5" width="1" height="1" fill="#fff" />
        <rect x="10" y="5" width="1" height="1" fill="#3a6ea5" />
        {/* nose */}
        <rect x="8" y="6" width="1" height="1" fill="#a87856" />
        {/* mouth */}
        <rect x="7" y="7" width="3" height="1" fill="#7a4a32" />

        {/* TORSO 8x6 — pink shirt (brand) */}
        <rect x="4" y="8" width="8" height="6" fill="hsl(309 92% 91%)" />
        {/* shirt highlight */}
        <rect x="4" y="8" width="8" height="1" fill="hsl(320 30% 100%)" />
        {/* shirt accent */}
        <rect x="7" y="10" width="2" height="2" fill="hsl(309 100% 80%)" />

        {/* ARMS 2x6 each */}
        <rect x="2" y="8" width="2" height="6" fill="hsl(309 80% 78%)" />
        <rect x="12" y="8" width="2" height="6" fill="hsl(309 80% 78%)" />
        {/* hands */}
        <rect x="2" y="13" width="2" height="1" fill="#c8956d" />
        <rect x="12" y="13" width="2" height="1" fill="#c8956d" />

        {/* LEGS 4x6 each — dark jeans */}
        <rect x="4" y="14" width="4" height="6" fill="#1f2a44" />
        <rect x="8" y="14" width="4" height="6" fill="#1f2a44" />
        {/* shoe */}
        <rect x="4" y="19" width="4" height="1" fill="#0a0a0a" />
        <rect x="8" y="19" width="4" height="1" fill="#0a0a0a" />

        {/* shadow plate */}
        <rect x="3" y="20" width="10" height="1" fill="#000" opacity="0.4" />
      </g>
    </svg>
  );
}

/** Floating cube — purely decorative pixel cube */
export function PixelCube({ className, color = "hsl(309 92% 91%)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("[image-rendering:pixelated]", className)} aria-hidden>
      <g shapeRendering="crispEdges">
        {/* top */}
        <rect x="2" y="2" width="12" height="4" fill={color} opacity="0.95" />
        {/* front */}
        <rect x="2" y="6" width="8" height="8" fill={color} opacity="0.7" />
        {/* side */}
        <rect x="10" y="6" width="4" height="8" fill={color} opacity="0.45" />
        {/* outline */}
        <rect x="2" y="2" width="12" height="1" fill="#fff" opacity="0.4" />
        <rect x="2" y="13" width="12" height="1" fill="#000" opacity="0.4" />
      </g>
    </svg>
  );
}
