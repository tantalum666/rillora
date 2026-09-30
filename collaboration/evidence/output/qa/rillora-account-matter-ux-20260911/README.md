# Rillora account, invitations and matter entry — QA

Completed: 2026-09-11, Asia/Hong_Kong. Source, local runtime and the existing **synthetic staging** were verified. No public production, real payment, personal Rillora login completion or zero-latency claim.

## Owner request and reading gate

Use Sign in / Sign up; guests can open received invitations but cannot create/send them; new recipients register and return to accept. Remove the Opening Rillora interstitial and Profile simulation/filler. Combine Details / Directions / People; require useful locators; show category-specific fields including crypto exchange/on-chain/network/address and Notes last.

The new workflow read **62 owned Markdown files / 18,731 lines / 2,267,034 bytes**, including nested instructions and history. Excluded dependencies, caches, build output, third-party packages and generated evidence. No implementation changed before completion at **13:57:32 +08:00**. Full ranges/hashes and truncation recovery are in [inventory](reading-inventory.json), [chunks](read-chunks.json) and [completion](full-read-completion.json). The authored contract/history additions follow that read. Compression recovery reused the ledger, not a new scan.

## Implemented and exercised

- Public native Profile uses the same Sign in / Sign up action after expiry. Only a received-invitation entry is offered to guests; protected contact/invitation creation rejects anonymous requests.
- Invitation primary action opens hosted **Create your account**; an existing-account sign-in action remains. Actual iOS hosted signup entry (Google/Apple visible), cancel and return to the same resolved invitation were observed. One added integration case provisions a new synthetic recipient via a mocked OIDC provider, returns to the protected invitation route, confirms it is still pending, then explicitly accepts with the bound session/verified email. No public account lookup or email merge.
- Native verified session exchange carries its initial map. Client checks matching planner and persists the token before publishing it; missing initial data uses `/v1/overview`. The unit case proves no extra overview fetch when the exchange supplied it. Web also uses the aggregate core endpoint and loads checks/activity/commerce later. Necessary identity, legal and session validation remain intact.
- One continuous editor on Web/native. Name/category plus institution/provider for account/asset/debt/subscription, location for document/device, exchange for exchange custody, network/public address for on-chain custody. Outcome/contact choice and Notes are optional. Per-field markers and disabled Save are visible; server validates create, merged optimistic PATCH and approved maintenance changes.
- Type/custody changes preserve local drafts and submit only applicable fields. The final follow-up also omits hidden generic account/value/currency fields and skips their invisible validation; native/Web regression cases cover this, and the final Web-only publication preserves API20. Notes are capped at2,000 characters. Actual Crypto plus Notes create/save/reopen passed on both clients; a Web document also saved successfully while secondary plan/activity calls were deliberately failed.
- Profile removes consumer Simulation, role-disclosure rehearsal, motivation and duplicate setup. It retains real contacts/sharing, shared reviews, plan access, export, provider instructions, privacy/About and session controls as rows. Internal nonoperative engine/tests remain.
- New typed fields/Notes are explicit Details-level only. B/C separation, name/directions exclusion, downgrade and a future unknown database JSON key are tested. Minimum export/audit do not receive wallet contents. Test invitation had no grants, was never sent and was revoked after QA.

## Automated checks

| Check | Result | Evidence |
| --- | --- | --- |
| API full suite after0042/maintenance validation | 136 passed | [log](api-tests.log) |
| New-recipient signup → return → explicit acceptance | 1 passed,48 unselected by filter | [focused log](signup-return-test.log) |
| API typecheck/build | Pass | [typecheck](api-typecheck.log), successful build command |
| Native Xcode26.6 / iOS26.5 tests | 133 passed,0 failed,1 existing StoreKit skip | `/tmp/rillora-account-matter-ux-tests-final-20260911.xcresult` |
| Web application tests | 58 passed | [log](web-app-tests.log) |
| Web application build | Pass; pre-existing HPKE/externalization and bundle-size warnings | [log](web-build.log) |
| Staging HTTPS, auth-required routes, headers and exact published JS/CSS/HTML | 30/30 passed | [results](aws-http-verification.json) |
| Cloud migration names/checksums |0040–0042 match source | [readback](cloud-schema-checksums.json) |

Initial API failures were three legacy fixtures that lacked the new required locator; fixtures were made meaningful. The first generic Web glob incorrectly ran legal-artifact tests against an **app** build;61 passed/3 failed in that mixed-mode run. The58 app tests pass under the correct target. Legal source/publication was unchanged, so no new legal deployment or legal-mode validation is claimed. The signup case initially omitted the existing fake Apple verifier and raised a test setup error; after supplying the same bounded test dependencies it passed cleanly. None of these failed attempts is presented as a production defect or a passing checkpoint.

