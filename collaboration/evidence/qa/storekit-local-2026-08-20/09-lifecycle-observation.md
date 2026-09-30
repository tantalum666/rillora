# StoreKit local lifecycle observation

Date: 2026-08-20–2026-08-21 (Asia/Shanghai)  
Xcode: initial 26.5 (`17F42`); final 26.6 (`17F113`)  
iOS Simulator runtime: 26.5 (`23F77`)  
Local scheme: `RilloraStoreKitLocal`  
Primary simulator: `Rillora-Matrix-17-Pro-Max` (`0EC00819-D34F-4310-B807-7C6F057988A7`)  
Isolated lifecycle simulator: `Rillora-StoreKit-Lifecycle` (`A1512648-7B2E-4C2C-A7F9-9EE8090436C3`)
Isolated StoreKitTest simulator: `Rillora-StoreKit-26-4` (`65EC97D1-85F7-4622-88E0-80A1CE452088`)

## What was directly observed

1. The new subscription-status reader mapped the previously refunded yearly transaction to `Revoked`. The app showed zero current local entitlements and ordinary `commerce-v1` access remained `free`. Screenshot `06-subscription-status-revoked.jpg` records this state.
2. On the isolated simulator, a monthly local purchase first produced `Subscribed · renews` through the verified `Product.SubscriptionInfo.Status` path.
3. With Xcode's renewal rate temporarily set to `Any Renewal Every 2 Seconds` and dialogs disabled, one monthly purchase caused the running app's `Transaction.updates` listener to reach `Verified local transactions, 49`. `Current local entitlements` later reached `0`. This is local renewal-chain and entitlement-loss evidence; it is not a server entitlement or real subscription.
4. A second two-second run reached `Verified local transactions, 39` and again ended with zero current local entitlements. Because the expired renewal state was not retained as an app-visible status row, this is not promoted to explicit `.expired` state evidence.
5. Xcode settings were then changed to `Any Renewal Every 30 Seconds`, `Billing Retry = Enabled`, `Grace Period = Enabled`, and dialogs disabled. A new monthly purchase produced `Subscribed · renews`, but no renewal event arrived in two consecutive wait windows totaling 85 seconds. Billing retry and grace therefore remain unverified in Xcode Run.
6. The project StoreKit configuration was restored before handoff to `Real Time`, billing retry off, grace off, Ask to Buy off, interrupted purchases off, and dialogs on.
7. The installed iOS 26.4 runtime and `Rillora-StoreKit-26-4` Simulator were retained. The redundant 7.9 GB export under `/tmp/rillora-ios-26.4-runtime` was moved to Trash and not permanently purged.

## Automated and release checks

- The final iOS 26.4 suite discovered 95 tests and reported `94 passed / 0 failed / 1 skipped`; the retained skip is the real `SKTestSession` integration case.
- Removing the default iOS 26.5 skip and explicitly retrying there caused the test to hang while synchronizing the StoreKit test environment. The run was terminated after two short wait windows and the default 26.5 skip was restored with an opt-in `RILLORA_RUN_UNSTABLE_STOREKITTEST=1` retry gate.
- Apple’s official 8.46 GB arm64 iOS 26.4 runtime (`23E244`) was downloaded and installed. A clean `Rillora-StoreKit-26-4` Simulator reproduced `SKInternalErrorDomain Code=3` and an empty StoreKit catalog both with the filename initializer and the explicit packaged-file `SKTestSession(contentsOf:)` initializer. Quitting Xcode GUI and shutting down both 26.5 Simulators did not change the result. This rules out a 26.5-only runtime failure, filename lookup and local StoreKit-session contention; it does not establish an Apple-confirmed general defect.
- A fresh Release Simulator build succeeded. `/tmp/rillora-storekit-release-verify-derived-data/Build/Products/Release-iphonesimulator/Rillora.app` contained no `.storekit` resource.
- A concurrent local API read returned `contractVersion=commerce-v1`, `billingOpen=false`, `currentAccess.planCode=free`, `subscription=null`, and free-baseline entitlements only.

## 2026-08-21 supported-control follow-up

