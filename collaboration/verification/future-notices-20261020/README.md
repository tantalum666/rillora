# Future recipient notices — local acceptance

Date: 2026-10-20 (Asia/Shanghai)
Branch: codex/future-recipient-notices-20261020
Status: local implementation and acceptance complete; Git/CI receipt is recorded separately when observed.

[Product contract](../../../docs/future-recipient-notices-20261020.md). Owner requested the independent notice slice for the next version, without changing the current review. [Reading continuation](reading.json) retains the project's completed full-read chain.

## Verified boundaries

Dedicated metadata-only notice relationship; no Matter grants, titles, counts, keys or release conditions. Anonymous preview hides identity. Matching verified email and current account are required for explicit acknowledgement. New acknowledgement never alters current sharing/exports/AI authority; existing explicit living shares remain independent. Sender revoke, recipient decline/leave, expiry/rotation, contact archival and restore invalidation are covered. All fixtures are synthetic, loopback-only; provider sign-in and real delivery are not claimed.

## Results

- API typecheck and complete65files /589tests passed before the last journal assertion was added;10new integration tests use actual migrations, HTTP routes and PostgreSQL RLS ([full result](api-full.log.txt), [final focused result](api-final.log.txt)).
- Web202Node tests passed;8focused contract/routing checks passed after the final routing assertions. Full browser regression74passed, including8new future-notice flows, English desktop and Chinese mobile ([browser summary](browser-result-summary.json), [contract result](web-contract-final.log.txt)).
- Native55targeted unit tests passed, including7new tests plus API/client/sharing regression ([result](native-unit-result.json)). Existing API fixtures require English; a prior run inherited Chinese and failed4English-only fixture expectations. Explicit en/US passed without weakening runtime validation. New feature itself passed in both languages.
- Native2UItests exercise actual compiled app against a separate disposable PostgreSQL/API fixture: create/revoke, exact recipient acknowledgement, zero current sharing grants, receive/leave, English and Chinese ([result](native-ui-result.json)). Physical-device tests were not repeated.
- Native source/localization11passed; infrastructure68passed and recovery broker6passed. See adjacent logs.
- Source scan32previously reviewed nonsecrets,0unreviewed. Four unchanged public Auth0 client-ID spans moved line positions when XcodeGen added sources; [exact relocation](scan-line-changes.json), [source scan](source-scan-final.json). No scanner suppression or new credential value. The final added journal check proves that enforced publication carries only revocation facts and fails closed when the synthetic publisher is unavailable. Protected-base PR authority remains unchanged; a later merge must independently satisfy its normal source guard.

## Issues resolved during acceptance

The first browser build found a JSX closing tag; first browser harness used an encoded filesystem path; first owner test matched two status nodes. All were corrected and the complete browser suite passed. Native fixture links initially used loopback while the native validator correctly requires trusted HTTPS; the fixture now uses the existing public link origin while API traffic remains local. The native section's accessibility identifier propagated over the leave button; its container identifier was removed and stable inbox state moved to the parent screen. The final native UI run passed both full flows. An unsigned standalone simulator launch could not use Keychain; UI fixtures use the existing volatile synthetic-session path, without changing production key storage.

## Images and isolation

The tenPNGfiles in[images](images/)show synthetic Web/native sender, recipient and native inbox screens. The names and email masks are fixture data; links/QRs were never sent to anyone. [Release isolation](release-isolation.json) records default-off flags, unchanged existing plist semantics and no current review/production actions.

Current real data, pricing, charging switches and FanPass remain outside this change. This is not death verification, automatic post-death delivery, HealthKit approval, zero-knowledge encryption or proof a real recipient received a message. Next-version rollout order is documented in the product contract. Raw compiled caches/result bundles stay in the ignored local QA directory; source, reproducible tests, summaries and selected screenshots are versioned.