## Rendered UI checks

The flow under test was: public/expired Profile → received invitation → hosted signup/cancel; authenticated Matters → new category form → required gating → save → reopen. Profile actions were inspected across the scroll range. Web was checked at1440×1000 and390×844; native used Rillora-Matrix-17-Pro (EA356940-5220-4AA8-89CF-499C6D5D14E4), standard size and AX5 with Reduce Motion.

| Rendered check | Result |
| --- | --- |
| Page identity, meaningful content, no framework overlay | Pass on local app and staging public entry |
| Fields, required state, save/reload, preserved custody draft | Pass in actual native/Web UI |
| Long wallet address | Native wraps; Web was corrected from single-line clipping to textarea |
| Mobile page horizontal overflow | None in checked390px state |
| AX5 category/custody pickers and fields | Readable native vertical flow; offscreen categories remain scrollable |
| Registration cancellation | Actual hosted signup closes back to the same invitation |
| Console | Fresh local reload has no app errors;3 temporary connection-refused messages occurred during API hot restart; deliberate secondary failures were503; staging guest overview401 is expected and handled |

The Browser skill/plugin was not listed. Regular Playwright MCP and XcodeBuildMCP were used; CUA closed the native hosted sheet because that Web view was not represented in the Xcode runtime targets. Playwright denied a `/tmp` screenshot destination; the authorized project QA directory was used instead. This did not change browser/security protections.

Useful images: [before editor](ios-editor-before.jpg), [native wallet](ios-wallet.jpg), [native Profile](ios-profile.jpg), [normal cloud Profile](ios-normal-profile.jpg), [AX5 fields](ios-wallet-ax5-fields.jpg), [hosted signup](ios-invitation-signup.jpg), [cancel back to invitation](ios-invitation-return.jpg), [Web desktop](web-wallet-desktop.png), [Web mobile wrap](web-wallet-mobile.png), [Web invitation](web-guest-invitation.png), [staging guest](staging-public-mobile.png). Local private examples carry QA identities; they are not Owner data or an external user study.

## Cloud and AWS login

[Reviewed diff](staging-diff.log) changed existing API/migration image assets, Web bundle and temporary desired count. Phase0 andphase1 commands both exited0. Migration task revision15 exited0, CloudFormation is UPDATE_COMPLETE, API revision20 is ACTIVE with desired/running1/1, pending0 and rollout COMPLETED. [Final state](staging-after.json), [migration result](migration-status.json), [migration log](staging-migration.log). Independent read-only task also exited0 and returned the exact current schema checksums. No new independent Operations stack, persistent access key, private-data store or production environment was created.

The Owner reported Chrome `ERR_BLOCKED_BY_CLIENT` at127.0.0.1 after password/MFA. The waiting same-device CLI nevertheless finished successfully, and STS confirmed `rillora-operator` in account133857166372. The unused `--remote` attempt was cancelled before any browser ceremony. Always inspect CLI completion/STS before requesting another login. [AWS's current documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html) describes automatic refresh up to12hours and remote-code flow if localhost callbacks genuinely cannot finish. The exact extension/client cause of the screenshot was not established. No MFA, browser protection or permissions were weakened.

Existing flags: development auth **off**; Stripe test **on**; maintenance synthetic preview **on**; Apple Sandbox **off**; ordinary sales/entitlement mutation and real sensitive data **closed**.0040's68/7.99 prices are deployed but disabled; this does not update provider prices or prove customer demand. Ordinary Simulator Debug was restored with the cloud API URL and an empty development planner setting, with no test presentation overrides. The original Keychain was not overwritten by the volatile local QA actor.

## Documentation closeout

[Focused contract](../../../docs/account-matter-ux.md), product routing, authentication, interaction, DESIGN, platform, backend, sharing, family maintenance, iOS matrix, export/trust/security boundaries, pricing/operations/infra and root/Web entry instructions were synchronized. New Owner decisions/supersession justified appending the [decision log](../../../docs/decision-log.md) and [journey](../../../docs/journey/PROJECT_JOURNEY.md). The [current handoff](../../../docs/handoff.md) has one next step; the earlier handoff was preserved as [HISTORICAL](../../../docs/handoff-history-20260911.md). [Closeout checks](closeout-checks.json) record modified Markdown, link validation, final source hashes and dates.

Remaining boundaries: no fresh personal Rillora signup/login timing, physical-device matrix, new personal Apple/Google identity completion, real invitation delivery or paid production launch. The deferred commercial cutoff/atomic-allowance/cancel/restore work remains the single next implementation item. Do not restart a completed full read, test/deploy cycle or Owner authentication merely because context was compressed.