1. Apple’s StoreKitTest guidance requires the StoreKit configuration to belong to the test target. The project previously copied `Rillora.storekit` only into the hosted app. `RilloraTests` now has its own resources build phase, and the integration test resolves the file from `Bundle(for: AppleStoreKitClientTests.self)`. Both the app and test bundles contain the configuration after build; Release still excludes it.
2. This project repair did not remove the toolchain failure. A focused iOS 26.4 command-line retry still logged `SKInternalErrorDomain Code=3` and exposed an empty catalog. The Apple-Developer-Forums-reported IDE sequence was then tested exactly on the same device: Xcode Run, more than 20 seconds for StoreKit synchronization, stop, then Test. The suite reached `AppleStoreKitClientTests`, logged the same Code 3 and stopped progressing. The run was terminated. The default skip now covers both installed iOS 26.4 and 26.5 runtimes under Xcode 26.5; `RILLORA_RUN_UNSTABLE_STOREKITTEST=1` remains the explicit diagnostic override.
3. Xcode Run and the transaction manager supplied the remaining local lifecycle evidence without using `SKTestSession`. Enabling Ask to Buy produced Apple’s `Ask Permission` sheet; choosing `Ask` returned the app-visible message `The local StoreKit purchase is pending. No Rillora access changed.` The pending row was then approved in the transaction manager and the app moved to `Subscribed · renews`.
4. A monthly transaction bound to the same synthetic planner, dated one month in the past and configured not to renew, appeared as `Expired` in the transaction manager. Relaunching the app caused the verified subscription-status path to display `Monthly lifecycle · Expired`.
5. With `Monthly Renewal Every 30 Seconds`, Billing Retry and Grace Period enabled, and dialogs disabled, a new monthly transaction entered the transaction manager’s billing-failure timeline. Relaunching during the retry window displayed `Monthly lifecycle · Billing retry` in the app.
6. To make the short grace window deterministic, the renewal rate was changed to five minutes and a same-account transaction was created six minutes in the past. The transaction manager immediately reported `Billing Grace Period`; relaunching during that window displayed `Monthly lifecycle · Grace period` in the app.
7. While the app was running, changing Default Storefront from United States to Canada caused the visible local prices to update to `CA$99.00 / CA$9.99` without an app restart. The service-side reevaluation for `CAN + GLOBAL_US` returned `purchaseRoute=none`, `reason=storefront_not_eligible`, `requiresFreshEvaluation=true` and `storefrontPersistedToCustomerProfile=false`.
8. Every checked lifecycle state preserved `commerce-v1`, `billingOpen=false`, `currentAccess.planCode=free` and `subscription=null`. The transaction manager was left at `No Transactions`. The configuration was restored to United States, Real Time, billing retry off, grace off, Ask to Buy off, interrupted purchases off and dialogs on; Xcode and the Simulator were then stopped.
9. Apple DTS confirmed the matching StoreKitTest synchronization issue as known, and Apple’s iOS 26.6 release note lists a Simulator-connection fix. Xcode was updated through the Mac App Store from 26.5 to 26.6 (`17F113`); no password, Apple-account login or new license prompt was entered or accepted by the Agent.
10. The installed runtimes did not gain the documented fix. On Xcode 26.6, an explicit iOS 26.4 retry again logged Code 3 and stopped progressing; it was terminated. A brand-new iOS 26.5 Simulator logged Code 3 and exposed an empty catalog, causing the test’s evidence-preserving skip. The temporary clean 26.5 device was then deleted; the three retained Rillora devices remain shut down.
11. The official targeted command `xcodebuild -downloadPlatform iOS -buildVersion 26.6 -architectureVariant arm64` returned `iOS 26.6 (arm64Only) is not available for download.` No unofficial runtime or older blind runtime was substituted.
12. The final Xcode 26.6／iOS 26.5 full suite discovered 95 tests and reported `94 passed / 0 failed / 1 skipped`. A fresh Xcode 26.6 Release Simulator build succeeded and contained no `.storekit` resource.

## 2026-08-21 explicit local restore completion

1. The retained `Rillora-StoreKit-26-4` Simulator was booted with `RilloraStoreKitLocal`, the local API on port 4181 and the synthetic planner `11111111-1111-4111-8111-111111111111`.
2. Both exact local products loaded. The local transaction and current-entitlement counts were zero before restore.
3. Tapping `Refresh local purchase history` invoked `AppStore.sync()` and displayed the Apple-owned sheet `Sign in with Apple Account`, but the sheet explicitly said `Press “OK” to simulate authenticating with an Apple Account` and `[Environment: Xcode]`. It requested no Apple ID, password, MFA code or account choice.
4. Under the Owner's standing authorization for all test-mode actions, `OK` was selected. The app then displayed `Local StoreKit history was refreshed. Ordinary Rillora access is still server-owned.` Counts remained `Verified local transactions = 0` and `Current local entitlements = 0`.
5. A concurrent authenticated local API read returned `contractVersion=commerce-v1`, `billingOpen=false`, `currentAccess.planCode=free`, `subscription=null` and free-baseline entitlements only.
6. This closes the Xcode-local restore branch. It does not prove real App Store／Sandbox Apple Account authentication or restore an App Store Connect purchase.

