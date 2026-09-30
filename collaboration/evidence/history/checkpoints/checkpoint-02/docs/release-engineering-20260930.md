# Independent release engineering — September30

Role: current implementation, operating limits and release evidence
Status: RESTRICTED REVIEW RUNTIME VERIFIED; OWNER/PROVIDER RELEASE GATES OPEN; CUSTOMER SALES CLOSED
Last updated: 2026-09-30 (Asia/Hong_Kong)

Owner asks to finish every prelaunch task that does not need their participation or
confirmation, excluding the existing AWS reply wait. This narrows the active work;
it does not withdraw existing implementation/provider authority. Preserve the UI,
full03mark, Free1/Family5, WebUS$88.99annual-only, conditional Apple channel prices,
real records, historical receipts and FanPass. This increment changes only required
security/operational behavior and preparation artifacts.

[Current QA ledger](../output/qa/rillora-launch-resume-20260930/work-state.json) records
165owned Markdown files/29,003lines read in full, completed00:54:18+08. Retain that
ledger across context compression. The older resume entry is a checkpoint, not an
instruction to repeat completed tests, provider applications, deployments or login.

## Later September30 quality correction

The Owner-supplied Dot review reopened independent engineering. The counts and API7/
schema0091receipts below retain their original dates and scope; they do not validate
new fixes. Current repairs, failures and replacement-artifact gates are tracked in
[the review contract](code-review-repair-20260930.md) and[current handoff](handoff.md).

## Restricted production review

The API and a separate Auth0 Post Login Action admit one explicitly prepared,
synthetic identity by SHA256 of exact issuer plus subject. Access expires at
2026-10-06T17:08:57Z. Existing browser/native sessions also check the allowlist and
expiry on every request. This is not public account activation. Live Apple/Stripe,
developer authentication and the old diagnostic Sandbox runtime remain disabled.

The CLI lacks create:connections. The existing database connection is reused with
unchanged options/Preview clients; only the new production clients are added after
the restrictive Action is published/read back. Existing hosted legal clickwrap is
retained. The synthetic address is not falsely marked verified and no email is sent.
Credentials stay in ignored0700/0600storage. Its actual login, affirmative legal
acceptance and Rillora validation enrollment remain an Owner-interaction gate.

Actual Apple prices remainUSAUSD68/CAD99. The review-only6800Sandbox binding and
test-onlyUSAroute preserve previous SKU/price history, Web8899and the original
closed live route. A rolled-back duplicate-SKU attempt exposed a catalog lookup
that incorrectly equated the retained SKU price with a newer versioned binding;
the lookup now uses the immutable binding, matching the production query.

The exact existing IAP credential and production Web credential were installed in
separate stack-owned vaults, with AWSCURRENT version receipts. No rotation occurred.
Schema0071–0091 is applied and91checksums match. Acceptance used the actual runtime
login over verified TLS; ordinary production planners remained0, salesfalse and
review quote6800. Initial inspection used the NOINHERIT login without entering its
normal role and was denied; the corrected probe uses withAuthDatabase exactly as
the app does. Both attempts are retained; no database permission was broadened to
make the faulty probe pass.

## Identity services and recent authentication

Production deletion and email-status verification use new, separate M2M clients,
with exactly delete:users and read:users respectively. Their protected credentials
are installed in exact production vaults. Actual token scopes and86400secondTTL
were read back; the verification service read only the prepared synthetic identity.
A newly created disposable Auth0 identity was deleted by the production adapter
and a subsequent provider read returned404. No real Rillora account was deleted,
no email was sent and no end-user deletion journey is inferred.

A trailing-slash mismatch between the stored issuer and the configured allowed
issuer was repaired without accepting another issuer. Existing Preview credentials
remain intact. Before general customer access, retire the old tenant-wide test M2M
grants and let already-issued tokens expire for the measured86400seconds plus
clock skew. A separate production client does not revoke those existing powers.

Recent authentication is required in the production review runtime for map backup
export/import, printable or encrypted Start Here preparation, account deletion,
new/regenerated invitations, resuming live access, increasing shared fields/matters
and adding/replacing a collaborator. Shrinking scopes, pausing and revoking access
remain available with the ordinary valid session. This is the existing security
release requirement, not a new paid feature or a claim of forced MFA.

Only a verified auth_time is used; token iat is no longer treated as proof of a
recent login. Missing/invalid/future proof cannot satisfy the ten-minute window.
Native exchange verifies the optional ID token's signature, issuer, client,
subject and access-token hash when present. Reauthentication keeps the same opaque
session and refuses another account. Web uses a CSRF-protected, short-lived OAuth
transaction bound to the original account and browser session, fresh PKCE/state/
nonce, max_age0and prompt=login. Its independent poll capability is not the
HTTP-only OAuth transaction cookie. Failure/cancellation cannot provision another
account or silently replace the original identity.

