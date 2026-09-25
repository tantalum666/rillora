# Rillora StoreKit Implementation Contract

Role: StoreKit 2 client, local Xcode testing, Apple sandbox and server-verification implementation contract  
Authority scope: Rillora Family StoreKit product identifiers, purchase/restore lifecycle, transaction evidence, App Store server boundary and phased verification  
Superseded by: newer Apple platform rules, verified App Store Connect state, a later Owner decision, or stricter payment/security evidence  
Do not use for: proof of App Store approval, accepted Paid Apps Agreement, banking/tax completion, live IAP products, production entitlement or a real charge  
Status: COMPLETE LOCAL XCODE SK0; APP STORE CONNECT SANDBOX METADATA／PRICES／EIGHT STOREFRONTS／TWO PURPOSE-LIMITED TESTERS CREATED; LIVE USA SANDBOX CATALOG LOAD VERIFIED ON CLEAN IOS 26.4／26.5 SIMULATORS; DEBUG-ONLY SERVER-GATED PURCHASE HARNESS READY; OFFICIAL APPLE JWS／SERVER API SNAPSHOT／DURABLE NO-ENTITLEMENT RECONCILIATION IMPLEMENTED LOCALLY; ONE ACTIVE CHROME IAP KEY `.P8` SECURED LOCALLY, OFFICIAL CLIENT CONSTRUCTION AND AUTHENTICATED SERVER API PROBE VERIFIED; SIMULATOR SANDBOX ACCOUNT PERSISTENCE BLOCKED BY APPLE `AMSERRORDOMAIN 100 / PASSWORD REUSE NOT AVAILABLE`; STAGING DEPLOYMENT／PURCHASE COMPLETION／REVIEW REMAIN OPEN  
Last updated: 2026-09-26 (production verification foundation and portal readback; historical evidence retained)

## September26 production foundation and current portal readback

Owner restored Apple administration. Actual annual pricing remainsUSD68; the
fresh800-point USA table has no88.80. Owner has reaffirmed channel differentiation;
the88.90/88.99/88.00question is withdrawn. Verify effective fees and the prior99.99/
119.99candidates before applying the exact Apple price. Monthly still has zero territories.
Both unsubmitted products now disallow the newly default-enabled multiseat option
and keep only App Store as a purchase channel. Existing Family Sharing remains off.

A separate strict production signature/ownership wrapper and explicit versioned
signed-price mapper are locally implemented.242API tests/typecheck/build pass,
including18focused Apple tests. They are not yet wired to production snapshot/
intake/notifications/native purchase, and have no actual live price bindings.
No Apple transaction or review was submitted. [Current focused contract](production-apple-20260926.md).

## September21 annual-only checkpoint

Owner cancelled new monthly purchases. `purchasableFamilyProductIDs` contains only
`com.rillora.family.annual`; product loading and both purchase guards use it.
`familyProductIDs` deliberately retains annual and monthly for old transactions,
status, updates and restore.17 focused CommerceStore tests pass, including denied
monthly purchase and historical monthly restore. The normal Debug app has been
built and installed onRillora-Matrix-17-Pro.

AppStoreConnect's unsubmitted monthly product6803958645 now selects0territories;
the app description is saved as annual-only. Apple removal also prevents renewals,
so this action was limited to the never-released product, not a migration of live
paying customers. The annual product's price was not changed: exact88.80 is not an
available US point and the separate channel-price suggestions remain unapproved.
No Apple transaction, submitted build or public release follows from these facts.
[Current execution](annual-brand-capacity-20260921.md).

## September17 validation receipt boundary

Native v2 receipts accept a test entitlement change only with explicit validation-only mode and an applied authoritative result. API reconciliation supports expiring enrolled sandbox accounts; ordinary billing is closed. Actual Apple sandbox purchase/restore and Apple-enabled staging remain unverified. Native149 includes this boundary and retains the prior StoreKit skip. Older no-mutation claims describe their historical checkpoint. [Current work](commercial-completion-20260916.md).

## HISTORICAL — September11 prospective price and retained test objects

The Owner selected US$68/year; the Agent selected US$7.99/month within delegated
scope. API migration0040 creates new disabled USD quotes and passes local tests.
Existing99/9.99 Xcode and App Store Sandbox products retain their original amounts
and evidence. No Apple repricing, native UI run, purchase or cloud deployment
occurred. New mappings must use actual available localized Apple price points;
if an exact68 storefront point is unavailable, resolve an explicit channel quote
before showing or selling it. Do not silently display68 and charge67.99/68.99.
[Current price contract](pricing-68-20260911.md).

## Current Result

### September10 cost clarification: SBP is not a household-count tier

