# Family shared maintenance — implementation and verification

Date: 2026-09-10 (Asia/Hong_Kong)  
Status: IMPLEMENTED AND DEPLOYED TO EXISTING SYNTHETIC STAGING  
Scope: API, Web and iOS shared review workflow; ordinary billing remains closed.

## What now works

Owner chooses already-connected people and permitted directions, requests a
review, and shares a generic review-inbox link if needed. Each receiver sees only
their assignments and can confirm or flag a problem. One explicitly chosen
contributor may suggest provider/location corrections. Owner reviews before/after
and approves or keeps the current version. Approval updates the real Matter and
adds history in the same transaction. Source changes require fresh checks.
Completion/cadence persist the next review date. Receiving users land in their
inbox, and dirty forms protect drafts on close/back.

The recording is an actual Simulator operation using synthetic content:
[native approval recording](native-approve-review.mp4).

## Code and contract

- [Feature contract](../../../docs/family-maintenance.md).
- API: migrations `0037–0039`, `family-maintenance-routes.ts`, explicit preview
  configuration and capability checks; new immutable planned Family v2.
- Web: `FamilyMaintenancePanel.jsx`, `familyMaintenance.js`, private lazy loading,
  API adapter, authenticated navigation and safe account-return link.
- iOS: `FamilyMaintenanceModels.swift`, `Features/Maintenance`, API adapter and
  explicit dependency wiring through Profile. No fourth top-level tab.
- No new library, merchant, subscription, key, external notification or public
  legal text was added. The normal Simulator launch was restored to cloud Debug.

## Test evidence

| Check | Result | Artifact / limit |
| --- | --- | --- |
| API suite | 129 passed | `api-tests-final.log`; includes 14 new scoped review integration cases |
| Web product/source | 54 passed | `web-product-tests-final.log` |
| Legal artifact isolation | 7 passed | `legal-artifact-tests.log`, run against its separate legal build; product artifact rebuilt afterward |
| Web build | Passed | `web-build-final.log`; existing HPKE/Rollup warnings retained |
| Native unit suite | 129 passed, 1 pre-existing StoreKit skip | `native-tests.xcresult` |
| Native final focused model/wiring | 5 passed | `native-family-final.xcresult`; final icon-only change subsequently built and visually checked |
| AWS infrastructure | 10 passed | `infra-tests-final.log` |
| HTTPS / all JS-CSS asset hashes | 27 / 27 | `aws-http-verification.json`; includes lazy review assets, review entry and anonymous/forged-dev refusal |

API cases cover CSRF/auth, unaccepted or hidden scope, B/C isolation, non-contributor
refusal, forbidden fields, idempotent creation, one successful concurrent approval,
source conflict, capability expiry/locked accounts, receiver-independent access,
late-response versus completion ordering, revoke/regrant behavior and retaining
owner-approved history/cadence after a contributor account is removed.

## Actual interaction proof

Web A on port 4211 selected B as contributor and requested three checks. Closing
the dirty request showed a keep/discard choice; keeping restored all three
selections. B on 4212 saw only photos/insurance, confirmed photos and proposed a
red-folder correction. C on 4213 saw only the project, had no suggestion action
and flagged it outdated. A approved the correction: API readback showed the real
Matter changed and exactly one before/after history entry. A handled C's flag and
completed the review; next review became December 9. No external message was sent.

Native A then created a new insurance check. B proposed a green-folder correction
in the app; A approved it and opened the resulting history. Native settings changed
the cadence from 90 to 30 days and persisted October 10 as next review. The same
data appeared across Web/iOS. AX5 with Reduce Motion opened the receiving inbox
and successfully confirmed a subsequent check. The final decorative icon size was
rechecked so it no longer crowded large text.

