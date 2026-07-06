/** 3D full-body render for staff cards */
export function craftyFullBody(username: string, opts?: { x?: number; z?: number }) {
  const x = opts?.x ?? -30;
  const z = opts?.z ?? 50;
  return `https://render.crafty.gg/3d/full/${encodeURIComponent(username)}?x=${x}&z=${z}`;
}

/** 3D bust render for blog post authors */
export function craftyBust(username: string) {
  return `https://render.crafty.gg/3d/bust/${encodeURIComponent(username)}`;
}
