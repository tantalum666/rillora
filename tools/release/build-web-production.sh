#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.local-secrets/legal/release.env"
if [[ ! -f "$CONFIG_FILE" || "$(stat -f '%Lp' "$CONFIG_FILE")" != "600" ]]; then
  echo "Existing protected legal publication configuration is required." >&2
  exit 1
fi
set -a
source "$CONFIG_FILE"
set +a
export RILLORA_CLOSED_CLIENT_CANDIDATE=1
BUILD_TARGET="build:production-closed"
case "${1:-}" in
  "") ;;
  --review) BUILD_TARGET="build:production-review" ;;
  *) echo "Usage: build-web-production.sh [--review]" >&2; exit 1 ;;
esac
if [[ $# -gt 1 ]]; then
  echo "Usage: build-web-production.sh [--review]" >&2
  exit 1
fi
cd "$PROJECT_ROOT/apps/web"
npm run "$BUILD_TARGET"
