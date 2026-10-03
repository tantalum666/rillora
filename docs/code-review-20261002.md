# Strict whole-project code review — October2

Role: current whole-project review, repair and validation contract
Status: COMPLETE REVIEW;CI47PASS;API/WEB/WWW REPAIRS DEPLOYED OCTOBER3;NATIVE3UPLOADED
Last updated: 2026-10-03 (Asia/Shanghai)

Owner explicitly requests every project code file to be reviewed very carefully and
confirmed problems repaired directly. Keep the existing UI, pricing, real data,
FanPass and deferred personal/platform steps. This is a new review of active source;
historical implementation mirrors and the old Dot report are dated references.

## October3 rollout update

The production-related repairs and0092/0093are now deployed asAPI11/schema0093 and
restricted Web/WWW. New signed native1.0(3) is uploaded/processed; encryption
declaration is saved after Owner confirmation and Apple showsReady to Submit. [Actual rollout evidence](review-rollout-20261003.md) supersedes
the pre-rollout local-only statements below. Tool/prototype repairs remain source
artifacts; no physical-device or real transaction result is claimed.

## Scope and evidence

The full startup read covers184owned Markdown files/31665lines/2832637characters,
completed at2026-10-02T13:19:26Z with no gaps or changed hashes. The initial active
engineering inventory has672text files/89870lines and6separate lockfiles. Include
API, effective SQL after all migrations, Web, native iOS, prototype, infrastructure,
configuration, release/operations/artifact tools and tests. Separate generated project
files, dependency metadata, binary assets and historical copies from active logic.

The QA ledger tracks exact body ranges and changed-file hashes. A listed file is not
claimed reviewed until its body and relevant contracts have been checked. Test doubles
must exercise the actual normalizers and storage boundaries where possible; green old
CI is not new regression evidence. Never run fixtures against real accounts/databases.

## Confirmed repairs

