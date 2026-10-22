# Apps by Givdul

Static Astro site for Givdul's macOS apps. `/` redirects to `/zones`, and each app has landing, support, and privacy pages under its slug.

## Environment

Set these before production deployment:

- `PUBLIC_SITE_ORIGIN`: final public origin, for example `https://apps.givdul.com`
- `PUBLIC_POLAR_ZONES_DOWNLOAD_CHECKOUT_URL`: checkout link for the free Polar `Zones` product, which starts the 7-day trial. `PUBLIC_ZONES_DOWNLOAD_URL` is read as a fallback; `scripts/setup-polar-zones.mjs` writes the same link to both. Only used once the license checkout below is set.
- `PUBLIC_POLAR_ZONES_LICENSE_CHECKOUT_URL`: Polar checkout link for the paid `Zones License` product ($9.99 one-time, product `60762fd4`). The link has not been created yet. While unset, the Buy button and every Zones download button stay disabled.
- `PUBLIC_POLAR_ZONES_DOWNLOAD_BENEFIT_ID`: Polar file-download benefit for `/zones/thanks`. Defaults to `60294014-3e28-4230-a74c-f945940e59f4`; the setup script also exports the configured benefit ID.
- `PUBLIC_POLAR_ZONES_LICENSE_BENEFIT_ID`: the Zones License benefit ID, required to show purchased keys on `/zones/thanks`. If omitted, buyers use their confirmation email or Polar portal instead. This is a public identifier, not an API secret.
- `PUBLIC_PORTAL_DOWNLOAD_URL`: legacy Frame direct-download variable; retained for configuration compatibility and does not publish Frame
- `PUBLIC_PORTAL_APP_STORE_URL`: legacy Frame App Store variable; retained for configuration compatibility and does not publish Frame
- `PUBLIC_POLAR_PORTAL_LICENSE_CHECKOUT_URL`: legacy Frame checkout variable; retained for configuration compatibility while commerce details remain unpublished

If a published app-specific download or checkout URL is omitted, its page falls back to support/privacy links or disabled purchase buttons instead of rendering a dead destination. Frame remains unpublished until its release and commerce details are confirmed.

## Checkout completion

Deploy `/zones/thanks` before changing Polar checkout links. Set the Success URL on both the free download and paid license links to `https://apps.givdul.com/zones/thanks?checkout_id={CHECKOUT_ID}` (use your `PUBLIC_SITE_ORIGIN` for other deployments).

`npm run polar:setup-zones` now creates or updates the free download link to this destination and verifies updates by reading the link back. Running it requires `POLAR_ACCESS_TOKEN` with `checkout_links:write` and the existing setup permissions. The paid link is maintained in the separate `Givdul/zones` repository (`scripts/release/polar-license-product.mjs`); update its success URL there too, or change the paid link in the Polar dashboard. This web repository cannot update that release script.

The static thank-you page uses only the customer session token supplied by Polar; it never uses a secret API token or treats `checkout_id` as authentication. It removes the session token from the URL and shows download links without automatically starting a download. Download and license retrieval are independent, so a failed license request does not hide a working download. Returning customers, expired sessions, pending benefits, and API failures use the always-visible email/portal fallback. With JavaScript disabled, the same fallback remains usable. To return to Polar's hosted confirmation/download screen instead, clear the checkout links' Success URL in Polar (do not rerun setup unless you want to restore the custom page).

Verify a new-customer free checkout and a paid checkout on the deployed origin, plus a returning-customer checkout with no session token. Live Polar CORS and benefit provisioning must be checked there; local regression tests mock the portal API and do not perform purchases.

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
- `node --test scripts/test-zones-thanks.mjs`
- `npm run preview`
