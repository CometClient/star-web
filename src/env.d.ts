/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_DB_API_URL?: string;
  readonly DB_API_URL?: string;
  readonly DB_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Workers runtime bindings (accessed via `import { env } from "cloudflare:workers"`)
interface CloudflareEnv {
  /** Service binding to the comet-db worker — used for internal zero-hop calls. */
  DB_WORKER: { fetch: typeof fetch };
  ASSETS: { fetch: typeof fetch };
}