| ID | Priority | Defect and fix | Current validation |
| --- | --- | --- | --- |
| R01 | P2 | C0 characters bypassed relative login-return checks and URL parsing produced a foreign origin. Reject controls and parsed foreign origin; recheck persisted transactions before issuing a session. | Three start cases and one persisted-callback case fail before;8focused HTTP/DB checks pass after. |
| R02 | P1 | A rejected OIDC discovery promise was cached for the process lifetime. Clear failed lookup only; preserve concurrent sharing and successful caching. | New failure/recovery test fails before; discovery and signed-proof checks3pass after. |
| R03 | P2 | pg accepts ssl URL parameters after explicit TLS settings, allowing certificate verification or TLS to be disabled despite verify-full. Reject ssl alongside existing SSL override keys. | Actual constructor demonstrates override;4negative cases fail before;28new/existing configuration checks pass after. |
| R04 | P1 | Financial routing replaced a Dispute ID with a Charge ID before a second locked dispute query. Retain the original signed event for that query. | Actual resolver fails before;27ledger/adapter checks pass after, including dispute changes, revoke/won recovery and duplicate handling. |
| R05 | P1 | Legacy SQL COMMIT ended the runner transaction before checksum recording and released its lock. Strip only outer wrappers during execution, retain original hashes and reject other transaction controls. | Two actual rollback/concurrency cases fail before;18migration/lexer/bootstrap checks pass after. |
| R06 | P1 | Runtime bootstrap accepted BYPASSRLS/REPLICATION or extra privileged memberships. Check attributes and allow only the four application roles, including indirect memberships. | Six unsafe-role cases fail before;8role checks pass after. No live role changed. |
| R07 | P1 | Latest grant level lost permanent saved-copy redaction and remove/regrant lineage during old-backup replay. New0092journal facts carry IDs, allowed field names and revoked-review bounds; ambiguous legacy updates require reconciliation. | Actual pg_dump/pg_restore fails before; constrained replay now preserves redaction and unaffected recipient, and refuses ambiguous legacy history. |
| R08 | P1 | Cleanup could delete a record while an administrator was recording its retention hold. Serialize both paths before their database reads;0093adds only required identifier lookup privileges. | Actual concurrent barrier fails before;9retention checks pass, including all five categories under a non-superuser role. |
| R09 | P2 | Transport limits rejected maximum ciphertext and valid near2MiB backups; oversized requests returned500. Separate authenticated file limits, count backup independently, accept matching JSON subtypes and return413. Web pretty-printing could then inflate a valid2MiB download above its own read limit; keep compact exact JSON and check its UTF-8 byte length. | 65536-byte ciphertext and2097136-byte actual backup round trips pass; oversized artifact/ordinary request rejection passes. Web actual Blob/read round trip passes at2097152bytes. |
| R10 | P2 | Recipient-specific guide used current content even when the recipient had only an older saved projection or permanently redacted fields. Reuse existing live/saved/paused access projection. | Two negative cases reproduced;28sharing/P1checks pass; full API run also verifies encrypted saved-title resolution. Personal export remains current and Free. |
| R11 | P2 | Billing lookup and deletion were separate transactions and omitted pending purchases. Share purchase/reconciliation locks, check and delete atomically, expose pending billing to both existing client confirmation controls. | Concurrent checkout previously led to200deletion without billing acknowledgement; now400and account retained.14P1checks pass. Actual Web and isolated native UI both show the newly required unchecked billing acknowledgement after server rejection; delete remains disabled and the test account is retained. Native model/reader3tests pass. |
| R12 | P2 | Several mutation fixtures relied on a database-name suffix while inheriting connection host/user defaults. Normalize every fixture URL and verify database identity before migrations or cleanup. | Pure constructor reproduces ambient remote host selection without connecting; existing negative guard checks and all affected suites pass in399-test API run. |
| R13 | P2 | Counts and synthetic rehearsal completion could set verifiedEmergencyPlan=true. Keep the compatibility field false and centralize the duplicated readiness query. | Synthetic completion fails before;6focused checks pass after, including overview/standalone agreement. No real verification is claimed. |
| R14 | P2 | Shared-review drafts did not reach the browser navigation guard; passive notification also left a fast-back timing gap. Connect dirty/busy state and synchronize form guards before paint. | Cadence draft disappears before;13browser checks pass across desktop/mobile, including immediate Back and keep/discard. |
| R15 | P2 | Repeated Back while the leave dialog was open lost the actual history destination, so Keep editing left URL and screen inconsistent. Track the latest destination/rollback and cancel obsolete confirmation on Forward. | Actual repeated-back mismatch reproduced; the13navigation checks include rollback, forward and obsolete-dialog dismissal. |
| R16 | P2 | Earlier slow file reads could replace a newer saved copy or resurrect it after Close. Bound open/unlock/error/close by one selection generation and reject malformed records. | Both deferred-file cases fail before and pass through the actual React file input after. No file is imported into a real account. |
| R17 | P2 | Printable download returned its private Blob after the client had already detected an account change during body reading. Recheck identity before returning the artifact. | Deferred Blob regression fails before;27API-client/saved-copy checks pass after. |
| R18 | P2 | A cancelled old-account start could reset the new account's Apple purchase coordinator after its status request completed late. Add a separate account-lifecycle revision and cancellation checks before starting observers. | Deferred native regression fails before by clearing the new environment;31related commerce/store/coordinator tests pass after. |
| R19 | P2 | Contact, matter and role editors admitted overlapping create/save/reload/archive/revoke operations despite disabled buttons. Guard each editor's operations with its existing busy state. | Deferred transport tests reproduce duplicate creates/callbacks and overwritten saving state;26editor tests pass after. Normal retry after a failed request remains supported. |
| R20 | P2 | A successful role write followed by a failed list refresh was reported as an unsaved mutation and its acknowledged result discarded. Apply the confirmed result, retain creation/update/revocation through refresh failure and provide a retry. | Acknowledged-create/read-outage case fails before;26editor tests include creation, revocation and successful later reload. This is an app role record, not external authority. |

