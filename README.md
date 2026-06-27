# Comet Web

Public Comet Client site built with [Astro](https://astro.build) + React islands. All data is fetched from the **Comet DB proxy** API.

## Setup

```sh
cp .env.example .env
npm install
npm run dev
```

Dev server: `http://localhost:4321` — `/api/*` is proxied to `comet-db-proxy.mrrpmeowfurry.dev`.

## API

Base URL: `PUBLIC_API_URL` (default `https://comet-db-proxy.mrrpmeowfurry.dev`)

| Method | Path | Used by |
|--------|------|---------|
| GET | `/api/health` | health check |
| GET | `/api/products` | store (`?slug=` for one product) |
| GET | `/api/launcher/announcements` | launcher + `/api/launcher/announcements` route |
| GET | `/api/blog_posts` | blog (when available) |
| GET | `/api/service_status` | home status strip, status page |
| GET | `/api/jobs` | jobs page |
| POST | `/api/auth/login` | support sign-in |
| POST | `/api/tickets` | support tickets |
| POST | `/api/beta/verify` | beta auth |
| POST | `/api/beta/download` | beta downloads |
| POST | `/api/orders` | store checkout |

Client helpers live in `src/lib/api.ts`. Endpoints that return 404 show empty UI until the proxy adds them.

## Structure

```text
src/
  lib/api.ts         API client → comet-db-proxy
  pages/             Astro routes
  react/pages/       React page components
  components/site/   UI
server/              optional local MySQL Express API
worker.js            Cloudflare Worker — proxies /api/*, serves dist/
```

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Astro dev server |
| `npm run build` | Static build → `dist/` |
| `npm run deploy` | Build + Cloudflare Worker deploy |
