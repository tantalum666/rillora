# HISTORICAL - Rillora handoff before production commerce

Status: HISTORICAL; superseded by the current handoff
Last updated: 2026-09-25 (Asia/Hong_Kong)

## Current Owner task

Owner explicitly asks to start the remaining release engineering. Continue the
existing workflow; preserve current UI/brand, Free+88.80annual, test accounts/data,
FanPass, the independent production data/recovery floor and Owner-deferred
business/registration/physical-device work. Keep customer activation closed.
[Client contract](production-clients-20260925.md).

## Completed checkpoint

- app.rillora.xyz has an independent private-S3/CloudFront delivery stack with
  issued non-exportable certificate and guarded DNS. Exact HTML, HTTPS, pages,
  actual product assets, same-origin ready response and closed private routes pass.
  API caching is disabled/no-store and errors have zero cache TTL. Existing API,
  database and Auth0 bindings were not redeployed.
- iOS Release compiles the five exact production connection values, rejects
  staging/unsafe settings and ignores runtime endpoint overrides. Customer access
  remainsNO. Session and deletion-proof keychain namespaces separate production
  from the preserved staging service. Four targeted tests and actual Release
  Simulator public-home/closed-account behavior pass; Debug was restored afterward.
- Desktop/390px Chrome interaction and image rendering pass with no app console
  errors; only existing MetaMask warnings. Public exploration and return state
  remain. Account closure is stated without treating it as a network failure.
-14public monitor targets now execute successfully in the cloud; actual config
  matches source. Prior delivered-alarm/silence proof retains its date.
-39infra,84Web,21release guards,7monitor and4native tests pass; three Web builds
  and Simulator Release compile pass. Source scan has23reviewed public/fixture
  matches and0unknown at its latest checkpoint. Git/CI closeout is in progress.

## Evidence and pending items

[Current QA](../output/qa/rillora-production-clients-20260925/work-state.json).
This is a closed client delivery checkpoint, not a signed App Store archive,
customer login, real purchase or public release.

Owner renewed AWS; official same-device callback succeeded in the CLI despite
Chrome's localhost blocked page. Fresh account, stack and SES reads passed.
Latest SES remains productionAccessEnabledfalse/DENIED. The approved support
reply was already submitted; do not repeat its authorization or transmission.
Auth0 remainsFree, new client connections off and old test identities preserved.

Production Stripe/Apple implementation, controlled identity cutover/mail acceptance,
final security/retention and submission remain. Stripe CLI was updated to1.52.0;
its existing unrelated/FanPass profile was not reauthenticated. CLI docs returned401
and MCP transport failed; the bundled official references were read instead.
No payment code, live key, provider price or charge changed in this checkpoint.

The initial WWW-JPG diagnosis was corrected: that JPG exists only in the full
product artifact, so its absent WWW URL does not prove a broken public image.
Both image allowlists/build checks were hardened; actual product JPG returns200.

## Single next step

Save this verified engineering checkpoint and check its CI, then implement the
production commerce path behind the existing closed sales/market gates. Retain
test-only behavior and versioned receipts. Resolve SES/identity and platform
acceptance separately; do not clear accounts or open customers prematurely.

[Previous handoff - HISTORICAL](handoff-history-20260925-before-clients.md).
