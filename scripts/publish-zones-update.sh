#!/usr/bin/env bash
# Adds a Zones GitHub release to the Sparkle feed served from public/zones/.
# Run on the release Mac: generate_appcast signs with the EdDSA key in the login keychain.
#
# Usage: scripts/publish-zones-update.sh <release-tag>   (for example v1.0-1)
# Requires: gh with access to Givdul/zones, jq, xmllint, and the Sparkle tools.
# SPARKLE_BIN defaults to the newest Sparkle package checkout in Xcode DerivedData.
set -euo pipefail

tag="${1:?Usage: scripts/publish-zones-update.sh <release-tag>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
feed_base="https://apps.givdul.com/zones"
updates_dir="$root/public/zones/updates"
appcast="$root/public/zones/appcast.xml"

if [[ -z "${SPARKLE_BIN:-}" ]]; then
  SPARKLE_BIN="$(ls -dt "$HOME"/Library/Developer/Xcode/DerivedData/fancy-*/SourcePackages/artifacts/sparkle/Sparkle/bin 2>/dev/null | head -1 || true)"
fi
[[ -x "${SPARKLE_BIN:-}/generate_appcast" ]] || {
  echo "Sparkle tools not found. Build Zones in Xcode once, or set SPARKLE_BIN." >&2
  exit 1
}

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

gh release download "$tag" --repo Givdul/zones --pattern '*.zip' --pattern release-manifest.json --dir "$work"

archive="$(jq -r .artifact "$work/release-manifest.json")"
expected_sha="$(jq -r .sha256 "$work/release-manifest.json")"
actual_sha="$(shasum -a 256 "$work/$archive" | awk '{ print $1 }')"
[[ "$actual_sha" == "$expected_sha" ]] || {
  echo "$archive SHA-256 is $actual_sha, but release-manifest.json says $expected_sha." >&2
  exit 1
}

release_notes="$updates_dir/${archive%.zip}.html"
[[ -f "$release_notes" ]] || {
  echo "Write release notes at ${release_notes#"$root"/} (a full HTML document), then rerun." >&2
  exit 1
}

# Published archive URLs are immutable: never replace a file that installed copies may fetch.
destination="$updates_dir/$archive"
if [[ -e "$destination" ]]; then
  cmp -s "$work/$archive" "$destination" || {
    echo "$destination already exists with different contents. Publish a new build number instead." >&2
    exit 1
  }
else
  cp "$work/$archive" "$destination"
fi

# --maximum-versions 0 keeps every published item and archive in place instead of moving them to old_updates/.
"$SPARKLE_BIN/generate_appcast" \
  --download-url-prefix "$feed_base/updates/" \
  --release-notes-url-prefix "$feed_base/updates/" \
  --link "$feed_base/" \
  --maximum-versions 0 \
  --maximum-deltas 0 \
  -o "$appcast" \
  "$updates_dir"

signature="$(xmllint --xpath "string(//item/enclosure[@url='$feed_base/updates/$archive']/@*[local-name()='edSignature'])" "$appcast")"
[[ -n "$signature" ]] || {
  echo "The appcast has no signed enclosure for $archive." >&2
  exit 1
}
"$SPARKLE_BIN/sign_update" --verify "$destination" "$signature"

echo "Added $archive ($actual_sha) to ${appcast#"$root"/}."
echo "Commit public/zones/ and merge to main. Vercel publishes the archive and feed in the same deployment."