Web checks include desktop, 390px and 320px with no horizontal overflow; visible
review buttons have at least 44px height. Fresh post-fix browser console had no
errors. The deployed signed-out review entry showed the right task heading,
unchecked consent and no shared content. This does not prove a fresh real-provider
callback or an actual relative's acceptance/delivery.

## Deployment readback

Two phases used the existing operator/CDK roles and previous CloudFormation
parameters. Phase 0 stopped the service; migration task **revision 14** exited 0
and logged both migration and runtime-role success. Phase 1 restored API task
**revision 19**, desired/running **1/1**, pending **0**, failed tasks **0** and a
completed rollout. CloudFormation is **UPDATE_COMPLETE**.

`aws-feature-flags.json` confirms Family preview true, development auth false,
existing Stripe test true and Apple Sandbox false. Normal paid entitlements and
sales remain closed. There was no new paid infrastructure resource or IAM scope
expansion; the migration task reference was updated normally by CloudFormation.

The first DescribeStacks attempt used the human IAM profile, which has no direct
resource permissions; readback used the existing deployment profile. The saved
`aws-stack-before.json` was recovered during phase 0 and is not a pristine
pre-update snapshot. Likewise the restricted staging role does not allow broad
ListServices/DescribeTaskDefinition: exact resource lookup came from CloudFormation,
then its permitted DescribeServices/log operations. No permission expansion or
additional Owner confirmation was used.

## Fixes found during verification

- Settings initially used PUT, which the existing CORS policy does not expose.
  API/Web/iOS now consistently use PATCH; the subsequent real browser save passed.
- No selected contributor initially produced a nullable suggestion flag; it is
  now an explicit false and covered by integration checks.
- Approved task detail initially retained its old display values; it now shows
  accepted values while the immutable history keeps before/after.
- Review completion now serializes against late responses, and locked/expired
  owner capability stops work even while the receiver keeps their own Free account.
- Deleting a contributing account preserves the owner's approved history/cadence
  and detaches identity instead of cascading away that owner data.
- Segmented tab wrapping, default browser-styled refresh, empty progress icon,
  disabled-button appearance, smaller-width heading and AX5 icon crowding fixed.
- An initial aggregate Web command ran three legal-artifact checks against the
  product bundle. Those build-mode failures are retained in `web-tests.log`; the
  correct isolated legal build/check and final product checks supersede them.
- The first infrastructure assertion incorrectly depended on environment-array
  order; final checks inspect the key/value map and unchanged secret count.
- Clipboard readback was cancelled when browser read permission did not resolve.
  Share API invocation and safe URL construction were checked; delivery/copy
  completion is not inferred from that cancelled readback.

## Screenshots

- [Web request at 390px](web-start-390.png)
- [Web owner approval](web-owner-approve.png)
- [Native suggestion](native-suggestion.jpg)
- [Native approval](native-approve.jpg)
- [Native approved history](native-approved-history.jpg)
- [Native dirty-dismiss protection](native-draft-protection.jpg)
- [Native AX5 final](native-ax5-final.jpg)
- [Cloud receiving entry at 390px](cloud-review-entry-390.png)

Earlier screenshots with unrefined headings/buttons or icons are retained as
before evidence, not final visual targets. The operation recording precedes only
minor subsequent presentation/link refinements; the core approval behavior is
unchanged.

## Reading, closeout and remaining boundaries

This implements the same continuing Free/Family workflow whose complete read
covered 55 Markdown files / 16,011 lines. Current/changed authority and the relevant
code/skills were read before modifications; `work-state.json` records recovery and
progress. Focused specs, product, decision log, handoff and journey were updated
before the final response; link/diff validation is in `documentation-validation.json`.

Still open: full co-owner editing, all-plan history, automated external reminders,
commercial outgoing-person enforcement and accurate paid-cutoff sharing snapshots,
real-provider receiving proof, real users/WTP, physical-device/release and live
merchant/security gates. This is a working shared-maintenance preview; it does
not establish that customers will pay US$99 or activate ordinary billing.
