/** How long after its last ping an account still counts as online. */
export const PRESENCE_WINDOW_SECONDS = 300;

/** How often the launcher is expected to ping. */
export const PING_INTERVAL_SECONDS = 120;

/** How long a resolved Mojang username is trusted before we re-resolve it. */
export const NAME_TTL_SECONDS = 6 * 60 * 60;

/** Presence rows untouched for this long are dropped on the next ping. */
export const PRESENCE_RETENTION_SECONDS = 7 * 24 * 60 * 60;

const DASHED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Accepts dashed or undashed UUIDs, returns the canonical dashed lowercase form. */
export function normalizeUuid(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim().toLowerCase();
  if (DASHED.test(raw)) return raw;
  if (/^[0-9a-f]{32}$/.test(raw)) {
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }
  return null;
}

export function undashUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

export function isoSecondsAgo(seconds: number, now = new Date()): string {
  return new Date(now.getTime() - seconds * 1000).toISOString();
}

/**
 * Username lookup providers, tried in order. Mojang is authoritative but rate
 * limits hard by source IP, which Cloudflare Workers share — so the mirrors
 * are what actually keeps this working at Worker scale.
 */
const NAME_PROVIDERS: { name: string; url: (uuid: string) => string; pick: (body: any) => unknown }[] = [
  {
    name: "mojang",
    url: (u) => `https://sessionserver.mojang.com/session/minecraft/profile/${undashUuid(u)}`,
    pick: (b) => b?.name,
  },
  {
    name: "ashcon",
    url: (u) => `https://api.ashcon.app/mojang/v2/user/${undashUuid(u)}`,
    pick: (b) => b?.username,
  },
  {
    name: "playerdb",
    url: (u) => `https://playerdb.co/api/player/minecraft/${undashUuid(u)}`,
    pick: (b) => b?.data?.player?.username,
  },
];

export interface ResolveAttempt {
  provider: string;
  status: number | null;
  error?: string;
}

/**
 * Resolve a UUID to its current Minecraft username. Returns null (with the
 * per-provider attempts, for diagnostics) when every provider fails, so
 * callers can fall back to a cached name.
 */
export async function resolveUsernameDetailed(
  uuid: string,
): Promise<{ username: string | null; provider: string | null; attempts: ResolveAttempt[] }> {
  const attempts: ResolveAttempt[] = [];
  for (const provider of NAME_PROVIDERS) {
    try {
      const res = await fetch(provider.url(uuid), {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json", "User-Agent": "comet-launcher-presence/1.0" },
      });
      if (!res.ok) {
        attempts.push({ provider: provider.name, status: res.status });
        continue;
      }
      const name = provider.pick(await res.json());
      if (typeof name === "string" && name) {
        attempts.push({ provider: provider.name, status: res.status });
        return { username: name, provider: provider.name, attempts };
      }
      attempts.push({ provider: provider.name, status: res.status, error: "no name in response" });
    } catch (e) {
      attempts.push({ provider: provider.name, status: null, error: String(e).slice(0, 120) });
    }
  }
  return { username: null, provider: null, attempts };
}

export async function resolveUsername(uuid: string): Promise<string | null> {
  return (await resolveUsernameDetailed(uuid)).username;
}
