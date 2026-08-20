#!/usr/bin/env bash
# Installs the dsh-web-search-bing plugin into the DSH web profile.
# Usage: ./install.sh [profile]   (default profile: web)
set -euo pipefail

PROFILE="${1:-web}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DST_DIR="$HOME/.dsh/profiles/node_modules/dsh-web-search-bing"
PATCH_FILE="$HOME/.dsh/profiles/$PROFILE/cordis.patch.yml"

if [ ! -f "$SRC/lib/index.js" ]; then
  echo "Plugin source not found at $SRC" >&2
  exit 1
fi

# 1. copy the package into the profile module fallback
rm -rf "$DST_DIR"
mkdir -p "$DST_DIR/lib"
cp "$SRC/package.json" "$DST_DIR/package.json"
cp "$SRC/lib/index.js" "$DST_DIR/lib/index.js"
echo "Installed plugin => $DST_DIR"

# 2. register the provider row in the profile patch layer (idempotent)
#    (does NOT change the web_search primary; switch it separately if wanted)
REG_BLOCK='# dsh-web-search-bing: bing-cn / bing-intl search providers for ctx.web.
- insert:
    - id: web-search-bing
      name: '"'"'dsh-web-search-bing'"'"''

mkdir -p "$HOME/.dsh/profiles/$PROFILE"
touch "$PATCH_FILE"
if grep -q "web-search-bing" "$PATCH_FILE"; then
  echo "Plugin already registered in $PATCH_FILE"
else
  printf '%s\n\n' "$REG_BLOCK" >> "$PATCH_FILE"
  echo "Registered plugin in $PATCH_FILE"
fi

echo "Done. Restart the DSH web app; bing-cn / bing-intl are then available as search providers."
echo "To make one the web_search primary, set the web row's searchProvider to bing-cn or bing-intl."