| R21 | P3 | Historical prototype Carousel left click suppression latched after pointer cancellation, swallowing the next tap. Reset stale suppression on a fresh pointer; restore the missing first-party favicon. | Real Chromium cancellation/tap case fails before;10browser interaction tests and4packaging tests pass. Protected runtime hashes changed only for the verified Carousel repair. |
| R22 | P2 | Public publication manifest bound HTML only, accepting changed/extra/missing scripts. Manifestv3 and shared file-tree verifier bind all uploaded files, reject symlinks/nonfiles and validate paths. | Three negative mutations fail before;12focused and53full infrastructure checks, typecheck and actual public build pass. |
| R23 | P2 | Auth0 preparation treated incomplete inventory/read errors as absence, risked orphaned protected credentials and could disable already active clients on rerun. Fail closed for each case; create a theme only after confirmed404. | Five negative provider/CLI scenarios fail before;5guard tests pass after, with all real provider calls intercepted. |
| R24 | P2 | Native matrix runner reused and shut down existing named simulators, potentially disturbing an Owner session. Create unique devices and delete only recorded per-run IDs. | Successful and failed runner scenarios fail before and pass with mocked xcrun/xcodebuild; no actual five-device matrix run is claimed. |
| R25 | P2 | Recovery CLI replayed uncertain ECS requests indefinitely without reconstructing parameters or rechecking isolation/freeze. Bound retries to55minutes, match the exact saved request/token and recheck current safety facts. |8mocked AWS positive/negative checks pass, including expired/future retry, changed scope/commands, running source and stale freeze. No cloud task launched. |
| R26 | P3 | Health configuration coerced missing/boolean target IDs and accepted primitive headers. Require explicit string IDs and an object of headers. |9health checks pass; no live monitor configuration changed. |
| R27 | P2 | DNS write verification checked value/TTL but ignored MX priority and CAA flag/tag. Verify all requested typed attributes and the exact added record. |10mocked CLI guards pass, including wrong-priority/flag/tag rejection; no DNS writes. |
| R28 | P2 | Old prototype build dependencies retained known-vulnerable PostCSS/nanoid. Update only compatible locked versions to8.5.28/3.3.19. | Build,10browser/4packaging checks and a zero-known-advisory npm lock audit pass. No shipping runtime dependency was changed. |

Counts above are scoped runs and can overlap future full suites. They are not a sum
of independent release checks. R03 is a configuration-validation defect; no evidence
claims the deployed database was using the unsafe URL form. The R04 test's first
placement mistake is retained as a harness result, excluded from reproduction proof.
The R09 test originally sent a large unauthenticated body while the server immediately
rejected it, causing a transport-dependent ECONNRESET; that auth assertion now uses a
small body. The actual authenticated large-file regression remains intact. API typecheck
passes after the second repair batch. The later whole-suite results below cover the final relevant source; no deployment is claimed.

The subsequent first full API regression passes48files/399tests in38.34seconds
(`api-full-first.log`), including R01–R12. R13was added afterward and passes its
six focused checks (`readiness-after.log`); do not call the399run validation of R13.
Later Web internal build and115tests pass, as do the public build and legal-only
fixture's7tests. These are separately packaged local artifacts with environment-file
loading disabled. The internal bundle still reports Vite's existing500kB chunk warning;
no performance claim or warning-threshold change is inferred. Native AccountDataTests
passes3checks. The first UI test build was unsigned and could not save its deletion
reference to Keychain; a local ad-hoc simulator signature resolved that harness issue,
after which the real pending-purchase rejection UI passed. Only the task-created
simulator was used. This was an intermediate checkpoint; final coverage and regression are recorded below.

