import { cn } from "@/lib/utils";

/**
 * Pixel-art style server-network logos. Pure SVG, no external deps.
 * Stylized inspired-by marks — unique pixel compositions, not exact replicas.
 */

export type ServerName = "hypixel" | "mineplex" | "hive" | "wynncraft";

const wrap = (className?: string) =>
  cn("[image-rendering:pixelated] block", className);

export function ServerLogo({ name, className }: { name: ServerName; className?: string }) {
  switch (name) {
    case "hypixel":
      // Stylized H — gold + red
      return (
        <svg viewBox="0 0 16 16" className={wrap(className)} aria-hidden>
          <g shapeRendering="crispEdges">
            <rect width="16" height="16" rx="2" fill="#1a1d24" />
            <rect x="3" y="3" width="2" height="10" fill="#f4c84a" />
            <rect x="11" y="3" width="2" height="10" fill="#f4c84a" />
            <rect x="5" y="7" width="6" height="2" fill="#e63946" />
            <rect x="3" y="3" width="2" height="2" fill="#fde6a0" />
            <rect x="11" y="3" width="2" height="2" fill="#fde6a0" />
          </g>
        </svg>
      );
    case "mineplex":
      // Green diamond
      return (
        <svg viewBox="0 0 16 16" className={wrap(className)} aria-hidden>
          <g shapeRendering="crispEdges">
            <rect width="16" height="16" rx="2" fill="#0d1f12" />
            <rect x="7" y="2" width="2" height="2" fill="#5fdc7a" />
            <rect x="5" y="4" width="6" height="2" fill="#5fdc7a" />
            <rect x="3" y="6" width="10" height="2" fill="#7ef095" />
            <rect x="5" y="8" width="6" height="2" fill="#5fdc7a" />
            <rect x="7" y="10" width="2" height="2" fill="#3ab85a" />
            <rect x="3" y="6" width="2" height="2" fill="#a8ffba" />
          </g>
        </svg>
      );
    case "hive":
      // Hexagon honeycomb
      return (
        <svg viewBox="0 0 16 16" className={wrap(className)} aria-hidden>
          <g shapeRendering="crispEdges">
            <rect width="16" height="16" rx="2" fill="#2a1d05" />
            <rect x="6" y="2" width="4" height="2" fill="#f5b400" />
            <rect x="4" y="4" width="8" height="2" fill="#ffc933" />
            <rect x="3" y="6" width="10" height="4" fill="#f5b400" />
            <rect x="4" y="10" width="8" height="2" fill="#ffc933" />
            <rect x="6" y="12" width="4" height="2" fill="#c98c00" />
            <rect x="7" y="7" width="2" height="2" fill="#fff1b8" />
          </g>
        </svg>
      );
    case "wynncraft":
      // Sword pixel art
      return (
        <svg viewBox="0 0 16 16" className={wrap(className)} aria-hidden>
          <g shapeRendering="crispEdges">
            <rect width="16" height="16" rx="2" fill="#0c1a2a" />
            <rect x="11" y="2" width="2" height="2" fill="#d8e6ff" />
            <rect x="9" y="4" width="2" height="2" fill="#a8c3f5" />
            <rect x="7" y="6" width="2" height="2" fill="#a8c3f5" />
            <rect x="5" y="8" width="2" height="2" fill="#a8c3f5" />
            <rect x="3" y="10" width="2" height="2" fill="#d8e6ff" />
            <rect x="2" y="11" width="2" height="2" fill="#7a5a2a" />
            <rect x="4" y="9" width="2" height="2" fill="#b88a4a" />
            <rect x="10" y="3" width="2" height="2" fill="#fff" />
          </g>
        </svg>
      );
  }
}
