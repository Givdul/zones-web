# Bounty Objective: zones: add a thank-you page that serves the download after Polar checkout
Target: Givdul/zones-web Issue #12
URL: https://github.com/Givdul/zones-web/issues/12

## Issue Description
## Problem

Both Polar checkout links were created with `success_url = https://apps.givdul.com/zones?checkout_id={CHECKOUT_ID}` (`scripts/setup-polar-zones.mjs:214-223`, and `scripts/release/polar-license-product.mjs:75` in Givdul/zones). After the free download checkout, Polar sends the visitor back to the landing page, and nothing on the site reads `checkout_id`. The visitor lands on the same page they started from with no download and no key. The file only reaches them through the confirmation email or the customer portal.

No success or thank-you page exists; the site is static Astro with no adapter.

## What Polar offers

- Without a `success_url`, Polar keeps the customer on its hosted confirmation page, which shows a direct download button for the File Downloads benefit.
- With a custom success URL, the hosted checkout appends `customer_session_token=polar_cst_...` when the confirm step created a session. This is in Polar's source, not the docs, and is skipped when the email already belongs to an existing customer (to prevent account takeover). Returning downloaders arrive without a token.
- With that token the browser can call `GET https://api.polar.sh/v1/customer-portal/downloadables/?benefit_id=...` and get `file.download.url`. No secret is needed. The same portal API exposes `/v1/customer-portal/license-keys/` for buyers.

## Options

| Option | Clicks after checkout | Download stats | Effort |
|---|---|---|---|
| (a) Unset `success_url`, use Polar's confirmation page | 1 | kept | dashboard toggle |
| (b) Own thank-you page using `customer_session_token` | 0-1 | kept | small client JS plus fallback |
| (c) Thank-you page linking the GitHub Release zip | 0-1 | lost | trivial |
| (d) Embedded checkout on the site | 1-2 | kept | embed script, host allowlist |

## Recommendation: (b) with (a) as the fallback

1. Add `src/pages/zones/thanks.astro` (static). On load, read `customer_session_token` from the query string. If present, call the downloadables endpoint with `Authorization: Bearer <token>` and `benefit_id = PUBLIC_POLAR_ZONES_DOWNLOAD_BENEFIT_ID`, render a "Download Zones-x.y.zip" button with `href=file.download.url` and the `download` attribute, optionally auto-click it, and strip the token with `history.replaceState`.
2. For license purchases, also call `/v1/customer-portal/license-keys/` and show the key with "Open Zones → Settings → General → License → paste → Activate".
3. If no token or the call fails, show "Check your email for the confirmation, or open your Polar portal" linking `https://polar.sh/hansen-software/portal`.
4. Env: `PUBLIC_POLAR_ZONES_DOWNLOAD_BENEFIT_ID` = `60294014-3e28-4230-a74c-f945940e59f4`.
5. Polar: change both checkout links' Success URL to `https://apps.givdul.com/zones/thanks?checkout_id={CHECKOUT_ID}` (dashboard, or update `setup-polar-zones.mjs:220` and the zones release script and re-run with `checkout_links:write`).

If that is too much for now, option (a) is one dashboard change and already gives a direct download button.

## Not verified
- Live free-checkout behavior was not exercised; the token append comes from Polar's source and could change.
- `file.download.url` TTL and CORS on the downloadables endpoint from apps.givdul.com (Polar's own portal calls it from the browser, so likely fine).

Sources: https://polar.sh/docs/features/checkout/links, https://polar.sh/docs/api-reference/checkout-links/create, https://polar.sh/docs/api-reference/customer-portal/downloadables/list, https://polar.sh/docs/features/customer-portal, https://polar.sh/docs/features/checkout/embed, https://github.com/polarsource/polar

Related: Givdul/zones#9, Givdul/zones#21.

🤖 Generated with [Claude Code](https://claude.com/claude-code)


## Instructions for Kuro (Autonomous Solver):
1. Use skills: `systematic-debugging` and `code-review-and-quality`.
2. Inspect the repository structure, locate relevant files, and understand the bug/feature.
3. Apply the minimal, robust fix or implementation.
4. Run any existing test suites or linters in the workspace.
5. Ensure the fix adheres to the project's existing code style.
6. When done, output a summary of files modified and verification results.
