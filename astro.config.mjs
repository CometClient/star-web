// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_PROXY = process.env.PUBLIC_API_URL || "https://comet-db-proxy.mrrpmeowfurry.dev";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      esbuildOptions: {
        jsx: "automatic",
      },
    },
    ssr: {
      noExternal: ["react-markdown", "remark-gfm"],
    },
    server: {
      proxy: {
        "/api/launcher": {
          target: API_PROXY,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/launcher/, "/api/launcher"),
        },
      },
    },
  },
});
