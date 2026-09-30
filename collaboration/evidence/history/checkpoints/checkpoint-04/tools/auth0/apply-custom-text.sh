#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEXT_DIR="$PROJECT_ROOT/infra/auth0/universal-login/custom-text"
TENANT="${RILLORA_AUTH0_TENANT:-rillora-dev.eu.auth0.com}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
EVIDENCE_DIR="${1:-$PROJECT_ROOT/output/qa/rillora-auth0-custom-text-$RUN_ID}"

for command in auth0 jq shasum; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command not found: $command" >&2
    exit 1
  fi
done

mkdir -p "$EVIDENCE_DIR/before" "$EVIDENCE_DIR/after" "$EVIDENCE_DIR/responses"

for source in "$TEXT_DIR"/*.en.json; do
  jq empty "$source"
  filename="$(basename "$source")"
  prompt="${filename%.en.json}"

  if auth0 api get "prompts/$prompt/custom-text/en" \
    --tenant "$TENANT" \
    --no-input \
    --no-color \
    > "$EVIDENCE_DIR/before/$filename" \
    2> "$EVIDENCE_DIR/before/$filename.error.txt"; then
    :
  else
    echo "Unable to read current custom text for $prompt; no text writes were attempted." >&2
    exit 1
  fi
done

for source in "$TEXT_DIR"/*.en.json; do
  filename="$(basename "$source")"
  prompt="${filename%.en.json}"

  auth0 api put "prompts/$prompt/custom-text/en" \
    --tenant "$TENANT" \
    --no-input \
    --no-color \
    < "$source" \
    > "$EVIDENCE_DIR/responses/$filename"

  auth0 api get "prompts/$prompt/custom-text/en" \
    --tenant "$TENANT" \
    --no-input \
    --no-color \
    > "$EVIDENCE_DIR/after/$filename"

  if ! jq -e --slurpfile expected "$source" '. == $expected[0]' \
    "$EVIDENCE_DIR/after/$filename" >/dev/null; then
    echo "Readback mismatch for $prompt." >&2
    exit 1
  fi
done

jq -n \
  --arg tenant "$TENANT" \
  --arg runId "$RUN_ID" \
  --arg sourceDigest "$(find "$TEXT_DIR" -name '*.en.json' -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256 | awk '{print $1}')" \
  '{
    tenant: $tenant,
    runId: $runId,
    language: "en",
    sourceDigest: $sourceDigest,
    evidenceBoundary: "Development-tenant custom-text readback only; live screen and localization checks are separate."
  }' > "$EVIDENCE_DIR/manifest.json"

echo "Auth0 accepted the scoped English prompt text. Readback: $EVIDENCE_DIR"
