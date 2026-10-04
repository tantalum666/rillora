# Account-bound invitations and directed sharing

Status: SHARING CONTRACT RETAINED; RESTRICTED PRODUCTION RECENT-AUTH GUARDS VERIFIED; REAL PRODUCTION JOURNEY OPEN
Last updated: 2026-10-04 (Asia/Hong_Kong)
Authority: Owner explicitly requests A -> B/C invitations, authenticated acceptance and per-person/per-matter access.

## October3 strict-review implementation boundary

The live/saved/paused projection also governs recipient-specific printable guides.
Restores retain historical redaction and grant lineage under0092; removing then
regranting access cannot revive a prior saved copy. Ambiguous legacy history stays
quarantined rather than inventing missing evidence. Existing real QQ acceptance/login
and limited field proof retain their October2 scope. The new replay/export repairs
were locally verified at review closeout and subsequently deployed under
[the October3 rollout](review-rollout-20261003.md). [Review and limitations](code-review-20261002.md).

October4 actual QQ session recovery again returned only the5Directions fields for
the existing synthetic shared record. This is current restricted-production read
evidence; changed scope and revocation remain in[the ongoing real-core acceptance](real-core-acceptance-20261004.md).

## September30 recent authentication for expanded access

New/regenerated invitations,resuming live access,additional matters,higher field
levels and a new/replaced collaborator require recent verified authentication in the
restricted production runtime. Comparisons run against the owned current grants in
the same transaction; blocked expansion rolls back its version change. Removing or
reducing grants,pausing and revocation remain immediate with a valid ordinary session.
Both clients retain an unsaved selection when the user cancels verification.
[Current proof and real-provider gate](release-engineering-20260930.md).


## September17 allowance and saved-copy contract

Outgoing places include pending unexpired invitations and accepted live connections, with Free1/Family5 enforced transactionally. Contacts/incoming shares remain free. Full Free supports confirmed atomic replacement and preserved drafts. Paid-period copies retain only authorized fields; narrower grants permanently redact them. Saved owner previews match recipient copies. Resumption after a new paid period is explicit. Cloud enforcement is active; Real B acceptance and A revocation are now observed using disposable content. [Implementation and evidence](commercial-completion-20260916.md).

## September17 real recipient continuation

Owner completed A's native Google/terms flow and B's actual signup, email verification and explicit acceptance after manually transferring the link. B's browser showed the selected disposable document, permitted location/Notes and Read only; A read back Connected. A then stopped sharing: native showed Disconnected and0/1 place used, and B reload showed an empty inbox. This is Owner-controlled real-account ceremony evidence with synthetic content, not actual third-party family delivery. The original real token was not retained before revocation, so its exact browser re-open was not completed. A separate deployed fixture proves the same old capability cannot be accepted again; do not relabel that as the original human step.

Owner identified an unnecessary repeat login after email verification. The same-session proof refresh is deployed under [the authentication contract](authentication-experience.md); API30 and0060 are active and verified. A continuously open shared detail also needs bounded revalidation even without a focus event. Both clients now check visible shared views every15seconds without replacing unchanged content with a loading screen; loss of access or failed verification clears it. Foreground refresh still clears cached fields while checking. No new layout or automatic disclosure is introduced. [QA](../output/qa/rillora-real-invitation-20260917/README.md).

The Web receiving entry carries a bounded return marker and the invitation header provides Back to shared items; direct entries return to Rillora. Account/invitation consent is below both auth choices while remaining mandatory and unchecked. Revoked owners are absent from the recipient list; the neutral empty state does not imply no prior acceptance. These Owner-requested adjustments preserve the current visual language.

## September16 behavior and preview boundary

`POST /v1/sharing/preview` is an authenticated, CSRF-protected, owner-scoped read. It rejects foreign, archived and Never disclose records and projects only explicitly chosen fields. It changes no grant or invitation. Existing Visible details controls consume the preview. Both clients clear stale recipient content while checking access; late prior responses cannot restore removed fields. Returning from a completed invitation reflects actual account-bound acceptance. Source matter context is retained through the existing controls. [Contract](ux-behavior-repair-20260916.md), [current QA](../output/qa/rillora-p2-repair-20260916/behavior-20260916/README.md). No provider identity, consent ceremony or delivery is implied by the synthetic tests.

## Invitation entry and fresh-state presentation — 2026-09-11

Authenticated Overview and Profile/More expose **Invite someone** directly. Name and optional relationship continue to per-item access, then **Create link & QR**. The receiving entry is **Accept a received invitation**, under Shared with me; guests may open it, but account-bound explicit acceptance remains mandatory. Free's first relationship includes the entire path.

Returning to a clean sharing screen refreshes its server state. Acceptance/revocation or an externally changed link version removes obsolete local QR/link state. A current pending link remains available; dirty drafts are not auto-replaced. Real QR decoding, NativeA→WebB and WebA→nativeC field separation, foreground refresh and revocation are covered in [current QA](../output/qa/rillora-invite-motion-20260911/README.md). At that September11 checkpoint numerical commercial limits and cutoff were unfinished; the September17 section above records their deployed implementation.


## September11 entry and detail revision

The signed-out app exposes only the received-invitation entry. Creating a contact, generating a link/QR, changing grants and revoking access use authenticated APIs. New recipients can choose hosted registration, return with the same invitation, then explicitly accept; signup by itself never grants access. The current SQL Details projection enumerates every allowed typed key, so a future private JSON key cannot silently broaden sharing. The B/C, downgrade, unverified/wrong-account and public-metadata cases pass in the current local suite. [Contract](account-matter-ux.md), [QA](../output/qa/rillora-account-matter-ux-20260911/README.md).