Both clients retain the editor during verification and ask the user to repeat the
original action. They never automatically retry a sensitive mutation. Actual local
Web/iPhone checks changed a synthetic sharing selection to Details, received403,
cancelled the prompt, and retained the draft while database grants stayed Directions.
Provider login itself is still unverified in this increment. Auth0 also cautions
that federation can confirm an upstream exchange without guaranteeing password
re-entry at the upstream provider; do not market this as phishing-resistant MFA.
[Auth0 reauthentication semantics](https://auth0.com/docs/authenticate/login/max-age-reauthentication).

## Bounded retention and snapshot retirement

Migration0087 is immutable after its production application. Its security-definer
function is owned by a NOLOGIN service role that the runtime cannot assume; the
runtime can execute the bounded function only. Each pass handles at most200rows per
category, with a5second statement budget and a non-overlapping15minute worker.
Published windows cover expired authentication/handoff records,90day product events,
12month audits,7year unlinked legal/closed-payment records,30day completed minimized
deletion receipts and90day released-hold metadata. Active accounts and private maps
are never deleted for inactivity. Runtime acceptance removed0records. The15minute worker is active and its three
enabled alarms readOK after an actual successful production heartbeat.

0088 gives legal/security retention reasons independent composite keys. Active
holds cannot be deleted, and releasing one reason cannot release another. Minimal
hold/release facts are independently journaled; active holds have no journal TTL.
Replay preserves holds and identifiers idempotently. Operator tools are bounded
maintenance commands, not new public HTTP endpoints.

One manual staging snapshot predates application-layer encryption. Its exact ARN,
source and creation time are pinned in config/manual-snapshot-retention.json; its
90day deadline is2026-12-21T16:13:05.877Z. A12hour worker retains it until due, respects
holds, checks fresh encrypted source backups and only requests deletion of that
exact snapshot. IAM independently enforces the deadline and tags. Unknown hold
values stop deletion. The current cloud invocation reports retained_until_due,
failures0,overdue0,deletionRequested0. No snapshot has been deleted. Requesting an
asynchronous deletion and confirming its absence remain separate results.

## Recovery and current commerce state

0089 captures only bounded commerce references when marking post-snapshot access
unreconciled: account/provider/environment/subscription/customer/market/plan and
acquisition references. It contains no private map, invoice body or credential.
Legacy empty markers and unbounded/manual access never auto-clear.

The new recovery command requires an isolated verified-TLS clone, a current journal
checkpoint, known existing owner, bounded current provider reads and a frozen source
runtime verified from ECS. It never stops the source automatically. Privacy replay
precedes commerce; the journal is checked again before completion. Apple uses
verified signed status and immutable receipt ordering; Stripe uses current invoice,
complete payment/charge/refund/dispute reads and a second subscription consistency
check. Failed, stale, incomplete or conflicting facts hold the gate. Full succeeded
refunds and open/lost disputes revoke access; observations are not fabricated webhooks.
Missing post-snapshot commerce links can be restored only for the same known owner.

The local regression proves stale/wrong-owner/legacy markers stay blocked, refunds
do not resurrect access, and restoration does not alter private-map content. The
production recovery task can read only the exact Sandbox IAP vault; live Stripe and
Apple recovery credentials await the real merchant/provider gates. No new actual
paid transaction, cloud restore with paid history, or public recovery reopening is
claimed. Prior real RDS/KMS/privacy replay evidence retains its September23 date.

## Artifacts, checks and operating boundaries

Current API regression:341passed/0failed/0skipped. Web:107passed. Native transport/
authentication:41passed after updating a stale expected max_age; two callback tests
also pass in the preceding targeted run. These overlap older counts and must not
be summed into an invented total. Infrastructure47checks pass. Source/publication scans and the exact commit/CI
result are recorded separately in the QA closeout.

The transitive ip-address package is patched to10.7.2; API/Web production dependency
audits report no known advisories at the recorded check. This is not proof of a
previous reachable SSRF defect, a complete penetration test or a certification.

The app-owned privacy manifest declares the existing local preference API reason
CA92.1and no tracking. It does not declare that Rillora collects no data. The signed
bundle's eleven privacy manifests are inventoried separately; the dormant native
Google SDK retains its declarations, while Release native Google is disabled and
unrelated URL callbacks no longer initialize it. App Store privacy answers require
the processing inventory and actual SDK behavior, not a copied empty label.

The new distribution IPA passes strict code-signature verification, has no debug
entitlement or StoreKit fixture, retains all five exact production connection values
and keeps CustomerAccessNO. Its SHA256is
5aa2ad2e5b60bba4ff6c52ecb64f93520fcaf558c732ebb023a21e5f851b52e8.
The archive's development signing is distinct from the exported distribution's
non-debuggable signing. Neither artifact was uploaded. The earlier September29
package and initial privacy-only archive remain historical artifacts.

Store assets and submission drafts are in[the prepared package](../output/release/rillora-20260930/README.md).
Screenshots use the existing app with isolated synthetic records; no QA label is
removed or image content fabricated. Raw PNG evidence is retained; direct JPEG
captures avoid Apple's disallowed alpha channels. iPhone1320×2868and iPad2064×2752
match the published device classes.[Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).

## Later September30 store-image design correction

Owner says direct screenshots need presentation design. The raw captures now remain
source/evidence;[the new designed set](app-store-presentation-20260930.md) provides four
iPhone/two iPad compositions,exact typography,device framing and one true UI detail
magnification. No app UI,price,runtime or real records change. This supersedes treating
the six bare captures above as the final marketing presentation; no upload is implied.

## Remaining Owner/provider gates

- Actual review login/affirmative terms, real provider sign-in and account journeys;
  reviewer enrollment and Apple Sandbox notifications/purchase/restore/lifecycle.
- Owner-deferred physical devices and truthful merchant/market facts; live Stripe
  configuration and actual cross-channel payment, cancellation/refund/expiry.
- SES response/production access, then actual verification/reset/invitation delivery.
  No duplicate AWS correspondence or email-provider purchase is authorized by this work.
- SBP approval/effective rate and final differential Apple annual-price choice;
  final privacy/age/encryption declarations, review contact and usable TestFlight /
  App Review submission after the above evidence exists.

The final release remains closed until these gates are actually passed. Existing
Preview/WWW/legal deployments and FanPass are preserved. The handoff contains the
single next task; this document is a contract/evidence record, not another queue.