1,000 Rillora subscribers do not by themselves end a15% rate. Apple's Small
Business Program uses combined annual App Store proceeds from all apps and
associated developer accounts, subject to its1-million-USD rules and actual
approval. Proceeds are after Apple's commission and specified taxes/adjustments.
At68/year,1,000 annual buyers generate68,000 gross sales even if all use Apple. Other apps' qualifying proceeds cannot be assumed
zero, and program approval has not been read back. Current economics therefore
keeps standard first-year30% as base and15% as conditional, without changing
Apple configuration. Standard subscription post-paid-year proceeds are a separate
rule. [Official SBP rules](https://developer.apple.com/app-store/small-business-program/)
and [current staged model](unit-economics.md).

### 2026-08-24 Sandbox authentication failure isolated to Apple Simulator account persistence

After the Owner explicitly confirmed transmitting the purpose-limited Sandbox credentials and completing an annual test purchase, the purchase harness submitted the credentials only to Apple's Sandbox authentication sheet. On the clean iOS 26.5 `Rillora-Matrix-17-Pro`, the original tester and a freshly created replacement both reached AuthKit successfully, but `appstored` then failed credential verification with `AMSErrorDomain 100`; the nested Apple error was `AMSErrorDomain 2 / Password reuse not available for account / The account state does not support password reuse`. StoreKit returned cancellation before any payment sheet or transaction existed.

The same test was repeated on a newly created, directly installed iOS 26.4 Simulator with no Xcode StoreKit configuration. Its real USA catalog also loaded both products, but a separately rotated Sandbox tester produced the same Apple account-persistence error. This exact cross-runtime／cross-account reproduction matches a previously reported Apple Simulator Sandbox failure and is not evidence of a Rillora catalog, product-ID, server-key or reconciliation defect. Apple's current Developer System Status still reports App Store Sandbox available, so the observed failure is recorded as an unacknowledged Simulator-specific external block rather than a declared Apple outage.

One automation attempt on iOS 26.4 reused an invalid secure-field reference and placed the first replacement password into the account field; the value then appeared in a local automation snapshot. That test-only credential was treated as compromised immediately: submission was cancelled, its Keychain item was deleted, the matching App Store Connect tester was deleted, and the password was cleared from process memory. A third tester was created with a new unique Gmail subaddress and password, read back as USA／not interrupted, and stored only in macOS Keychain under `Rillora StoreKit Sandbox Tester 3`. No credential value is present in source or Markdown. The original tester remains retained as historical diagnostic state; the deleted replacement cannot be reused.

The local API received no StoreKit transaction. Database readback is exactly zero Sandbox inbox rows, provider events, StoreKit subscriptions, StoreKit reconciliations and entitlement mutations; the synthetic planner has zero commerce accounts and zero active grants created by this attempt. A fresh `commerce-v1` read remains `billingOpen=false / planCode=free / subscription=null`, with the ten Free-baseline entitlements and both callback／client-purchase access grants false. No transaction was available to finish, restore or query through the Server API, and Notifications V2 could not fire.

The exact next execution gate is an online physical iPhone running the development-signed build, using the rotated Keychain tester, or a later Apple runtime／service state that no longer reproduces this Simulator authentication defect. Complete the annual Sandbox purchase there, submit the signed device transaction to local API `4182`, require a durable Apple-authoritative snapshot before finish, and re-read ordinary Free access. The currently paired iPhone is offline, so physical-device execution is not claimed. AWS deployment remains a separate money-impact gate after this local lifecycle succeeds.

### 2026-08-24 live Sandbox catalog and server-gated purchase harness

The earlier `Products unavailable` result was not evidence that App Store Connect metadata had failed to propagate. Simulator StoreKit logs showed that `Rillora-Matrix-17-Pro-Max` still had a stale Xcode-local StoreKit test account and `ASOctaneSupportXPCService` route for `com.rillora.ios`; even the Sandbox diagnostic was therefore requesting a local `localhost` catalog. Resetting the visible Media Services setting was insufficient because the old local StoreKit service and receipt remained attached to that Simulator state.

The local service was stopped and the current app was installed directly on the already-booted, clean `Rillora-Matrix-17-Pro` without an Xcode StoreKit configuration. The same diagnostic then loaded the real App Store Sandbox catalog at storefront `USA`: `Rillora Family Yearly / US$99.00` and `Rillora Family Monthly / US$9.99`. This is direct catalog propagation evidence for one USA Simulator state; it is not tester authentication or a purchase.

The retained Chrome credential also made one bounded, read-only network probe through Apple's official `AppStoreServerAPIClient`. Apple accepted the JWT/key/bundle/environment combination and returned HTTP 404 with API error `4040010 / TRANSACTION_ID_NOT_FOUND` for a deliberately nonexistent synthetic transaction ID. A 401／403 did not occur. No real customer／transaction data was requested or returned.

`RilloraStoreKitSandboxPurchase` is now a separate Debug-only scheme. It uses the real App Store group `22325627`, the purpose-limited synthetic planner UUID and the local API on port `4182`. A verified Sandbox transaction is submitted to the authenticated StoreKit endpoint; the client finishes only when the response proves an Apple authoritative snapshot was durably committed. Pending or failed snapshots remain unfinished and expose an explicit retry. Every response must keep `entitlementChanged=false`, `entitlementMutationEnabled=false` and ordinary access Free. The catalog-only scheme still has no purchase action.

At this earlier checkpoint the purchase surface had only reached Apple's real Sandbox sign-in sheet. The newer authentication section above supersedes that credential-transmission boundary: credentials were submitted after explicit confirmation, but Apple failed before creating a transaction. Current local verification remains iOS `101 passed / 0 failed / 1 skipped`, API `98 / 98`, API typecheck／build, zero production audit findings and a ready local 4182 API.

Rillora now has an isolated local StoreKit 2 development path that does not touch App Store Connect and cannot change ordinary access:

- `apps/ios/StoreKit/Rillora.storekit` defines one auto-renewable subscription group with monthly `com.rillora.family.monthly` at US$9.99 and annual `com.rillora.family.annual` at US$99;
- both products are the same Family service level and are not Family Sharing products;
- `RilloraStoreKitLocal` is a separate Debug scheme. It activates the local StoreKit configuration, points at the existing local synthetic API/planner fixture and sets an explicit `RILLORA_STOREKIT_LOCAL_TESTING=1` process gate;
- the ordinary `Rillora` and Release schemes do not activate the local StoreKit file or test UI;
- the `.storekit` file is available to the Debug app and to the `RilloraTests` resource bundle, as required for `SKTestSession`; the test resolves its own bundle rather than relying on the hosted app. `EXCLUDED_SOURCE_FILE_NAMES` removes the file from Release, and a fresh Release Simulator build contains no `.storekit` file;
- migration `0027_storekit_local_test_catalog.sql` binds the same two identifiers to the existing provider-neutral USD price records as `storekit / test / USA / test_only`. It does not enable a market, route, sale or entitlement;
- the Swift client loads only the exact auto-renewable product identifiers in subscription group `D7BCE9A1`, supplies a UUID `appAccountToken`, rejects unverified results, listens to `Transaction.updates`, reads `Transaction.currentEntitlements`, reads and listens to `Product.SubscriptionInfo.Status`, and exposes an explicit `AppStore.sync()` action only after user intent;
- local transaction and subscription-status evidence must match the signed-in synthetic planner UUID, exact Family product allowlist and subscription group, Xcode environment and current storefront. Verified status evidence retains the Apple-signed transaction and renewal-info representations for the later server boundary while the visible local record strips signatures and shows only bounded state;
- the local harness retains no JWS in UI state. It shows only bounded product/transaction counts and continues to display ordinary Rillora access from the server, which remains Free;
- a verified local purchase does not create or mutate `commerce_entitlement_grants`, does not enable billing and does not become revenue evidence.

The separate App Store Connect SK1 control plane now exists under team `8L99CFNK24`:

- iOS App `Rillora`, Apple App ID `6803957639`, bundle `com.rillora.ios`, internal SKU `RILLORA-GLOBAL-IOS-001`, primary language `en-US`, status `Prepare for Submission`;
- auto-renewable subscription group `Rillora Family`, Apple group ID `22325627`, status `Prepare for Submission`;
- monthly `Rillora Family Monthly`, product ID `com.rillora.family.monthly`, Apple ID `6803958645`, one month, status `Prepare for Submission`;
- annual `Rillora Family Yearly`, product ID `com.rillora.family.annual`, Apple ID `6803959021`, one year, status `Prepare for Submission`;
- both billing periods are in the same subscription level `1`, so they remain the same Family capability rather than upgrade／downgrade products;
- Family Sharing remains off. Group／monthly／annual `en-US` localizations now exist. Monthly uses US$9.99 and annual uses US$99.00 as the United States base price. Both products are available only in `USA / CAN / GBR / IRL / JPN / BRA / KOR / HKG`, with automatic future-country availability off. The annual product uses one-year prepayment; the new twelve-month contract／monthly-payment option remains off. No offer, review attachment, build, `Add for Review`, App Review submission or public release exists.

The local Xcode group ID remains `D7BCE9A1`; the real App Store Connect group ID is `22325627`. These are environment-specific identifiers and must not be globally substituted for one another. A later sandbox adapter must select the appropriate group explicitly while retaining the same product allowlist and server-owned entitlement boundary.

The sandbox adapter implements that isolation with four explicit states: disabled, Xcode local, App Store Sandbox catalog and App Store Sandbox purchase. `RilloraStoreKitLocal` selects only group `D7BCE9A1`; `RilloraStoreKitSandboxCatalog` selects only group `22325627`, has no active local StoreKit configuration and remains read-only. `RilloraStoreKitSandboxPurchase` uses the same App Store group but adds a synthetic Rillora account binding, authenticated local server intake and server-authorized finish. Enabling more than one StoreKit test flag fails closed to disabled.

Current checks: XcodeGen generation succeeds and lists five schemes, including local, catalog-only and Sandbox-purchase paths. The purchase scheme builds and the full iOS suite discovers 102 with `101 passed / 0 failed / 1 skipped`. The earlier Pro Max negative result is preserved because it exposed a stale Xcode-local StoreKit service. On the clean Pro Simulator, the catalog now returns both exact App Store products and prices. The local scheme still contains the exact StoreKit configuration reference and local-test environment; the app and test bundle both contain `Rillora.storekit` in Debug; Release contains no `.storekit` resource. The separate installed-runtime `SKTestSession` failure remains unchanged.

Apple DTS later confirmed the matching forum issue as known, and Apple’s iOS 26.6 Release Notes list a resolved `SKTestSession` Simulator-connection defect. Xcode was therefore updated through the Mac App Store from 26.5 to 26.6 (`17F113`) without a credential or new-agreement prompt. A focused Xcode 26.6 run on iOS 26.4 still logged Code 3 and hung; a brand-new iOS 26.5 Simulator logged Code 3 and returned an empty catalog. The exact official command `xcodebuild -downloadPlatform iOS -buildVersion 26.6 -architectureVariant arm64` returned `iOS 26.6 (arm64Only) is not available for download`, so the release-note fix cannot yet be exercised on its named runtime. The default guard continues to skip the case on the installed 26.4／26.5 runtimes; `RILLORA_RUN_UNSTABLE_STOREKITTEST=1` remains a deliberate diagnostic override. The final Xcode 26.6／iOS 26.5 suite discovers 95 tests and reports `94 passed / 0 failed / 1 skipped`; a fresh Xcode 26.6 Release build passes and excludes the configuration. API typecheck/build and `82 / 82` tests remain the latest API checkpoint with migration `0027`.

The booted `Rillora-Matrix-17-Pro-Max` and Xcode Run path provide separate runtime evidence. Both exact local products loaded, the system Xcode purchase sheet showed the annual US$99 test subscription and explicitly stated that no charge would occur, and confirmation produced one verified Xcode transaction plus one current local entitlement. The 4181 `commerce-v1` read remained `billingOpen=false`, `currentAccess.planCode=free`, `subscription=null`, free-baseline entitlements only, and both provider-callback and client-result access boundaries false. Closing a later purchase sheet produced the quiet cancelled state without creating an entitlement. Xcode's transaction manager then changed the annual transaction to `Refunded` with a revocation timestamp; the app's live transaction listener recorded the verified update, the new subscription-status reader displayed `Revoked`, and `Transaction.currentEntitlements` fell from one to zero while ordinary access stayed Free.

An isolated `Rillora-StoreKit-Lifecycle` iPhone 17 Pro Max Simulator was created rather than deleting the earlier local transactions. A clean monthly purchase first displayed `Subscribed · renews`. With Xcode's local rate temporarily set to one renewal every two seconds, `Transaction.updates` drove the visible verified-local-transaction count to 49 after one purchase, and the accelerated chain later returned current local entitlements to zero. A second run reached 39 verified local updates and again returned to zero. That first attempt did not retain an app-visible `.expired` row, and a first 30-second retry／grace attempt delivered no next renewal in 85 seconds; those negative observations remain preserved.

The remaining lifecycle states were then closed through Apple-supported Xcode Run and transaction-manager controls on `Rillora-StoreKit-26-4`. Ask to Buy produced the system `Ask Permission` sheet and the app-visible `.pending` message before manager approval moved it to `Subscribed`. A same-account monthly transaction dated one month in the past and set not to renew produced app-visible `Expired`. A 30-second renewal with retry／grace enabled produced app-visible `Billing retry`; a five-minute renewal plus a transaction dated six minutes in the past produced a stable app-visible `Grace period`. Changing the live default storefront from USA to Canada changed both product labels to `CA$` without restarting the app, while a concurrent service evaluation returned `none / storefront_not_eligible` and preserved the no-profile-persistence boundary. Every state kept ordinary `commerce-v1` at Free with no subscription. The transaction manager ended at `No Transactions`; configuration ended at USA, Real Time, retry off, grace off, Ask to Buy off, interrupted purchases off and dialogs on.

The explicit restore button now completes inside the Xcode local environment. `AppStore.sync()` presented Apple's system sheet stating `Press “OK” to simulate authenticating with an Apple Account` and `[Environment: Xcode]`; it exposed no Apple ID, password, MFA or account selector. After the test-authorized `OK`, the app displayed `Local StoreKit history was refreshed. Ordinary Rillora access is still server-owned.`, with zero verified local transactions and zero current local entitlements. A concurrent API read remained `billingOpen=false / planCode=free / subscription=null`. This closes the Xcode-local restore branch only; it does not prove a real App Store／Sandbox Apple Account login or restoration of an App Store Connect purchase. This Mac has Xcode 26.6 plus iOS 26.4 and 26.5 installed; the retained automated integration still cannot synchronize on either installed runtime, while the iOS 26.6 runtime named by Apple’s fix is unavailable for download.

Local evidence is preserved under `qa/storekit-local-2026-08-20/`:

- `01-xcode-purchase-sheet.jpg` — SHA-256 `5fccbaef9b8af0fd20d73c971dc45f7f9de9a8732fccd734080dddae68981f38`;
- `02-xcode-refunded-transaction.jpg` — SHA-256 `4911c6a3b10f57a02f2c1f84ce5902eabc0d1e28b8a31a00d56df9e526845f4f`;
- `03-refund-readback-entitlements-zero.jpg` — SHA-256 `c354df5a24e0b91913ac260523c52e79e28ff70d4eb2db8dc36608a706dd3b85`;
- `04-restore-account-gate-cancelled.jpg` — SHA-256 `0bd7f681243e9473fe0dab7b707151507c79c9e39a93de560590179912270d1e`;
- `05-purchase-cancelled-no-entitlement.jpg` — SHA-256 `4e2c83c421b9d3acc0d44d74f810ec79e6cd94fdb999470743ba201313ccb767`;
- `06-subscription-status-revoked.jpg` — SHA-256 `fd6dda5fada77c06e0cdbc4b8a76cb46b304b2f2d4e8ef72df582ed1693ec0aa`;
- `07-ios-94-pass-1-skip.log` — SHA-256 `13f4540e6d750645dd3857d95e6c5b70c9b37361c3a7c5d25ac52ef2b54d33ce`;
- `08-release-build.log` — SHA-256 `fd59bc086343f7a1a04f216ea06278b0d3d474096d78a7fe90a01ef0e7168246`;
- `09-lifecycle-observation.md` — exact runtime procedure, observed counts and negative-result boundary;
- `10-ios-26-4-storekittest-code3.log` — SHA-256 `f9ccffef9c4836a54a2fb03c8cfca74539c9b1eadb3b41c2b6d4d2f00a92af9a`;
- `11-ask-to-buy-pending.jpg` — SHA-256 `cb8e34b4f82fae75e3446d1685c03cf5bab0a51c303194ea1c77f0cd108870a5`;
- `12-expired-status.jpg` — SHA-256 `529e9b1db32b11ad9eb06b8085d3482de7cbeb731e7b0b6885c10b2c9a7a2ee9`;
- `13-billing-retry-status.jpg` — SHA-256 `d6bf80287346a63f865709669c4f2d5202a0f9eab8979656a30ad9d0376f6e61`;
- `14-grace-period-status.jpg` — SHA-256 `fd299b08188b3b967d93a8496f76edca059942221d7701b870af1c7c99960c5c`;
- `15-storefront-canada.jpg` — SHA-256 `efd1df9acf8e8c41c3f1a272b9dd94328fd9bc4296ce7b792edef9d68385f4bb`;
- `16-ios-94-pass-1-skip-after-lifecycle.log` — SHA-256 `3660f0c27dab70f1fac262af52f3ac637fec308072b6f5d06df3dfda1945880c`;
- `17-release-build-after-lifecycle.log` — SHA-256 `6ebb27ed5669c7492a62fd96017fedd0e94f62559a717217cea72891463d33c3`;
- `18-xcode-26-6-ios-26-4-code3.log` — SHA-256 `f0baa4d4b8d2828ad0610e3f8cc2c038f7b510a4c1c48cce31dcd7036e976324`;
- `19-xcode-26-6-ios-26-5-code3.log` — SHA-256 `5b5579dde160f8a0dc52a2fa0bf34e314364a915a55486a0f408f50196868820`;
- `20-ios-26-6-runtime-unavailable.log` — SHA-256 `80a2e3a3c42af3b8401a05b4a1d27a9f2a93d2dad78544922d1f30bf84c4d40c`;
- `21-ios-94-pass-1-skip-xcode-26-6.log` — SHA-256 `4ad58ea33a8f0b9b90d82fca72d2c22279d3cd322d2a8f695abb2f7c7ab76135`;
- `22-release-build-xcode-26-6.log` — SHA-256 `4b15289de4532cb9ff8ff23b65f77164d5710328ea9659f6e8739a4cfb2c201a`.
- `23-post-restore-local-auth.jpg` — SHA-256 `d2635c998884ab9abfa5240c7edcc91f9f0e5cbf26490c33cb2a513ee0b08de5`; app-visible successful local refresh, zero local transactions／entitlements and the server-owned-access statement after Xcode simulated authentication.
- `24-restore-xcode-simulated-auth-prompt.jpg` — SHA-256 `25f4977cd4cabdb82f2c30fdd474151bc966f44132d5513ac9f68e4c4e449a57`; Apple-owned prompt explicitly identifying Xcode simulated Apple Account authentication and exposing only `Cancel / OK`.

## Product And Identifier Contract

| Billing period | Local/test product ID | Plan/price mapping | External state |
| --- | --- | --- | --- |
| Monthly | `com.rillora.family.monthly` | `family-v1 / family_usd_monthly_v1` | Apple ID `6803958645`; group `22325627`; level 1; one month; US$9.99 base; eight Sandbox-matrix storefronts; Prepare for Submission |
| Annual | `com.rillora.family.annual` | `family-v1 / family_usd_annual_v1` | Apple ID `6803959021`; group `22325627`; level 1; one-year prepaid; US$99.00 base; eight Sandbox-matrix storefronts; Prepare for Submission |

These product identifiers now exist both in the local Xcode fixture and as non-live App Store Connect records with the minimum localization, price and availability required for Sandbox propagation. They remain unsubmitted `Prepare for Submission` products; this does not prove product loading, purchase, review approval or sale. Before any App Review submission, availability must be read back and restricted to the then-approved public launch markets rather than inheriting this test matrix.

Monthly and annual remain one entitlement tier. Do not assign different capability levels, put them in different subscription groups or enable Family Sharing merely because the product is called `Rillora Family`; Rillora recipients are not Apple Family Sharing seats.

## Client State Machine — LOCKED FOR THIS PHASE

```text
not_loaded
  -> loading_products
  -> products_loaded | products_unavailable

purchase_intent
  -> system_confirmation
  -> user_cancelled | pending | unverified | verified_local_evidence
  -> local_test_recorded
  -> finish

explicit_restore_intent
  -> AppStore.sync()
  -> refresh Transaction.currentEntitlements

subscription_lifecycle
  -> verify transaction JWS + renewal-info JWS
  -> subscribed | in_grace_period | in_billing_retry | expired | revoked | unknown
  -> bounded local status record
  -> never mutate ordinary access
```

Rules:

1. `Product.products(for:)` must return both exact auto-renewable Family identifiers before the local purchase buttons appear.
2. `Product.PurchaseOption.appAccountToken` binds the test purchase to the current Rillora planner UUID; the App Store returns that UUID in the transaction.
3. Storefront changes during purchase must not silently continue under a different storefront.
4. `.unverified` results are neither recorded nor finished.
5. `pending` is not success and changes no Rillora state.
6. `userCancelled` is a quiet end state, not an error or abandonment claim.
7. `AppStore.sync()` may show an authentication prompt and is called only from the explicit local restore button; routine entitlement refresh uses `Transaction.currentEntitlements`.
8. The local harness may finish a verified Xcode transaction only after its bounded in-memory test record is accepted. This is not the production finish rule.
9. Subscription status is accepted only when both the transaction and renewal info verify and the account token, subscription group, product, Xcode environment and storefront all match. Status rows never grant access.

## Production Server Boundary — LOCAL SANDBOX EXECUTOR IMPLEMENTED; CREDENTIAL／DEPLOYMENT OPEN

The production/sandbox path must be stricter than the local harness:

1. iOS obtains a verified StoreKit transaction and sends its compact signed transaction representation to an authenticated Rillora endpoint. The catalog-only scheme exposes no purchase action; the new Debug-only purchase scheme exercises this exact path with a synthetic planner and local server.
2. The server verifies the Apple `x5c` chain with digest-pinned Apple root certificates through the official App Store Server Library; Sandbox and production are explicit and cannot be confused.
3. The server binds bundle ID `com.rillora.ios`, exact product ID, group `22325627`, `appAccountToken`, original transaction ID, storefront, environment and Rillora commerce account.
4. The transaction is only a signal. The implemented adapter calls `Get All Subscription Statuses`, verifies the returned signed transaction and renewal info, and normalizes Apple `active / expired / billing retry / grace / revoked` into the provider-neutral subscription contract.
5. The executor persists the provider event, subscription state/history and reconciliation in one commerce-role transaction. Only after that commit may the authenticated client receive `finishAuthorized=true`; pending or unavailable Server API evidence remains unfinished and retryable.
6. Every reconciliation still writes `entitlement_mutation_applied=false`. Callback, local success and billing state never enter a life-event or disclosure state machine or change ordinary Free access.

App Store Server Notifications V2 now has a Sandbox-gated public `signedPayload` endpoint separate from planner authentication. It verifies the outer notification plus nested transaction／renewal JWS, persists the normalized digest and references before returning, and treats repeated notification UUIDs as duplicates. A security-definer resolver may map a verified planner UUID only to an already active Global commerce account; the public notification cannot create one. Missing bindings remain `needs_mapping`; verified mapped events remain `needs_authoritative_snapshot`. No provider event, subscription or entitlement is written until a future App Store Server API snapshot is fetched and reconciled. The older synthetic Apple verifier remains separate test evidence and deliberately refuses real `x5c` chains.

## Phase Gates

### Phase SK0 — local Xcode configuration

- Implement exact products, local scheme, product loading, verified purchase result, update listener, current entitlements and explicit restore.
- Keep ordinary server access Free and all entitlement mutation disabled.
- Test success, cancellation, pending/Ask to Buy, unverified evidence, renewal, expiration, billing retry/grace, refund/revoke, restore and storefront change through StoreKitTest/Xcode transaction manager.
- Current status: implementation/build, exact-product loading, annual／monthly success, current-entitlement readback, quiet cancellation, Ask to Buy／pending, subscribed, expired, billing retry, grace, refund／revocation, repeated renewal updates, live storefront change and explicit Xcode-local restore are verified without changing server access. The automated `SKTestSession` integration remains blocked on both installed iOS 26.4 and 26.5 runtimes under Xcode 26.6; Apple documents the relevant iOS 26.6 Simulator fix, but that runtime is not currently downloadable.

### Phase SK1 — App Store Connect sandbox

- Owner reviews and personally accepts any required Paid Apps Agreement, banking and tax steps; these are legal/money gates.
- Recheck exact team/app/bundle, then create one subscription group and the two non-live products in App Store Connect.
- Record exact product IDs, subscription-group ID, availability and sandbox state without opening saleable production availability.
- Create only purpose-limited Sandbox Apple Accounts and test on a development-signed app/TestFlight as appropriate.
- No live price, market availability or App Store submission is authorized by this phase.
- Current checkpoint, 2026-08-24: App `6803957639`, group `22325627`, monthly Apple ID `6803958645` and annual Apple ID `6803959021` remain non-live `Prepare for Submission`. Group and both products have `en-US` localization. Monthly prices for the eight selected storefronts are `USD 9.99 / CAD 12.99 / GBP 9.99 / EUR 9.99 / JPY 1,500 / BRL 59.90 / KRW 17,000 / HKD 88`; annual prices are `USD 99.00 / CAD 129 / GBP 99 / EUR 99 / JPY 15,000 / BRL 599.90 / KRW 149,000 / HKD 788`. Both products select exactly `USA / CAN / GBR / IRL / JPN / BRA / KOR / HKG`; `CHN` and automatic future-country availability are off. Annual is prepaid, not the separate twelve-month monthly-payment contract. One purpose-limited Sandbox tester exists with initial USA storefront; its generated credentials are stored only in macOS Keychain under `Rillora StoreKit Sandbox Tester`. The clean booted Pro diagnostic now loads both products at USA prices. The first purchase has reached, but not completed, the tester login sheet; no tester credential, transaction, restore or review action has yet completed.

### Phase SK2 — server verification and sandbox lifecycle

- The official `@apple/app-store-server-library` `3.1.0` is installed. Three DER roots downloaded from Apple PKI are digest-pinned and packaged into the runtime image. `SignedDataVerifier` verifies and normalizes Sandbox Notifications V2 and device signed transactions while binding bundle `com.rillora.ios`, group `22325627`, the exact two products, planner-bound `appAccountToken` and the eight-storefront matrix. A provider signal retains only normalized references plus the signed-payload digest; JWS strings do not enter signal state. The planner token is modeled as an account-binding reference, not incorrectly treated as a commerce-account ID.
- Authenticated `POST /v1/commerce/storekit/sandbox/transactions` verifies the device JWS against the authenticated planner and storefront, reserves／reuses the existing Global commerce account, writes an inbox row plus original-transaction／transaction links, and always returns `finishAuthorized=false / entitlementChanged=false`. Public `POST /api/commerce/storekit/sandbox/notifications` verifies the three JWS layers and persists mapped, unmapped, unsupported and duplicate states without trusting the sender’s network identity. Migrations `0028` and `0029` add the binding field, authoritative-snapshot state, object-link types and least-privilege resolver; applied migration checksums remain immutable.
- The App Store Server API client, signed-status normalization, retryable durable executor and no-entitlement reconciliation are implemented locally. Runtime use remains disabled until the complete credential is safely injected.
- After explicit action-time confirmations, App Store Connect created `Rillora StoreKit Server`, `Rillora StoreKit Server 2` and Chrome-based `Rillora StoreKit Server 3`; Apple records all three one-time downloads on 2026-08-24. The in-app Browser produced no file even with correctly ordered event capture. Chrome’s final file became visible in Downloads after the Owner checked it. Exactly one post-baseline `.p8` was moved into ignored local storage with mode `0600`; PKCS#8 structure, size, OpenSSL parsing and locally stored SHA-256 fingerprint pass. The final key／issuer values construct the official Sandbox client locally. After separate destructive confirmation, the first two keys were revoked together and Apple now shows exactly one active key, `Rillora StoreKit Server 3`, plus two revoked rows dated 2026-08-24. Revocation IDs and date are retained locally in ignored mode-`0600` evidence files.
- Add the signed transaction intake and Notifications V2 endpoint with an independent least-privilege executor that still cannot grant ordinary entitlement.
- Verify purchase, duplicate notification, renewal, cancel-at-period-end, expiration, billing retry, grace, refund/revocation, restore and account-token mismatch.
- Current verification: API typecheck and production build pass; `98 / 98` tests pass. iOS `101 / 0 / 1` adds response-boundary validation, pending-without-finish and durable-acknowledgement-before-finish tests. Infrastructure typecheck, `9 / 9` assertions and opt-in Apple-enabled synthesis pass; it defines three separate write-only-operator Secrets Manager values but has not been deployed. The official library currently emits a transitive `jsrsasign@11.1.5` maintenance deprecation warning while `npm audit` reports no known vulnerability; monitor Apple library updates rather than replacing the official verifier with an unreviewed decoder.

### Phase SK3 — App Review and controlled paid activation

- Requires final legal/subscription/cancellation/refund text, Apple agreements, banking/tax, price and market approval, App Review evidence and a separately approved first real charge.
- The United States remains Stripe external-Web first under the current route policy; StoreKit is the US review fallback and the default for later approved non-US storefronts.
- No route opens two renewal providers for one household/plan.

## Evidence Boundary

Apple documents that local StoreKit configuration data is for development and does not upload to App Store Connect; local receipts are not App Store production receipts. Apple also documents that normal entitlement refresh should use current transaction information and that `AppStore.sync()` is an explicit user action because it may prompt for App Store authentication. The official Node server library requires Apple root certificates for signed-data verification and an In-App Purchase key/issuer/key ID for App Store Server API calls.

This document records current code, the completed Xcode-local lifecycle, the exact non-live App Store Connect records, the real USA Sandbox catalog load, the bounded authenticated Server API probe and the Debug-only server-gated purchase bridge. It does not prove an automated `SKTestSession` purchase on either installed iOS runtime, completed Sandbox tester login, Apple Sandbox transaction, authoritative snapshot for a real transaction, finish, restoration of an App Store transaction, signed Notifications V2 delivery, App Review, ordinary entitlement activation or payment.

## Official Sources

- [Setting up StoreKit Testing in Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode/)
- [Testing at all stages with Xcode and the sandbox](https://developer.apple.com/documentation/storekit/testing-at-all-stages-of-development-with-xcode-and-the-sandbox)
- [StoreKit In-App Purchase](https://developer.apple.com/documentation/storekit/in-app-purchase)
- [Product purchase options](https://developer.apple.com/documentation/storekit/product/purchase%28options%3A%29)
- [App account token](https://developer.apple.com/documentation/storekit/product/purchaseoption/appaccounttoken%28_%3A%29)
- [Transaction current entitlements](https://developer.apple.com/documentation/storekit/transaction/currententitlements)
- [Subscription status](https://developer.apple.com/documentation/storekit/product/subscriptioninfo/status)
- [SKTestSession](https://developer.apple.com/documentation/storekittest/sktestsession)
- [Testing Ask to Buy in Xcode](https://developer.apple.com/documentation/storekit/testing-ask-to-buy-in-xcode)
- [Testing in-app purchases with StoreKit transaction manager in Xcode](https://developer.apple.com/documentation/xcode/testing-in-app-purchases-with-storekit-transaction-manager-in-code)
- [iOS & iPadOS 26.6 Release Notes](https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-26_6-release-notes)
- [Apple Developer Forums: `xcodebuild test` does not sync `.storekit`](https://developer.apple.com/forums/thread/826971)
- [AppStore.sync](https://developer.apple.com/documentation/storekit/appstore/sync%28%29)
- [Apple App Store Server Library for Node.js](https://github.com/apple/app-store-server-library-node)
