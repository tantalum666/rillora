#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
repo_root="${script_dir:h:h}"
secret_root="$repo_root/.local-secrets/storekit"
private_key_path="$secret_root/iap-private-key.p8"
key_id_path="$secret_root/key-id"
issuer_id_path="$secret_root/issuer-id"

for required_path in "$private_key_path" "$key_id_path" "$issuer_id_path"; do
  if [[ ! -f "$required_path" ]]; then
    print -u2 "Missing required ignored StoreKit credential file."
    exit 1
  fi
  if [[ "$(stat -f '%Lp' "$required_path")" != "600" ]]; then
    print -u2 "StoreKit credential files must use mode 0600."
    exit 1
  fi
  if ! git -C "$repo_root" check-ignore -q "$required_path"; then
    print -u2 "StoreKit credential files must remain ignored by Git."
    exit 1
  fi
done

export NODE_ENV=development
export HOST=127.0.0.1
export PORT="${RILLORA_STOREKIT_LOCAL_PORT:-4182}"
export DATABASE_URL="${RILLORA_STOREKIT_DATABASE_URL:-postgresql:///continuity_dev}"
export DATABASE_SSL_MODE=disable
export CORS_ORIGINS="http://localhost:4173,http://localhost:4174"
export ALLOW_DEV_AUTH=true
export ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL=false
export ALLOW_STRIPE_TEST_INTEGRATION=false
export STRIPE_TEST_STAGING_MODE=false
export ALLOW_APPLE_SANDBOX_INTEGRATION=true
export APPLE_SANDBOX_STAGING_MODE=false
export APPLE_ROOT_CERTIFICATE_DIRECTORY="$repo_root/apps/api/certificates/apple"
export APPLE_IAP_KEY_ID="$(tr -d '\r\n' < "$key_id_path")"
export APPLE_IAP_ISSUER_ID="$(tr -d '\r\n' < "$issuer_id_path")"
export APPLE_IAP_PRIVATE_KEY="$(< "$private_key_path")"
export DATA_REGION=eu-central-1

cd "$repo_root/apps/api"
exec npm run dev
