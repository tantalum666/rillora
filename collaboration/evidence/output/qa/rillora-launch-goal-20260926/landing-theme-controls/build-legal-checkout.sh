#!/usr/bin/env bash
set -euo pipefail
legal_config='/Users/tantalum/Documents/电子遗嘱app/.local-secrets/legal/release.env'
[[ "$(stat -f '%Lp' "$legal_config")" == '600' ]]
set -a
source "$legal_config"
set +a
npm run build:legal
node --test tests/legal-sites-worker.test.mjs