## Product flow

A adds a contact, chooses which matters to share and their visible detail level,
and creates a recipient-email-bound invitation link/QR. Sharing starts empty.
B opens the invitation, signs in or creates a Rillora account, explicitly accepts,
and sees only A's permitted fields. Web is a complete install-free route. Native
supports invitation entry and the same shared-with-me view. A can update or revoke
access; B and C have independent scopes. Receivers have read-only access.

A contact record, authenticated connection, direct sharing and event-conditioned
release are distinct. This feature implements sharing expressly selected by the
living planner. Death/incapacity/unreachable verification and release stay closed.
No automatic full-plan access, executor appointment or recovery authority follows
from accepting an invitation.

## Permissions

Each connection has explicit grants for individual active matters. Levels are:

- Name only: title and category.
- Directions: name/category, provider, safe location and intended outcome.
- Saved details: directions plus masked hint, value band, currency, importance, the explicitly allowlisted category-specific details and Notes. Typed details/Notes are absent from Name/Directions and public invitation metadata.

Unselected matters expose no title, count, contact or metadata. Never-disclose and
archived matters are excluded. A reviews the exact level before saving. Pending
invitations grant no reads. Accepted access binds to the authenticated Rillora
account ID; email is an invitation-address check, never an identity-merge key.
A different verified email cannot consume the invitation. Unverified/missing
email claims require verification or a fresh login. Existing sessions without
email proof retain ordinary planning access but cannot accept a targeted invite.

## Invitation lifecycle

Use 32 random bytes, store only the token digest, expire in seven days, support
revocation/regeneration, and consume atomically. The share URL carries the secret
in a fragment; clients remove it before network work and post it in a body.
A short-lived HttpOnly handoff supports the existing Web authentication redirect
without placing the invite secret in return URLs or Web Storage. Acceptance needs
a typed authenticated session, current legal acceptance, explicit consent and
CSRF proof for cookies. Repeated acceptance is idempotent only for the already
bound account. Wrong-account, expired, revoked and malformed links fail closed.

The source invitation email is reduced to an exact-match digest and masked label;
the digest remains personal data, not anonymisation. Verified-email proof comes
from validated provider claims/UserInfo and is never supplied by the client.
Synthetic development identities remain explicitly labelled, production-disabled
and excluded from real identity/delivery claims.

## Server boundary

Existing planner RLS is preserved. A separate least-privilege database reader and
bounded security-definer projection return only granted fields to the verified
recipient. No endpoint accepts a caller-selected owner context as authority.
Connection revocation, person lifecycle and matter archive immediately deny new
reads. Previously copied information cannot be remotely erased. Every mutation
uses optimistic versions and metadata-only audit events.

## UI

September 10 maintenance extension: [Family shared reviews](family-maintenance.md)
now lets accepted recipients check only their existing Directions/Details scope.
One explicitly chosen contributor can suggest provider/location corrections,
which the owner approves before the real Matter changes. The ordinary shared
Matter API remains read-only to recipients; this does not create co-owner,
executor, recovery or release authority. Review links contain no capabilities or
private content and do not replace invitation/account-bound acceptance.

Commercial counting follows [the current packaging contract](monetization.md):
Free includes one outgoing place and Family includes five. Unexpired pending
invitations and accepted live relationships reserve those places transactionally;
contact records and incoming accepted shares do not. Every included recipient
gets the same Name/Directions/Details privacy controls and revocation. The deployed
API enforces these limits, while ordinary billing remains closed. Free retains one
designated live relationship after paid access ends; other accepted recipients
may retrieve only their last authorized paid-period copy. Restrictive changes
permanently redact or remove those copies, and post-expiry edits cannot update
them. Resumption and replacement require an explicit owner action. These deployed
behaviors supersede the September10 unimplemented checkpoint; synthetic and
enrolled Stripe-test evidence does not prove real recipient acceptance or public
paid availability. See the [current implementation and evidence](commercial-completion-20260916.md).

Keep the current low-text interaction contract: People list, Invite action,
per-matter selection and detail control, real local QR/share controls, and a
recipient inbox. Do not replace this with explanatory cards or simulated acceptance.
Do not label generated links as delivered. The owner sends through the system
share sheet or copies the link; no email or SMS is sent by this implementation.

## Evidence

Current research uses Auth0's [scope/claim contract](https://auth0.com/docs/get-started/apis/scopes/openid-connect-scopes)
and [immutable user identifier guidance](https://auth0.com/docs/manage-users/user-accounts/identify-users).
Implementation/QA artifacts are in `output/qa/rillora-trusted-sharing-20260909/`.
The September17 section records an actual Owner-controlled B acceptance and revocation with disposable content. No real third-party family delivery or event-conditioned release is claimed.

## 2026-09-10 local verification checkpoint

API 115 passes, Web 48 passes, native 124 passes/one existing StoreKit skip,
and two focused native UI tests pass. The native QR was decoded from the rendered
screen before the recipient test. B/C separation, name-level filtering, wrong-account
refusal, explicit revocation and AX5 draft protection are verified locally.
Handoff cookies are distinct per invitation. Never-disclose or archive removes
associated grants so changing back cannot silently resume sharing.

[QA evidence and deployment results](../output/qa/rillora-trusted-sharing-20260909/README.md).
After renewed AWS login, migrations through `0036`, the API and Web assets were
deployed to the existing synthetic staging. The migration task exited 0,
CloudFormation completed and ECS returned to 1/1. Eighteen HTTPS/asset checks pass,
including invitation lookup against the deployed database, anonymous denial and
exact built asset hashes. Actual receiving-account provider login and acceptance
remain a separate runtime proof; no real family invitation or delivery is claimed.
