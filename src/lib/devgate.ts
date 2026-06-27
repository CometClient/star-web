// Obfuscated developer passcode gate.
// Plaintext is never stored; we keep XOR-masked SHA-256 hashes only.
// Multiple slots allow rotating temporary devs without code edits.

const MASK = 0x5a;

// Slot 0: master (long, issued by ops)
// Slot 1: temp dev passcode — short-lived, rotate when needed
const PACKED = [
  "PmlqP2hiPGM4bzg/Pm1iY2k+Yzxobms/aG5jaD5qbG07Ym1ubjhib2lqazs8b29uY24/aW9obDhpaWpvYm5sOQ==",
  "95vaGHDOUMzh7bXzDowLx4LfvONicSS7f1YRxAWwlIo=",
];

function unmask(packed: string): string {
  const raw = atob(packed);
  let out = "";
  for (let i = 0; i < raw.length; i++) out += (raw.charCodeAt(i) ^ MASK).toString(16).padStart(2, "0");
  return out.slice(0, 64);
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ctEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const devGate = {
  async verify(input: string): Promise<boolean> {
    const actual = await sha256Hex(input);
    let ok = false;
    for (const p of PACKED) {
      // run all comparisons to avoid timing leakage on which slot matched
      if (ctEq(unmask(p), actual)) ok = true;
    }
    return ok;
  },
};
