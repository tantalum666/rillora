#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.local-secrets/legal/release.env"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Missing local legal release configuration. Run tools/legal/configure-release.sh first." >&2
  exit 1
fi

config_mode="$(stat -f '%Lp' "$CONFIG_FILE")"
if [[ "$config_mode" != "600" ]]; then
  echo "Local legal release configuration must have mode 600." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$CONFIG_FILE"
set +a

cd "$PROJECT_ROOT/apps/web"
npm run build:legal
