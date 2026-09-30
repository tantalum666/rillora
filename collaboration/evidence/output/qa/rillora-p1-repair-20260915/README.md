# Rillora P1 repair QA

Status: UX01–06 implemented and synthetic-staging accepted; the local checkpoint below is historical.  
Started: 2026-09-15; last updated: 2026-09-16 (Asia/Hong_Kong).

The Owner requested immediate repair after the whole-app audit. This is the same continuous workflow: the prior66-file/18,108-line full-body reading record is reused with changed/new focal records recovered. The initial current inventory was68 files,57 unchanged. See [reading continuity](reading-continuity.json), [previous full read](../rillora-complete-ui-ux-audit-20260915/full-read-completion.json) and [current repair contract](../../../docs/p1-reliability-repair-20260915.md). No restart/full-reading claim is made for compactions. Source baselines and changed-file manifests are retained here; no commit/branch/stash was created.

## September16 deployed continuation

The pending deployment is complete, including a cloud-discovered import permission correction. API23 is healthy1/1;0043–0047, legal Sites4 and hosted proof are aligned.148 current API tests,36 HTTPS checks,25 legal checks and the authenticated functional/cleanup run pass. The current native build is installed normally. See [deployment acceptance](deployment-20260916/README.md). Earlier local-only/authentication-pending paragraphs below retain their original evidence boundary and are superseded for deployment state.

## Outcomes and actual evidence

| Finding | Implemented/observed | Evidence |
| --- | --- | --- |
| UX01 | Explicit audience choice; selected recipient projection; Never disclose/unselected matters/other people omitted; full owner backup separate | [Web parent preview](screens/web-parent-export-preview.png), [native friend preview](screens/native-friend-export-preview.jpg), [actual downloaded parent TXT](parent-guide.txt), API tests |
| UX02 | Error focus and retry visible at390×844 for400/409/503/offline; draft kept; refresh recovery; lost-response create deduplication and newer edit retained | [400](screens/web-save-400-mobile.png), [409](screens/web-save-409-mobile.png), [503](screens/web-save-503-mobile.png), [offline](screens/web-save-offline-mobile.png), [recovered draft](screens/web-draft-recovery.png), [retry result](screens/web-lost-response-recovered.png) |
| UX03 | Cold503 shows unavailable/Retry/Browse instead of guest homepage; Retry restores verified map | [failure](screens/web-service-failure.png); load-state QA script |
| UX04 | Saved records consistently labelled Draft/Needs review/Directions added; no Not added record status | Actual Web/native persisted records, unit checks |
| UX05 | Native Files save and both-client complete-backup reading; actual Web download/import; local plaintext/encrypted reader; archive/private restore; both-client deletion/status; real synthetic Auth0 deletion | [native reader](screens/native-backup-reader.jpg), [Web reads native file](screens/web-reads-native-backup.png), [import](screens/web-import-private.png), [guest reader](screens/web-public-copy-mobile.png), [decrypted copy](screens/web-encrypted-copy-opened.png), [archive restore](screens/web-archive-restored.png), [native deletion](screens/native-deletion-completed.jpg), [Web deletion](screens/web-deletion-completed.png), [provider verification](auth0-deletion-verification.json) |
| UX06 | Current tasks separated from Family planned core/later roadmap; removed rehearsal absent; prices and closed sales preserved | API/Web/native capability contract tests and source |

Synthetic A created bank/wallet/private-letter records and separate B/C grants. B accepted in Web and saw only its authorized directions. C accepted in actual native SwiftUI and saw the wallet's Details/Notes. B's later Web deletion ended its relationship while preserving A's map and C's independent connection. The imported D map used new IDs and had no live invitations/grants; native D deletion removed it and reset private navigation. No external email/link delivery occurred.

A native full map was saved through ShareLink → Files and physically read back as JSON, then opened in native and Web. The Web copy was actually downloaded and imported into an empty synthetic account. Encrypted parent package and matching synthetic recovery file were downloaded and opened locally in a signed-out Web reader; only the permitted matter was present. Saved copies are not evidence of delivery or remote revocability. Test recovery/deletion references are synthetic evidence, not live account credentials.

The actual lost-response test lets the first create reach the server, drops its response, changes Notes, and retries. Database readback found one record with the newer Notes. The409 recovery verifies the saved record and keeps newer local text before a subsequent explicit save. Archive/restore is now available on Web as well as native; restore leaves sharing off.

