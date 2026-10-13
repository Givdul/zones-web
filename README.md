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

## Zones updates

Zones checks `https://apps.givdul.com/zones/appcast.xml` with Sparkle. The feed and every update archive are static files under `public/zones/`, so one Vercel deployment publishes them together. First installs still go through the Polar checkout.

- `public/zones/appcast.xml`: the signed Sparkle feed.
- `public/zones/updates/Zones-<version>-<build>.zip`: the notarized archive from the Zones GitHub release. Archives are never replaced or deleted, so every published URL keeps working.
- `public/zones/updates/Zones-<version>-<build>.html`: release notes for that build.

To publish a release after the Zones release workflow succeeds:

1. Write the release notes file for the new build.
2. On the release Mac, run `scripts/publish-zones-update.sh <release-tag>`, for example `v1.0-1`. It downloads the archive, checks its SHA-256 against `release-manifest.json`, signs the appcast entry with the Sparkle key in the login keychain, and verifies the signature.
3. Commit `public/zones/` and merge to `main`.
4. Confirm the appcast and archive URLs return 200 from a clean client.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
