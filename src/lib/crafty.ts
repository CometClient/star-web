/** 3D bust render (crafty.gg) — used on staff cards and post authors. */
export function craftyBust(username: string) {
  return `https://render.crafty.gg/3d/bust/${encodeURIComponent(username)}`;
}

/** 3D full-body render (crafty.gg). */
export function craftyFullBody(username: string, opts?: { x?: number; z?: number }) {
  const x = opts?.x ?? -30;
  const z = opts?.z ?? 50;
  return `https://render.crafty.gg/3d/full/${encodeURIComponent(username)}?x=${x}&z=${z}`;
}

// crafty.gg sits behind Cloudflare bot protection and can 403 some visitors,
// which used to leave broken <img> boxes. mc-heads.net always answers (and
// falls back to the Steve skin for unknown usernames) — wire these up via
// onerror so a blocked render swaps to a working one.

/** Fallback head render for avatars. */
export function mcHeadsHead(username: string) {
  return `https://mc-heads.net/head/${encodeURIComponent(username)}/104`;
}

/** Fallback body render for staff cards. */
export function mcHeadsBody(username: string) {
  return `https://mc-heads.net/body/${encodeURIComponent(username)}/200`;
}