The final API typecheck/build and48files/400tests now pass in38.91seconds, covering
R13as well as earlier API repairs. Native account-lifecycle31checks and editor26checks
pass. The UI test runner's mutation endpoint override now also rejects remote origins,
credentials and query/fragment components before test setup; its pure URL guard test
passes ten accepted/rejected cases without a network request. The complete native unit
run passes190tests with1existing iOS26.5 StoreKitTest runtime skip. An apparent invitation-email retry issue was rejected after tracing
the existing accept endpoint's provider-proof refresh; no unnecessary client change
was made for that candidate.

At the review checkpoint, migrations0092/0093were local and production was0091; the October3rollout above now records their application. Existing
applied SQL bytes remain unchanged. Recovery rejects a pending legacy accepted-connection
update whose intermediate restrictions cannot be proved; it does not globally revoke
unaffected connections or claim that historical journal metadata contains missing facts.

[Stripe's official Dispute API](https://docs.stripe.com/api/disputes/retrieve) distinguishes
the dispute identifier from its separate charge reference. The connector's public-doc
search required reauthentication, so public official pages were read without changing
any account or asking for unnecessary provider access.

## Security plugin limitation

Daybreak advisory returned granted / Daybreak Blue. The one coordinator invocation
failed before any scan began with:

> Deep Scan cannot safely start a read-only worker: the parent must provide a managed filesystem permission profile.

No scan ID or canonical report exists. Its workflow forbids starting a replacement
scan after this failure. Continue the Owner-authorized direct source/correctness review;
do not label it as a completed Codex Security deep scan or independent certification.

## Final coverage and validation

All original active code bodies were read by2026-10-02T18:18:29Z. Including new
helpers/tests and reviewed final config changes, the engineering ledger covers
**686files/91738lines** with no missing ranges or hash drift. This is first-party
API/SQL, Web, native Swift, browser prototype, infrastructure, tools, tests and
configuration. It does not pretend dependency code, binary artwork, generated
projects or historical duplicate mirrors are active first-party source. All184
startup Markdown bodies were read before implementation; newly authored contracts
and changed relevant documents were reviewed afterward.

Six dependency lockfiles/781entries were structurally checked for declaration
agreement, immutable versions/revisions, safe source URLs and package integrity.
The Swift lock body was also read in full. All91previously applied SQL files remain
byte-identical to the baseline;0092/0093are additive. Exact ranges, hashes, exclusions
and checks are in the QA ledger, independently from test coverage.

| Surface | Final local evidence |
| --- | --- |
| API/database | Typecheck/build;48files/400tests pass, including actual PostgreSQL rollback, concurrent operations and old-backup permission replay. |
| Shipping Web | Internal build/115tests; public build; legal fixture/7tests; closed-production fixture build with synthetic legal values. |
| Browser regressions |13navigation checks at desktop/mobile widths;2deferred-file-input races; real late-billing400confirmation behavior. Guard callsites are reviewed; not every form is separately rendered. |
| Native |190unit tests pass,0fail,1existing iOS26.5StoreKitTest runtime skip. Targeted commerce/editor tests overlap this total. Actual task-only simulator deletion/pending-purchase rejection UI passes. |
| Infrastructure | Typecheck and7files/53tests; full artifact inventory/hash mutation checks and built public manifest verification. |
| Historical prototype | TypeScript/build,10Chromium interaction tests,4packaging tests and fresh render with0console/page errors. |
| Operations/tools |34release,5Auth0,10GoDaddy,8collaboration Python tests;28Node operations/hosted/review/snapshot tests. The matrix/recovery/provider tests intercept external operations. |

Numbers are separate suite results, not a claimed sum of unique tests. Earlier
failed assertions, harness limitations and corrected attempts remain in the same
QA package. No real authentication, email, purchase, device, DNS or AWS mutation
was needed. The task-only simulator is shut down and the original Xcode profile
restored without operating on the Owner's live simulator session.

## Remaining dependency and verification limits

One build-tool dependency remains upstream-bound: aws-cdk-lib2.266.0 bundles
brace-expansion5.0.9. The actually installed/audited latest2.272.0 still contains the
same version, so the ineffective upgrade was reverted. npm cannot replace that
bundled copy via ordinary audit fix. The advisory is not suppressed or relabelled
clean: infra has1high affected package; API, shipping Web, patched prototype and
snapshot-retention have0reported npm advisories at this check. This is not an audit
of every Swift dependency or proof of no unknown vulnerabilities.

The CDK package runs only in development/synthesis against repository-owned inputs
and is absent from the API container. No untrusted-input exploit was established.
Use a patched upstream bundle when available and revalidate synth; introducing a
bespoke vendored or postinstall library rewrite would add a new supply-chain burden.
[Maintainer's patched brace release](https://github.com/juliangruber/brace-expansion/releases/tag/v5.0.12),
[PostCSS fix](https://github.com/postcss/postcss/releases/tag/8.5.23) and
[nanoid fix](https://github.com/ai/nanoid/releases/tag/3.3.18) establish patch availability;
the retained installation/audit receipts establish the actual project versions.

The existing StoreKit runtime skip, failed optional deep-scan startup and unperformed
real provider/device journeys remain explicit. Source review does not certify an
absence of all possible bugs, independent security assurance or launch readiness.

## Git and deployment boundary

The work is on `codex/strict-review-20261002`, based on
`3a5739ea87c022b390a39e05bebe4e0b1f17035a`. Source, focused contracts, tests and eligible
QA/build originals are saved under the existing all-work preservation contract.
Remote/CI receipts are recorded separately in the [strict-review addendum](../collaboration/verification/strict-review-20261003/README.md).
At the pre-rollout checkpoint no new review fix was deployed; then-retained API10/schema0091 and internal
TestFlight1.0(2) do not validate this source. Public customer/live billing gates stay
closed, and existing UI/pricing/real data/FanPass and personal deferrals are retained.

[QA directory](../output/qa/rillora-strict-review-20261002/),
[reading completion](../output/qa/rillora-strict-review-20261002/full-read-completion.json),
[code coverage](../output/qa/rillora-strict-review-20261002/code-review.json),
[observations](../output/qa/rillora-strict-review-20261002/review-observations.json),
[dependency structure](../output/qa/rillora-strict-review-20261002/dependency-structure.json).

CI45 on8f1adcc passed API and Web/infrastructure but failed the source job because
the shell fixture exited before its intercepted provider call. The hosted runner
now explicitly installs jq/ripgrep/zsh/SHA utilities, the test surfaces preflight
stderr and a positive404creation test passes locally. Matrix cases run on Linux
when zsh is present; the initial two skipped cases are not called remotely passed.
The follow-up source ledger records this small CI/test change separately from the
immutable captured ledger. New CI outcome is retained in the collaboration addendum.

CI46 then passed all57Python tool checks and the source secret scan, plus API and
Web/infrastructure. Publication coverage correctly failed because30redacted browser/
result reference files inherited global cache/result ignore patterns. The original
bytes were already in remotely verified raw-work-012. Those exact scanned references
are explicitly tracked; no broad ignore exemption or guard suppression is used.
Index-to-manifest equality is now checked before the follow-up push.

The final [CI47](https://github.com/tantalum666/rillora/actions/runs/37056754027)
passes source/API/Web-infrastructure at ef09d0b22f7586cf4e60d3039f986b6fe6c19d02.
The new archive was freshly fetched/decrypted:934objects/1,433paths verified.
[Final source ledger](../collaboration/verification/strict-review-20261003/final-code-review.json)
includes the CI fixture follow-up; no unread ranges or changed reviewed hashes remain.
The final documentation/receipt commit leaves tested engineering bytes unchanged
and has its own local link/index/secret checks. Review is complete; the subsequent rollout is recorded in the October3update above.
