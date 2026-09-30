#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_ROOT="$PROJECT_ROOT/apps/web"
DIST_ROOT="$WEB_ROOT/dist"
ARCHIVE_PATH="${1:-}"

if [[ -z "$ARCHIVE_PATH" || "$ARCHIVE_PATH" != /* ]]; then
  echo "Usage: tools/legal/package-legal-sites.sh /absolute/path/to/archive.tar.gz" >&2
  exit 1
fi

for required in \
  "$DIST_ROOT/server/index.js" \
  "$DIST_ROOT/.openai/hosting.json"; do
  if [[ ! -f "$required" ]]; then
    echo "Missing legal Sites artifact input: ${required#"$PROJECT_ROOT/"}" >&2
    exit 1
  fi
done

if ! find "$DIST_ROOT/client/assets" -type f -print -quit | grep -q .; then
  echo "Legal Sites artifact has no static assets." >&2
  exit 1
fi

if ! cmp -s "$WEB_ROOT/.openai/hosting.json" "$DIST_ROOT/.openai/hosting.json"; then
  echo "Source and built Sites hosting manifests do not match." >&2
  exit 1
fi

if find "$DIST_ROOT" -type l -print -quit | grep -q .; then
  echo "Legal Sites artifact must not contain symbolic links." >&2
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")"
tar -czf "$ARCHIVE_PATH" -C "$WEB_ROOT" dist
chmod 600 "$ARCHIVE_PATH"

archive_listing="$(tar -tzf "$ARCHIVE_PATH")"
for required_entry in \
  "dist/server/index.js" \
  "dist/.openai/hosting.json"; do
  if ! grep -Fxq "$required_entry" <<<"$archive_listing"; then
    echo "Legal Sites archive is missing $required_entry." >&2
    exit 1
  fi
done

echo "$ARCHIVE_PATH"
