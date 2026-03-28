# Apps by Givdul

Static Astro site for a multi-app macOS catalog. The root acts as the app index, with per-app landing, support, and privacy pages under each slug.

## Environment

Set these before production deployment:

- `PUBLIC_SITE_ORIGIN`: final public origin, for example `https://apps.givdul.com`
- `PUBLIC_ZONES_APP_STORE_URL`: final App Store listing URL for Zones
- `PUBLIC_PORTAL_APP_STORE_URL`: optional App Store listing URL for Portal when it exists

Legacy compatibility:

- `PUBLIC_APP_STORE_URL` is still accepted as a fallback for Zones so older deployment configs do not break immediately.

If an app-specific App Store URL is omitted, its page falls back to support/privacy links instead of rendering a dead App Store destination.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
