# Apps by Givdul

Static Astro site for a multi-app macOS catalog. The root acts as the app index, with per-app landing, support, and privacy pages under each slug.

## Environment

Set these before production deployment:

- `PUBLIC_SITE_ORIGIN`: final public origin, for example `https://apps.givdul.com`
- `PUBLIC_ZONES_DOWNLOAD_URL`: direct download URL for Zones
- `PUBLIC_PORTAL_DOWNLOAD_URL`: legacy Frame direct-download variable; retained for configuration compatibility and does not publish Frame
- `PUBLIC_PORTAL_APP_STORE_URL`: legacy Frame App Store variable; retained for configuration compatibility and does not publish Frame
- `PUBLIC_POLAR_PORTAL_LICENSE_CHECKOUT_URL`: legacy Frame checkout variable; retained for configuration compatibility while commerce details remain unpublished

If a published app-specific download or checkout URL is omitted, its page falls back to support/privacy links or disabled purchase buttons instead of rendering a dead destination. Frame remains unpublished until its release and commerce details are confirmed.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
