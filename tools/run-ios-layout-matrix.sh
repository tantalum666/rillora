#!/bin/zsh

set -euo pipefail

matrix_repo_root="${0:A:h:h}"
matrix_ios_root="$matrix_repo_root/apps/ios"
matrix_output_root="$matrix_repo_root/output/qa/ios-layout-matrix-$(date +%Y%m%d-%H%M%S)"
matrix_derived_data="$matrix_output_root/DerivedData"
matrix_runtime="${RILLORA_IOS_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-26-5}"
matrix_api_port="${RILLORA_MATRIX_API_PORT:-4181}"
matrix_api_url="http://127.0.0.1:$matrix_api_port/v1"
matrix_planner_id="11111111-1111-4111-8111-111111111111"
matrix_api_pid=""
matrix_failures=0
matrix_summary="$matrix_output_root/matrix-summary.tsv"

mkdir -p "$matrix_output_root"
print -r -- $'slice\tdevice\tcontent_size\tresult' > "$matrix_summary"

cleanup_matrix() {
  for device_name in Rillora-Matrix-SE-3 Rillora-Matrix-13-mini Rillora-Matrix-13 Rillora-Matrix-17-Pro Rillora-Matrix-17-Pro-Max; do
    if xcrun simctl list devices | rg -q "${device_name} .*\\(Booted\\)"; then
      xcrun simctl ui "$device_name" content_size large >/dev/null 2>&1 || true
    fi
    xcrun simctl shutdown "$device_name" >/dev/null 2>&1 || true
  done
  if [[ -n "$matrix_api_pid" ]]; then
    kill "$matrix_api_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup_matrix EXIT INT TERM

if ! curl -fsS "http://127.0.0.1:$matrix_api_port/health/ready" >/dev/null 2>&1; then
  (
    cd "$matrix_repo_root/apps/api"
    PORT="$matrix_api_port" \
      DATABASE_URL="postgresql:///continuity_dev" \
      ALLOW_DEV_AUTH=true \
      CORS_ORIGINS="http://127.0.0.1:4175" \
      npm run dev >"$matrix_output_root/api.log" 2>&1
  ) &
  matrix_api_pid=$!
  for _ in {1..40}; do
    if curl -fsS "http://127.0.0.1:$matrix_api_port/health/ready" >/dev/null 2>&1; then
      break
    fi
    sleep 0.25
  done
fi

curl -fsS "http://127.0.0.1:$matrix_api_port/health/ready" >/dev/null

warm_matrix_api() {
  local attempt
  for attempt in 1 2 3; do
    if curl -fsS \
      -H "x-dev-planner-id: $matrix_planner_id" \
      "$matrix_api_url/session" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

ensure_matrix_device() {
  local device_name="$1"
  local device_type="$2"
  local device_id
  device_id="$(xcrun simctl list devices available | sed -n "s/^[[:space:]]*$device_name (\([0-9A-F-]*\)).*/\1/p" | head -n 1)"
  if [[ -z "$device_id" ]]; then
    device_id="$(xcrun simctl create "$device_name" "$device_type" "$matrix_runtime")"
  fi
  print -r -- "$device_id"
}

typeset -A matrix_devices
matrix_devices[se]="$(ensure_matrix_device Rillora-Matrix-SE-3 com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation)"
matrix_devices[mini]="$(ensure_matrix_device Rillora-Matrix-13-mini com.apple.CoreSimulator.SimDeviceType.iPhone-13-mini)"
matrix_devices[standard]="$(ensure_matrix_device Rillora-Matrix-13 com.apple.CoreSimulator.SimDeviceType.iPhone-13)"
matrix_devices[pro]="$(ensure_matrix_device Rillora-Matrix-17-Pro com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro)"
matrix_devices[max]="$(ensure_matrix_device Rillora-Matrix-17-Pro-Max com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max)"

cd "$matrix_ios_root"
xcodegen generate --spec project.yml >/dev/null

first_device="${matrix_devices[se]}"
xcrun simctl boot "$first_device" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$first_device" -b

print -r -- "Building reusable layout-matrix test products…"
if ! xcodebuild \
  -project Rillora.xcodeproj \
  -scheme RilloraLayoutMatrix \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$first_device" \
  -derivedDataPath "$matrix_derived_data" \
  -parallel-testing-enabled NO \
  RILLORA_API_BASE_URL="$matrix_api_url" \
  RILLORA_DEV_PLANNER_ID="$matrix_planner_id" \
  build-for-testing >"$matrix_output_root/build-for-testing.log" 2>&1; then
  tail -n 80 "$matrix_output_root/build-for-testing.log"
  exit 1
fi

run_matrix_slice() {
  local device_key="$1"
  local content_size="$2"
  local slice_name="$3"
  shift 3
  local device_id="${matrix_devices[$device_key]}"
  local result_path="$matrix_output_root/$slice_name.xcresult"

  xcrun simctl boot "$device_id" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "$device_id" -b
  xcrun simctl ui "$device_id" content_size "$content_size"
  warm_matrix_api

  local only_testing_args=()
  for test_name in "$@"; do
    only_testing_args+=("-only-testing:RilloraLayoutMatrixTests/RilloraLayoutMatrixTests/$test_name")
  done

  print -r -- "Running $slice_name…"
  if xcodebuild \
    -project Rillora.xcodeproj \
    -scheme RilloraLayoutMatrix \
    -configuration Debug \
    -destination "platform=iOS Simulator,id=$device_id" \
    -derivedDataPath "$matrix_derived_data" \
    -parallel-testing-enabled NO \
    -resultBundlePath "$result_path" \
    RILLORA_API_BASE_URL="$matrix_api_url" \
    RILLORA_DEV_PLANNER_ID="$matrix_planner_id" \
    "${only_testing_args[@]}" \
    test-without-building >"$matrix_output_root/$slice_name.log" 2>&1; then
    printf '%s\t%s\t%s\tPASS\n' "$slice_name" "$device_key" "$content_size" >> "$matrix_summary"
  else
    printf '%s\t%s\t%s\tFAIL\n' "$slice_name" "$device_key" "$content_size" >> "$matrix_summary"
    matrix_failures=$((matrix_failures + 1))
    tail -n 30 "$matrix_output_root/$slice_name.log"
  fi
}

root_tests=(
  testRootDestinationsPortrait
  testOrientationChangeKeepsRootsReachable
  testSignedOutExperienceUsesHostedAuthentication
  testPrivateIntentsOpenHostedAuthenticationAndCancelBackToSource
  testSignedOutCommercialDetailsStayDeferred
)

for device_key in se mini standard pro max; do
  run_matrix_slice "$device_key" large "$device_key-large-roots" "${root_tests[@]}"
  xcrun simctl shutdown "${matrix_devices[$device_key]}" >/dev/null 2>&1 || true
done

content_sizes=(
  extra-small small medium large extra-large extra-extra-large extra-extra-extra-large
  accessibility-medium accessibility-large accessibility-extra-large
  accessibility-extra-extra-large accessibility-extra-extra-extra-large
)

for content_size in "${content_sizes[@]}"; do
  run_matrix_slice \
    se "$content_size" "se-$content_size-root" \
    testRootDestinationsPortrait \
    testSignedOutExperienceUsesHostedAuthentication \
    testPrivateIntentsOpenHostedAuthenticationAndCancelBackToSource \
    testSignedOutCommercialDetailsStayDeferred
done

run_matrix_slice se large se-large-surfaces testPrimaryEditorsAndPreparationRoutes
run_matrix_slice se accessibility-extra-extra-extra-large se-ax5-surfaces testPrimaryEditorsAndPreparationRoutes
run_matrix_slice se large se-large-visible-actions testVisibleActionsExposeLabelsAndMinimumTabTargets
xcrun simctl shutdown "${matrix_devices[se]}" >/dev/null 2>&1 || true

run_matrix_slice standard large standard-large-surfaces testPrimaryEditorsAndPreparationRoutes
xcrun simctl shutdown "${matrix_devices[standard]}" >/dev/null 2>&1 || true

run_matrix_slice pro accessibility-extra-extra-extra-large pro-ax5-roots "${root_tests[@]}"
xcrun simctl ui "${matrix_devices[pro]}" content_size large
xcrun simctl shutdown "${matrix_devices[pro]}" >/dev/null 2>&1 || true

run_matrix_slice max large max-large-surfaces testPrimaryEditorsAndPreparationRoutes

if (( matrix_failures > 0 )); then
  print -r -- "Matrix completed with $matrix_failures failing slice(s): $matrix_output_root"
  exit 1
fi

print -r -- "Matrix complete: $matrix_output_root"
