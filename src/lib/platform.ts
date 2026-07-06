export type PlatformId = "windows" | "macos" | "linux";

export interface PlatformOption {
  id: PlatformId;
  label: string;
  shortLabel: string;
  downloadLabel: string;
  version: string;
  url: string;
}

export const PLATFORMS: PlatformOption[] = [
  {
    id: "windows",
    label: "Windows",
    shortLabel: "Windows",
    downloadLabel: "Download for Windows",
    version: "1.0.0",
    url: "#",
  },
  {
    id: "macos",
    label: "macOS · Apple Silicon",
    shortLabel: "macOS",
    downloadLabel: "Download for macOS",
    version: "1.0.0",
    url: "#",
  },
  {
    id: "linux",
    label: "Linux",
    shortLabel: "Linux",
    downloadLabel: "Download for Linux",
    version: "1.0.0",
    url: "#",
  },
];

export function detectPlatform(): PlatformId {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";

  if (platform.includes("mac") || ua.includes("mac os")) return "macos";
  if (platform.includes("linux") || ua.includes("linux") || ua.includes("android")) return "linux";
  return "windows";
}

export function platformById(id: PlatformId): PlatformOption {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}
