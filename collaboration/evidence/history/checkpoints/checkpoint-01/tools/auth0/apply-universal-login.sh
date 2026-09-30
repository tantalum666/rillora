#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AUTH0_SOURCE_DIR="$PROJECT_ROOT/infra/auth0/universal-login"
TENANT="${RILLORA_AUTH0_TENANT:-rillora-dev.eu.auth0.com}"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
EVIDENCE_DIR="${1:-$PROJECT_ROOT/output/qa/rillora-auth0-universal-login-$RUN_ID}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_command auth0
require_command jq
require_command rg
require_command shasum

if ! jq empty "$AUTH0_SOURCE_DIR/theme.json"; then
  echo "Invalid desired theme JSON." >&2
  exit 1
fi

if ! rg -q 'auth0:head' "$AUTH0_SOURCE_DIR/page-template.liquid" \
  || ! rg -q 'auth0:widget' "$AUTH0_SOURCE_DIR/page-template.liquid"; then
  echo "Page template is missing a required Auth0 tag." >&2
  exit 1
fi

mkdir -p "$EVIDENCE_DIR"

echo "Reading current Auth0 Universal Login configuration from $TENANT..."
if auth0 api get "branding/themes/default" \
  --tenant "$TENANT" \
  --no-input \
  --no-color \
  > "$EVIDENCE_DIR/theme-before.json" \
  2> "$EVIDENCE_DIR/theme-before-error.txt"; then
  HAD_THEME=true
else
  HAD_THEME=false
  jq -n \
    --arg status "absent" \
    --arg reason "$(tr '\n' ' ' < "$EVIDENCE_DIR/theme-before-error.txt")" \
    '{status: $status, reason: $reason}' \
    > "$EVIDENCE_DIR/theme-before.json"
fi

auth0 universal-login show \
  --tenant "$TENANT" \
  --json \
  --no-input \
  --no-color > "$EVIDENCE_DIR/branding-before.json"

if auth0 api get "branding/templates/universal-login" \
  --tenant "$TENANT" \
  --no-input \
  --no-color \
  > "$EVIDENCE_DIR/page-template-before.json" \
  2> "$EVIDENCE_DIR/page-template-before-error.txt"; then
  :
else
  jq -n \
    --arg status "absent-or-unreadable" \
    --arg reason "$(tr '\n' ' ' < "$EVIDENCE_DIR/page-template-before-error.txt")" \
    '{status: $status, reason: $reason}' \
    > "$EVIDENCE_DIR/page-template-before.json"
fi

if [[ "$HAD_THEME" == true ]]; then
  THEME_ID="$(jq -r '.themeId // empty' "$EVIDENCE_DIR/theme-before.json")"
  if [[ ! "$THEME_ID" =~ ^[A-Za-z0-9]{32}$ ]]; then
    echo "The current default theme did not return a valid themeId; no remote write was attempted." >&2
    exit 1
  fi

  echo "Updating the existing default theme with the versioned Rillora theme..."
  jq -s '.[0] * .[1] | del(.themeId)' \
    "$EVIDENCE_DIR/theme-before.json" \
    "$AUTH0_SOURCE_DIR/theme.json" \
    | auth0 api patch "branding/themes/$THEME_ID" \
        --tenant "$TENANT" \
        --no-input \
        --no-color > "$EVIDENCE_DIR/theme-apply-response.json"
else
  echo "No default theme exists; creating the first versioned Rillora theme..."
  auth0 api post "branding/themes" \
    --tenant "$TENANT" \
    --no-input \
    --no-color \
    < "$AUTH0_SOURCE_DIR/theme.json" \
    > "$EVIDENCE_DIR/theme-apply-response.json"
  THEME_ID="$(jq -r '.themeId // empty' "$EVIDENCE_DIR/theme-apply-response.json")"
  if [[ ! "$THEME_ID" =~ ^[A-Za-z0-9]{32}$ ]]; then
    echo "Auth0 did not return a valid themeId after creating the first theme." >&2
    exit 1
  fi
fi

echo "Applying the versioned Rillora page template..."
auth0 universal-login templates update \
  --tenant "$TENANT" \
  --no-input \
  --no-color \
  --force < "$AUTH0_SOURCE_DIR/page-template.liquid" \
  > "$EVIDENCE_DIR/page-template-apply.txt"

echo "Reading the applied configuration back..."
auth0 api get "branding/themes/default" \
  --tenant "$TENANT" \
  --no-input \
  --no-color > "$EVIDENCE_DIR/theme-after.json"
auth0 api get "branding/templates/universal-login" \
  --tenant "$TENANT" \
  --no-input \
  --no-color > "$EVIDENCE_DIR/page-template-after.json"

jq -n \
  --arg tenant "$TENANT" \
  --arg runId "$RUN_ID" \
  --arg themeId "$THEME_ID" \
  --arg desiredThemeSha256 "$(shasum -a 256 "$AUTH0_SOURCE_DIR/theme.json" | awk '{print $1}')" \
  --arg desiredTemplateSha256 "$(shasum -a 256 "$AUTH0_SOURCE_DIR/page-template.liquid" | awk '{print $1}')" \
  '{
    tenant: $tenant,
    runId: $runId,
    themeId: $themeId,
    desiredThemeSha256: $desiredThemeSha256,
    desiredTemplateSha256: $desiredTemplateSha256,
    evidenceBoundary: "Development-tenant configuration readback only; live prompt and callback checks are separate."
  }' > "$EVIDENCE_DIR/manifest.json"

echo "Auth0 accepted the theme and page template. Readback: $EVIDENCE_DIR"
