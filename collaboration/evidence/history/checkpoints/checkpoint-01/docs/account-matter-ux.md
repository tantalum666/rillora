# Account, invitations and matter entry

Status: BEHAVIOR REPAIRS DEPLOYED; EXISTING UI PRESERVED.

Last updated: 2026-09-17 (surface refinement and same-draft category return fix)

The [P1 repair contract](p1-reliability-repair-20260915.md) supersedes the audit's UX02–05 implementation gaps: visible error/retry, verified-account draft recovery, deduplicated create retries, explicit service states and self-service data exit are locally implemented and tested. Current behavior/accessibility outcomes and residual real-device limits are tracked in the behavior-repair contract. The September11 staging checkpoint is historical; current deployed evidence is recorded in the September16 section above.

## September17 category and exit correction

A new matter's category is an edit inside the same draft, not a separate browser-history page. Changing Account → Crypto (or another category) replaces the current draft route. Close/Back still offers Keep editing / Discard for a dirty draft; keeping preserves the selected category, and confirmed discard returns to the originating list in one step. No private field is stored in the URL. This narrow rendered regression was found during [surface/motion QA](../output/qa/rillora-surface-motion-20260917/README.md); the continuous form, required fields and sharing boundaries remain unchanged.

## September16 behavior-repair outcome

Owner explicitly rejects a UI redesign. Existing layout/navigation are preserved. The initial new intermediate page and separate preview step remain withdrawn. The narrower implementation connects the existing People section/contacts screen and supplies an optional actual projection inside the existing Visible details disclosure. Return context, paused-guide recovery, invitation completion and foreground permission refresh are implemented and synthetically accepted. See [current contract](ux-behavior-repair-20260916.md) and [QA](../output/qa/rillora-p2-repair-20260916/behavior-20260916/README.md).

## September16 deployed P1 checkpoint

P1 is now deployed to the existing synthetic staging environment: API23, migration17, checksums0043–0047, completed1/1 rollout; Web and the current native Debug build use the matching contract. Sites legal version4 and the Auth0 form/action are published and read back.36 HTTPS and25 legal checks pass. Authenticated cloud fixtures verify invitation scope, scoped plaintext/encrypted export, full backup/import, private archive restoration and provider-backed account deletion. These are deliberately synthetic sessions, not real signup/email/consent ceremonies. Sales remain closed. [September16 deployment acceptance](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).

## Account and invitation flow

- The public account entry always reads `Sign in / Sign up`, including an expired session. Public browsing remains available.
- Signed-out visitors may open a received invitation. Creating contacts, generating invitations and managing sharing require authentication. No account-existence lookup or same-email account merging is introduced.
- The invitation offers `Create account to accept` and `Sign in`. Registration uses the hosted signup intent. The original invitation stays in the existing protected handoff/native memory, and returns to an explicit `Accept invitation` action after authentication. Registration alone never accepts a grant.
- Login returns to the real app shell. Remove the full-screen `Opening Rillora` interstitial and reduce redundant first-load requests. Session, identity and legal verification remain mandatory; network time is not promised to be zero.

## Profile

My data now groups complete backup, local saved-copy reading, safe empty-map import, archives/restore and account deletion with a portable status receipt. Keep contacts and their real sharing states, Shared with me, shared reviews, Plan & access, export, useful provider instructions, privacy and account sessions. Remove consumer Simulation, role-disclosure rehearsal, preparation motivation and duplicate optional setup entries. Internal nonoperative simulation code and its safety checks may remain. Export and provider instructions use ordinary rows rather than a stack of promotional cards.

## One matter form

One continuous form: category and identity → relevant details → optional directions and people → notes. No Details / Directions / People tabs. Required fields are labelled, invalid input disables Save and is rejected server-side. Unknown outcomes and no assigned contact are valid: creating a private matter must not require inventing a person or intent.

| Category | Required beyond name/category | Additional optional details |
| --- | --- | --- |
| Online account | Provider | Username or masked hint, recovery-information location |
| Financial asset | Institution | Asset type, masked reference, value range/currency, document location |
| Debt | Creditor | Debt type, masked reference, value range/currency, agreement location |
| Document | Location | Document type, issuer |
| Device | Location | Manufacturer, model, masked serial hint |
| Subscription | Provider | Billing cycle, renewal date, masked account hint |
| Crypto — exchange | Exchange | Asset/token, masked account hint, records location |
| Crypto — on-chain wallet | Network and public wallet address | Wallet app/device, asset/token, records location |

Crypto custody choice is required. A public address is a locator, not proof of ownership, balance or transfer authority. Never request a private key, seed phrase, password or device unlock code. Notes are optional, up to 2,000 characters, at the bottom for every category. Typed details reject unknown or cross-category fields. Switching category/custody preserves the local draft while only submitting applicable fields.

Existing records remain readable. On editing, missing newly required fields must be completed; old database migrations and saved records are not silently rewritten. New detail/notes writes use optimistic versions and trigger existing stale-preview/permission mechanisms.

## Sharing and exports

Typed details and Notes are visible only at the explicit `Details` sharing level. Name/Directions, invitation previews, aggregate events and the minimum Start Here export do not gain them. Existing provider/location direction fields keep their established levels. A new matter remains private; linking a record-only role does not generate an invitation or legal authority. Real per-person access remains controlled from that contact's sharing screen.

## Verification

Validate required and conditional fields in API, Web and SwiftUI, persistence/reload and updates, B/C projection isolation, auth-required invitation mutations, registration return, cancellation, stale versions, normal and large text layouts. Distinguish local tests, installed Simulator, staging deployment and actual Owner login latency. See [QA](../output/qa/rillora-account-matter-ux-20260911/README.md).

## September11 outcome

Staging update is complete: migration task15 exited0, API task20 is1/1 with rollout COMPLETED, CloudFormation UPDATE_COMPLETE, and30 HTTPS/asset checks pass. A separate read-only task confirms0040/0041/0042 cloud checksums exactly match source. Development auth stays off, Stripe test and existing maintenance preview on, Apple Sandbox and ordinary sales closed; the operations stack was not deployed. Native133 tests passed with one existing StoreKit skip; API136 full-suite cases plus one focused new-recipient signup/return case pass; Web58 app cases pass. Native/browser Crypto/Notes save and reload, guest invitation entry, actual hosted signup entry/cancel and native AX5/reduced-motion layout were observed. Ordinary cloud Debug is restored. No new personal Rillora signup/login completion or zero-latency benchmark is claimed.
