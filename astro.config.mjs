// @ts-check
import { defineConfig } from "astro/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_PROXY = process.env.PUBLIC_API_URL || "https://comet-db-proxy.mrrpmeowfurry.dev";

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: API_PROXY,
          changeOrigin: true,
        },
      },
    },
  },
});