## Final checks

- API build/typecheck and **147/147 tests**: [test log](api-final-tests.log), [build](api-build-final.log). Includes privacy scope, stale grants, no cross-owner receipt lookup, backup/import, deduplicated create retries, missing-deletion-service rejection without mutation, transient deletion retries and minimal consent retention.
- Native **138 passed /0 failed /1 prior StoreKit skip** in `/tmp/rillora-p1-repair-final-tests-20260915.xcresult`. Actual device-bridge UI is native SwiftUI, not a browser approximation. The skip is not counted as paid-store verification.
- Web **68/68 app tests** and build: [tests](web-final-tests.log), [build](web-final-build.log). Known HPKE/browser external and bundle-size build warnings remain; they are not proof of a runtime crypto failure. Actual encrypted local reading succeeded.
- Legal-only build using synthetic factual inputs and **7/7 artifact checks**: [log](legal-build-tests.log). This is not publication of private operator details or the new policy.
- Hosted-consent contract **7/7**: [log](auth0-action-tests.log). The changed action has not been applied remotely.
- Infrastructure **16/16**, typecheck and synth: [tests](infra-tests-final.log), [typecheck](infra-typecheck.log), [synth](infra-synth.log). Dedicated secret injection stays disabled until configured; synthesis creates no AWS resource.
- Screenshot/mobile geometry checks, file content checks and database readbacks are separate from test-suite counts. Current responsive checks cover390px and desktop; full device/VoiceOver/AX5 release certification remains open.

Initial failures were investigated: one crypto fixture needed an explicit accepted sharing audience under the new contract; an API fixture count changed after adding the deduplication test; initial custom test-DB overrides were correctly refused by the existing safety guards; an app build was initially checked with legal-only artifact assertions, then the correct app/legal suites were run separately. Old logs remain with their real outcomes. The Playwright MCP transport terminated during download validation; a separate named official Playwright CLI session completed actual downloads/readers/negative paths. Failed automation locators were corrected against fresh UI snapshots, not counted as passed actions.

## Remote state and cleanup

Auth0 CLI reauthorization was completed by the Owner. A dedicated `Rillora Account Deletion Service` was created with only `delete:users`; its secret is protected in `.local-secrets/account-deletion/`, mode0600. A newly created disposable Auth0 database user was deleted through the new processor; an independent provider read returned not found and the local private map was gone. This does not prove Apple upstream revocation or real-customer deletion.

No P1 API, client or new legal/hosted-proof release has been deployed. AWS STS reported expiry. Cached browser sessions returned400; a fresh IAM form was reached, but the unattended authorization expired before the Owner completed it. A new remote authorization is prepared at handoff; current transient CLI/tab IDs are in [work state](work-state.json), not a reusable login URL. No permanent AWS credential or weakened MFA was introduced.

The simulator was restored from the exact pre-repair native source in an isolated temporary copy, built and launched against the current cloud with no actor/font/motion overrides. The repaired source and its final build remain in the project/normal DerivedData. This prevents installing a new legal proof against the old cloud contract. Root XcodeBuildMCP defaults are restored to the real project. The temporary clone's copied build caches were removed; no project source was rolled back.

Owned local ports and the named test browser are closed after final recording; remaining synthetic connection capabilities are revoked. Generated simulator backup file is removed after retaining the QA copy. Existing unrelated services/tasks, Owner Keychain entries and real user records remain untouched. See [cleanup](cleanup.json) for actual final checks.

## Documentation closure

Updated: repair contract, account/matter, export, public legal/Chinese reference supplement, monetization, single-operator/portability, platform contract, quality gates, AWS runbook, product gateway and audit statuses. New factual privacy/storage version and corresponding client/hosted digest are prepared together; Terms/electronic-consent wording and past acceptance records are preserved. The decision log and journey append the authorized repair, observed failures, concrete results and remaining deployment step. Current handoff has one next step; the superseded audit handoff is [HISTORICAL](../../../docs/handoff-history-20260915-p1-start.md).

This closes local acceptance for UX01–06, not all22 audit groups. UX07–22, numerical allowance/paid cutoff/cancel/restore, real provider signup-return, Apple upstream revocation ceremony, physical-device VoiceOver, real delivery and sales remain outside this completion claim.
