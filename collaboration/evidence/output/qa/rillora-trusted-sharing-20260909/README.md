# Account-bound invitations and per-person sharing

Started 2026-09-09; locally verified and deployed 2026-09-10 (Asia/Hong_Kong).  
Status: API/Web/iOS implemented; existing AWS synthetic staging updated and checked.

## Delivered behavior

- Add a contact -> choose matters/detail levels -> create a recipient-email-bound link and QR.
- Name, Directions and Details levels are per person and per matter; default selection is empty.
- B signs in or creates a Rillora account and explicitly accepts. An accepted connection binds to the Rillora account ID. Web is a full install-free receiving route; the installed iOS app accepts a pasted/opened link and offers Shared with me.
- B and C receive independently selected fields. Unselected items disclose no title, count, relationship or other metadata.
- A can change levels, remove items, replace a pending link/email, or stop sharing. Account acceptance, direct read-only sharing and future event-conditioned release are separate.
- Existing Web contact management no longer edits only `contacts[0]`: all active people have their own edit/share actions, and Add person remains available.

## Evidence

| Check | Result | Artifact |
| --- | --- | --- |
| Full API suite | 115 passed | `api-full-tests.log` |
| New targeted sharing API cases | 10 passed within full suite | `apps/api/tests/sharing.integration.test.ts` |
| Web core tests | 48 passed | `web-tests.log` |
| Web production build | passed | `web-build.log` |
| API typecheck | passed | `api-typecheck.log` |
| Native unit tests | 124 passed, 1 existing StoreKit environment skip | `native-unit-tests.xcresult` |
| Native A -> QR -> B -> C denial -> revoke | passed | `native-sharing-flow-v3.xcresult` |
| Native AX5 / reduced motion / dirty-dismiss | passed | `native-sharing-accessibility.xcresult` |
| Linux ARM64 API container | built locally | `docker-build.log`; `rillora:sharing-20260910` |
| Staging two-phase deployment | both phases completed | `aws-deploy-phase0-retry.log`; `aws-deploy-phase1.log` |
| Database migration and runtime role | task revision 13 exited 0 | `aws-migration-status.json`; `aws-migration-logs.json` |
| CloudFormation / ECS | UPDATE_COMPLETE / 1 running of 1 desired | `aws-stack-after.json`; `aws-service-current.json` |
| HTTPS endpoints and exact Web files | 18 / 18 passed | `aws-http-verification.json`; `verify-staging.py` |
| Deployed 390px browser routes | Home, Account, Invite: no overflow; no console errors | `aws-*-dom.json`; `aws-browser-errors.txt` |

The native QR is decoded from its actual rendered screenshot using Core Image,
then its capability is used for the receiving test. Vision's newer inference
context was unavailable on this Simulator; the first failed bundle is retained.
The next run reached successful revocation but looked for a virtualized offscreen
status. The final view includes local revocation feedback and the final test passes.
Intermediate failures are not counted as successful runs.

## Actual browser journey

A used the local planner preview on 4176. B and C used separate Vite instances on
4192/4193 with explicit, production-disabled synthetic identities and the same
local database. Port substitution selects the test actor; this is not real Auth0
identity proof. No family/friend message or email was sent.

1. A created QA Parent, selected Bank account at Name level and Cloud photos at Directions level, and generated a real QR/link. Copy showed Copied. The address contained the capability only in its fragment.
2. B opened the invite. Before acceptance, only the inviter, masked target and read-only scope were shown. Acceptance navigated directly to Shared with me, with exactly the two selected items. The Name-only detail exposed no provider, location or masked account hint.
3. A created QA Friend with GitHub projects at Details level. C accepted and saw that item; C did not receive B's Bank account or Cloud photos. B did not receive the friend-only project.
4. Server integration tests additionally cover unauthenticated/CSRF rejection, unverified/mismatched email, idempotence/concurrency, expiry, replaced links, independent simultaneous handoffs, scope downgrade, revocation, cross-owner RLS, never-disclose and prevention of silent re-sharing.

## Security and identity changes

Migrations `0035` and `0036` were applied to local development/dedicated test
databases, then to the existing synthetic staging in the completed two-phase
deployment. Existing planner RLS is unchanged. A nologin function-owner role,
not granted to runtime roles, exposes only bounded recipient projections. It has
no account-management or commercial privileges. Changing a matter to Never disclose
or archiving it clears its grants and increments affected connection versions.

The API stores invitation-token digests, not raw links. Public resolve returns no
matter content. Per-invitation HttpOnly handoffs survive the existing Web login
redirect without putting capabilities into OAuth return URLs or Web Storage.
Actual acceptance uses typed Cookie/Bearer authentication, current legal acceptance,
explicit consent and cookie CSRF. Wrong users cannot claim an invitation.

