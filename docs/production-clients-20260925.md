# Closed production Web and iOS connections

Role: focused client-delivery and environment-isolation contract
Status: CLOSED CLIENT DELIVERY VERIFIED; CUSTOMER ACTIVATION STILL CLOSED
Last updated: 2026-10-08 (Asia/Hong_Kong)

Owner explicitly asks to start the remaining release engineering. Continue the
existing release workflow and reading baseline. Preserve the current UI/brand,
annual-only offer, test accounts/data, private data/recovery foundation and
FanPass. Public customer access remains closed until the separate release gates
are accepted.

## October8 current native delivery

Owner pauses incremental TestFlight distribution and chooses direct phone installation.
Current sourcec0cec8680/retained Release11was development-signed and installed wirelessly
over the same Rillora app; version1.0(11)and foreground launch are read back. No new
TestFlight upload/distribution or cloud deployment was performed today. Previous provider
checkpoints below retain their dates; physical UI/restore acceptance is separate.
[Current direct workflow](direct-device-iteration-20261008.md).

## October7 current client delivery

Production Web86/WWW31and Preview86files match the new deployed artifacts. Native1.0(9)
passed14artifact checks and uploaded; Apple login recovery is needed before processing/
distribution readback. Build8 remains the last verified draft/internal version.
[Current execution](dot-rollout-20261007.md).

## HISTORICAL — October3 reviewed clients

Restricted production Web and WWW are deployed, with86/30actual file hashes matched.
Native1.0(3) is signed, uploaded and processed with normal distribution eligibility;
Owner-confirmed encryption declaration is saved and Apple showsReady to Submit. No testers or AppReview
submission, actual purchase or public activation follows. [Execution](review-rollout-20261003.md).


## September30 client security and distribution preparation

Recent-auth handling preserves the current Web/native editor and original session;
users explicitly retry sensitive actions after verification. Release callback routing
now ignores unrelated/dormant-native-Google URLs, and the app's local preference API
reason is declared. Local UI cancellation and current native transport tests pass.

The final IPA has exact production connections,CustomerAccessNO,no debug entitlement
or StoreKit fixture. A new closed Web candidate is built and retained locally.
Neither is a usable uploaded TestFlight or a new Preview/WWW/legal deployment.
The backend is now restricted-review mode; actual provider/client acceptance remains
separate.[Current contract and package](release-engineering-20260930.md).


## Connection contract

config/production-connections.json contains only public connection identifiers:
app.rillora.xyz, same-origin API/session paths, the prepared production native/Web
Auth0 client IDs and audience, and the exact existing Frankfurt API origin.
CandidateGLOBAL_US keeps the existing build policy; it does not activate a market.
The September25checkpoint kept backend account routes disabled; the September30restricted review exception is described above.

iOS Release now compiles the five exact connection values and an explicit closed
account flag. Release ignores environment overrides and validates the reviewed
origin/client/audience/session endpoint before constructing live dependencies.
Native-only provider flags stay off; hosted authentication is still the selected
route when later enabled. Native production sessions and deletion receipts have
origin-specific keychain services. The exact old staging origin keeps its existing
service without copying credentials into production.

The production Web build is separate from internal and public-information builds.
It requires the existing protected legal publication configuration. Its manifest
binds every asset digest and the public connection contract. CI fixtures are
explicitly not publication candidates. The closed client still renders existing
public exploration/guides; its account page states that accounts are not open
instead of describing planned closure as a connectivity fault. Server closure is
independent of this client flag.

## Independent delivery resources

The opt-in productionWebOnly stack creates only private/versioned asset storage,
CloudFront/OAC, security headers and a same-origin API behavior. It does not
instantiate/update the data stack, API task or identity credentials. The default
static router accepts exact application/public paths and hashed asset shapes;
unknown/private build metadata paths and non-API writes cannot fall into the SPA.

The /api prefix is removed before forwarding to the existing HTTPS API. Cookie,
authorization and query values are forwarded by the reviewed origin request policy;
API caching is disabled, Cache-Control is no-store, error caching is zero and API
errors are not replaced with HTML. No CDN request logging is enabled. App headers
retain first-party script/style/connect rules and no-referrer/embedding controls.

A same-account, non-exportable us-east-1 ACM certificate for app.rillora.xyz is
required. Use only its returned validation CNAME and the final app CNAME through
the Rillora DNS guard; preserve all other records. DNS/certificate/CDN publication
and actual API/client behavior require separate live readback.

## Current evidence and remaining work

Local typecheck,39infra tests,21release guards,4focused Web tests and the closed Web
build pass. The first infra run had one erroneous hard-coded managed-cache-policy
ID in a new test; it now compares the SDK's CACHING_DISABLED identity. No runtime
cache policy was loosened.

Simulator Release build succeeds with five exact values, customer accessNO and
no StoreKit fixture. This is not a signed distribution archive or successful
customer login. Four targeted native tests pass. Actual Release Simulator public-home/closed-account
behavior is verified and the usable Debug testing build restored. Cloud delivery
and desktop/390px Chrome interaction are verified in [QA](../output/qa/rillora-production-clients-20260925/work-state.json).

Owner renewed AWS. The official same-device callback completed in the CLI even
though Chrome displayed ERR_BLOCKED_BY_CLIENT afterward; actual account/resource
reads proved recovery without bypassing browser security. Current SES check still
has productionAccessEnabledfalse. No customer email or test identity was changed.

## Deployed checkpoint

RilloraProductionWeb is CREATE_COMPLETE: app.rillora.xyz resolves through both
authoritative and two independent public resolvers to distributionE2D4X9TBTJK942.
The custom hostname has verified HTTPS and the exact local HTML digest.
Public pages/JPG return200, metadata/unknown routes404, non-API writes403, and
the same-origin API returns ready200 or closed-account503/no-store as appropriate.
No session cookies are issued. Ten direct-distribution checks and five custom-host
checks pass. Actual bucket public-access blocking, encryption/versioning and
anonymous403 are read back using the existing read-only lookup role; the CDK
deployment role's read denial was not resolved by granting more permissions.

The deployment-provider invalidation capability is explicitly denied for other
CloudFront distributions. Existing API task, database, identity bindings and
billing configuration were not updated. The app CNAME and its returned validation
CNAME were the only DNS additions; the domain guard checks unrelated preservation.

The14-target Operations configuration is deployed and matches source; actual
Lambda execution isok/failed0. Prior subscriber-delivery/silence evidence retains
its date. No new subscriber or Codex scheduled task was created.

An actual product-build check exposed omitted JPEG support. Both static routers
now support the required image formats, and both build steps check every emitted
asset against their router. The particular folio JPG belongs to the full product
artifact, not WWW's current public artifact: probing its nonexistent WWW URL
does not prove a broken image in the public page. This corrects the initial
investigation inference. The actual production JPG is served and public-page
PNG/logo rendering was observed.

Local evidence:39infra,84Web,21release-guard,7monitor and4targeted native tests;
internal/public/closed-production Web builds and Simulator Release compile pass.
The final distribution archive, identity flow and ordinary payments are separate.
