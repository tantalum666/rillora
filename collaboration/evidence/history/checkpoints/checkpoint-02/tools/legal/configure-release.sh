#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/.local-secrets/legal"
TARGET_FILE="$TARGET_DIR/release.env"

if [[ ! -r /dev/tty || ! -w /dev/tty ]]; then
  echo "A local interactive terminal is required." >&2
  exit 1
fi

umask 077
mkdir -p "$TARGET_DIR"
chmod 700 "$TARGET_DIR"

original_tty_state="$(stty -g </dev/tty)"
restore_tty() {
  stty "$original_tty_state" </dev/tty >/dev/null 2>&1 || true
}
trap restore_tty EXIT INT TERM

stty -echo </dev/tty
printf "Approved operator legal name (input hidden): " >/dev/tty
IFS= read -r operator_name </dev/tty
printf "\nApproved public legal service address (input hidden): " >/dev/tty
IFS= read -r service_address </dev/tty
printf "\n" >/dev/tty
restore_tty
trap - EXIT INT TERM

if [[ -z "$operator_name" || -z "$service_address" ]]; then
  echo "The operator name and public service address are required." >&2
  exit 1
fi
if [[ "$operator_name" == *"["* || "$operator_name" == *"]"* \
   || "$service_address" == *"["* || "$service_address" == *"]"* ]]; then
  echo "Placeholder brackets are not allowed." >&2
  exit 1
fi

temporary_file="$(mktemp "$TARGET_DIR/release.env.XXXXXX")"
cleanup_temporary() {
  [[ -f "$temporary_file" ]] && rm -f "$temporary_file"
}
trap cleanup_temporary EXIT INT TERM

{
  printf 'VITE_LEGAL_OPERATOR_NAME=%q\n' "$operator_name"
  printf 'VITE_LEGAL_OPERATOR_COUNTRY=%q\n' "Hong Kong"
  printf 'VITE_LEGAL_SERVICE_ADDRESS=%q\n' "$service_address"
  printf 'VITE_LEGAL_SUPPORT_EMAIL=%q\n' "support@rillora.xyz"
  printf 'VITE_LEGAL_PRIVACY_EMAIL=%q\n' "privacy@rillora.xyz"
  printf 'VITE_LEGAL_SECURITY_EMAIL=%q\n' "security@rillora.xyz"
} > "$temporary_file"

chmod 600 "$temporary_file"
mv -f "$temporary_file" "$TARGET_FILE"
chmod 600 "$TARGET_FILE"
trap - EXIT INT TERM

echo "Stored six release fields in the ignored local legal configuration. Values were not printed."
echo "Next: tools/legal/run-release-build.sh"