Web requests `openid profile email`; native access-token verification optionally
fetches the trusted issuer's UserInfo, requires a matching subject and boolean
`email_verified`, and stores only the verified email digest in the local session.
Missing proof does not break ordinary planning; targeted acceptance requires a new
verified sign-in. The digest is personal data, not anonymisation. No accounts are
merged by email and no new Auth0 admin/long-term key configuration was applied.

## Visual artifacts

- [Working reference](../../../assets/concepts/rillora-trusted-sharing-20260909/interaction-reference.png)
- [Native flow recording](native-sharing-demo.mp4)
- Native final screenshots: `native-final-captures/`
- [Owner permission selection](web-parent-permissions.png)
- [QR and copy actions](web-parent-invitation.png)
- [Name-only receiver detail](web-parent-name-only.png)
- [Friend-only inbox](web-friend-inbox.png)

The reference's extra bottom tabs and before-acceptance inset are not product
behavior. The app retains three primary tabs and reveals actual items only after
accepted, account-bound access. QR images are generated locally by Core Image /
`qrcode`, not taken from the concept image.

## Deployment boundary and continuation

The initial operator CLI session and callback expired; the cached browser session
returned AWS 400. On September 10 the Owner requested the page again. A fresh
`aws login --profile rillora-operator` completed and STS confirmed the existing IAM
operator. No additional project approval, root credentials or cookie reset was used.

Preflight read live parameters/resources. The reviewed change affects API/migration
task revisions, the service desired count and the Web artifact. Existing public
parameters were passed explicitly; masked NoEcho values were retained with
`--previous-parameters true`. Stripe test stays enabled; Apple IAP stays disabled.
No new persistent service or IAM privilege was added.

The first upload attempt used the already-assumed `rillora-cdk-deploy` profile,
which cannot publish ECR/S3 assets or assume the sibling publishing roles. It failed
before a stack mutation; `aws-deploy-phase0.log` preserves that failure. The retry
used `rillora-operator`, allowing CDK's existing scoped-role selection, and succeeded.
The deployment runbook now records this distinction.

Phase 0 completed with the API stopped at 0/0. Migration task revision 13 ran the
exact ARM64 image `sha256:707d9a18eac270626d684e7639cdf87598f2728ce04690b6b360bcd71701f75e`,
exited 0, and logged both migration and runtime-role success. Phase 1 changed only
the desired count to 1. API revision 18 has running/desired 1/1, zero pending or
failed tasks and a completed rollout; CloudFormation is UPDATE_COMPLETE.

Eighteen checks verify liveness/readiness, Home/Account/Invite/Shared SPA routes,
session and legal-contract endpoints, anonymous/forged-dev denial, unknown invites
through both Web and native adapters, missing handoffs, no-store, CSP/HSTS and exact
HTML/JS/CSS hashes. A valid-format nonexistent invite reaches the new database
function and returns `invitation_unavailable`, not a missing-route or SQL failure.
No identity, legal acceptance or invitation was created by these deployment checks.

Fresh browser checks at 390px confirm public Home, Account and Invite have no
horizontal overflow. Who selection changes its pressed state and feedback without
login. The initial Account snapshot was taken while its service read was loading;
`aws-account-ready-dom.json` is the completed state, with an unchecked legal control
and both identity actions disabled. No consent or identity button was submitted.
Screenshots: [Home](aws-home-390.png), [Account](aws-account-390.png),
[Invitation entry](aws-invitation-390.png). No browser console errors were observed.

The next controlled review uses the normal cloud build and a designated recipient's
actual hosted provider sign-in and acceptance. Local synthetic A/B/C checks and
deployed route verification do not prove a real relative's identity, delivery or
production readiness. Auth0 configuration and real messages were unchanged.

Source baseline: 124 snapshots in `before-source/` with `source-before-manifest.json`.
A protected pre-migration database backup is under the Git-ignored `.local/backups/`.
No initial repository commit, branch or stash was created.

## Final local build state

Native Debug build/run and Release Simulator compilation pass. The final normal
Debug app uses the project cloud endpoint with an empty development planner ID;
its sharing URL scheme is registered. See `normal-build-readback.json`. That endpoint
now serves the deployed sharing routes; this turn did not replace the native build
or leave it running as a local test actor.
Infrastructure typecheck and all nine infrastructure tests pass. The final Markdown
check covers 56 owned/report files and 208 local links with zero broken targets;
`git diff --check` passes.