## Evidence boundary

This observation proves local Xcode product loading; verified pending, subscribed, expired, grace, billing-retry and revoked presentation; Ask to Buy approval; repeated renewal updates; loss of current local entitlement after expiration; live storefront reloading; fail-closed route reevaluation; explicit Xcode-local restore; and preservation of server-owned Free access. It does not prove an automated `SKTestSession` purchase on the installed runtimes, real App Store／Sandbox Apple Account authentication, restoration of an App Store Connect transaction, Apple sandbox, App Store Connect products, server PKI, App Review, entitlement activation or any charge.

## Artifact hashes

- `06-subscription-status-revoked.jpg` — SHA-256 `fd6dda5fada77c06e0cdbc4b8a76cb46b304b2f2d4e8ef72df582ed1693ec0aa`
- `07-ios-94-pass-1-skip.log` — SHA-256 `13f4540e6d750645dd3857d95e6c5b70c9b37361c3a7c5d25ac52ef2b54d33ce`
- `08-release-build.log` — SHA-256 `fd59bc086343f7a1a04f216ea06278b0d3d474096d78a7fe90a01ef0e7168246`
- `10-ios-26-4-storekittest-code3.log` — SHA-256 `f9ccffef9c4836a54a2fb03c8cfca74539c9b1eadb3b41c2b6d4d2f00a92af9a`
- `11-ask-to-buy-pending.jpg` — SHA-256 `cb8e34b4f82fae75e3446d1685c03cf5bab0a51c303194ea1c77f0cd108870a5`
- `12-expired-status.jpg` — SHA-256 `529e9b1db32b11ad9eb06b8085d3482de7cbeb731e7b0b6885c10b2c9a7a2ee9`
- `13-billing-retry-status.jpg` — SHA-256 `d6bf80287346a63f865709669c4f2d5202a0f9eab8979656a30ad9d0376f6e61`
- `14-grace-period-status.jpg` — SHA-256 `fd299b08188b3b967d93a8496f76edca059942221d7701b870af1c7c99960c5c`
- `15-storefront-canada.jpg` — SHA-256 `efd1df9acf8e8c41c3f1a272b9dd94328fd9bc4296ce7b792edef9d68385f4bb`
- `16-ios-94-pass-1-skip-after-lifecycle.log` — SHA-256 `3660f0c27dab70f1fac262af52f3ac637fec308072b6f5d06df3dfda1945880c`
- `17-release-build-after-lifecycle.log` — SHA-256 `6ebb27ed5669c7492a62fd96017fedd0e94f62559a717217cea72891463d33c3`
- `18-xcode-26-6-ios-26-4-code3.log` — SHA-256 `f0baa4d4b8d2828ad0610e3f8cc2c038f7b510a4c1c48cce31dcd7036e976324`
- `19-xcode-26-6-ios-26-5-code3.log` — SHA-256 `5b5579dde160f8a0dc52a2fa0bf34e314364a915a55486a0f408f50196868820`
- `20-ios-26-6-runtime-unavailable.log` — SHA-256 `80a2e3a3c42af3b8401a05b4a1d27a9f2a93d2dad78544922d1f30bf84c4d40c`
- `21-ios-94-pass-1-skip-xcode-26-6.log` — SHA-256 `4ad58ea33a8f0b9b90d82fca72d2c22279d3cd322d2a8f695abb2f7c7ab76135`
- `22-release-build-xcode-26-6.log` — SHA-256 `4b15289de4532cb9ff8ff23b65f77164d5710328ea9659f6e8739a4cfb2c201a`
- `23-post-restore-local-auth.jpg` — SHA-256 `d2635c998884ab9abfa5240c7edcc91f9f0e5cbf26490c33cb2a513ee0b08de5`
- `24-restore-xcode-simulated-auth-prompt.jpg` — SHA-256 `25f4977cd4cabdb82f2c30fdd474151bc966f44132d5513ac9f68e4c4e449a57`
