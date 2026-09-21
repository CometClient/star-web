export type BetaOs = "windows" | "macos" | "linux";
export type BetaArch = "arm64" | "x64";

export type BetaBuildInfo = {
  id: string;
  version: string;
  platform: string;
  filename: string;
  size_bytes: number;
  sha256?: string | null;
  notes?: string | null;
};

export const BETA_OS_OPTIONS: { id: BetaOs; label: string }[] = [
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

export const BETA_ARCH_OPTIONS: { id: BetaArch; label: string; hint: string }[] = [
  { id: "arm64", label: "ARM64", hint: "Apple Silicon, Snapdragon, aarch64" },
  { id: "x64", label: "x64", hint: "Intel / AMD" },
];

export const BETA_PLATFORM_TAGS: { id: string; os: BetaOs | "universal"; arch: BetaArch | null; label: string }[] = [
  { id: "windows-x64", os: "windows", arch: "x64", label: "Windows · x64" },
  { id: "windows-arm64", os: "windows", arch: "arm64", label: "Windows · ARM64" },
  { id: "macos-arm64", os: "macos", arch: "arm64", label: "macOS · Apple Silicon" },
  { id: "macos-x64", os: "macos", arch: "x64", label: "macOS · Intel" },
  { id: "linux-x64", os: "linux", arch: "x64", label: "Linux · x64" },
  { id: "linux-arm64", os: "linux", arch: "arm64", label: "Linux · ARM64" },
  { id: "windows", os: "windows", arch: null, label: "Windows (any arch)" },
  { id: "macos", os: "macos", arch: null, label: "macOS (any arch)" },
  { id: "linux", os: "linux", arch: null, label: "Linux (any arch)" },
  { id: "universal", os: "universal", arch: null, label: "Universal" },
];

/** Fold the names people actually type (amd64, aarch64, darwin) into the tags above. */
export function normalizePlatformTag(raw: string): string {
  let p = raw.trim().toLowerCase().replace(/[_\s]+/g, "-");
  p = p.replace(/amd64|x86[_-]?64|intel/g, "x64");
  p = p.replace(/aarch64|arm_64/g, "arm64");
  p = p.replace(/^darwin/, "macos");
  p = p.replace(/^(win32|win)(?=-|$)/, "windows");
  p = p.replace(/^(windows|macos|linux)(x64|arm64)$/, "$1-$2");
  return p || "universal";
}

export function platformLabel(tag: string): string {
  const normalized = normalizePlatformTag(tag);
  return BETA_PLATFORM_TAGS.find((t) => t.id === normalized)?.label ?? tag;
}

export function parsePlatformTag(tag: string): { os: BetaOs | "universal"; arch: BetaArch | null } {
  const normalized = normalizePlatformTag(tag);
  const known = BETA_PLATFORM_TAGS.find((t) => t.id === normalized);
  if (known) return { os: known.os, arch: known.arch };
  const [os, arch] = normalized.split("-");
  const osId = os === "windows" || os === "macos" || os === "linux" ? os : "universal";
  const archId = arch === "arm64" || arch === "x64" ? arch : null;
  return { os: osId, arch: archId };
}

/** A build matches the picker when it's universal, OS-only, or the exact os-arch tag. */
export function buildMatches(build: { platform: string }, os: BetaOs, arch: BetaArch): boolean {
  const parsed = parsePlatformTag(build.platform);
  if (parsed.os === "universal") return true;
  if (parsed.os !== os) return false;
  return parsed.arch == null || parsed.arch === arch;
}

export function pickBuild(builds: BetaBuildInfo[], os: BetaOs, arch: BetaArch): BetaBuildInfo | null {
  const matches = builds.filter((b) => buildMatches(b, os, arch));
  const exact = matches.find((b) => parsePlatformTag(b.platform).arch === arch);
  return exact ?? matches[0] ?? null;
}

export function detectOs(): BetaOs {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";
  if (platform.includes("mac") || ua.includes("mac os")) return "macos";
  if (platform.includes("linux") || ua.includes("linux") || ua.includes("android")) return "linux";
  return "windows";
}

export async function detectArch(): Promise<BetaArch> {
  const nav = navigator as Navigator & {
    userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }> };
  };
  try {
    const info = await nav.userAgentData?.getHighEntropyValues?.(["architecture"]);
    const a = info?.architecture?.toLowerCase() ?? "";
    if (a.includes("arm")) return "arm64";
    if (a.includes("86") || a === "x64") return "x64";
  } catch {
    /* userAgentData isn't everywhere; fall through to UA sniffing */
  }
  const ua = navigator.userAgent.toLowerCase();
  if (/\b(arm64|aarch64)\b/.test(ua)) return "arm64";
  // Apple Silicon still reports MacIntel in most browsers — default to ARM on macOS.
  if (detectOs() === "macos") return "arm64";
  return "x64";
}
