# Web navigation, settings and Family plan corrections

Status: SOURCE CANDIDATE; BROWSER AND REMOTE CI VERIFICATION PENDING
Updated: 2026-10-08 UTC

## Request and source boundary

The owner reported desktop navigation becoming a dropdown, missing Apple-price
clarification, duplicate language selectors, unavailable Web email, redundant My plan
navigation, and an oversized Free presentation hiding Family benefits.
Three supplied screenshots were materialized and their actual pixels inspected.
This branch starts from operator a49f3f95, preserving existing purchase, entitlement,
authentication, legal consent and billing management behavior. The guide translation
branch remains independent; neither branch is merged or deployed by this work.

## Implementation

- Center horizontal public navigation at desktop widths, compact the language control,
  retain a horizontal tablet row and accessible small-screen menu
- Clarify in English and Chinese that Apple subscription pricing may differ and the
  final Apple purchase screen controls that amount; no Apple amount is invented
- Keep one language selector on Settings; remove My plan from desktop/mobile navigation
  and redirect old plan URLs to Overview; retain billing and saved-copy entry points
- Present current Free status quietly and Family benefits/current server Web annual
  price prominently. Family features use neutral product bullets, not granted-rights
  checkmarks, because catalog activation and actual account entitlement are distinct.
  Keep closed sales, subscribed management, expiry information,
  consent and checkout safeguards. Do not display roadmap features
- Accept UUID casing consistently with native identity handling, distinguish loading
  from absent email, terminate mismatched responses, and discard stale client/retry data

## Email diagnosis boundary

Both clients use the same authenticated account/identity API and exact-subject verified
provider email. The older-server profile fallback has no email. Deployment records say
Preview frontend was updated without replacing its staging API/config, while native
uses production. This is a plausible cause of the supplied screen, not a verified
runtime diagnosis: its host and authenticated response were not observed. No fabricated
email, cross-account cache, origin switch, permission expansion or provider change was
made. A source/client improvement cannot prove the deployed session now displays email.

## Verification in progress

Internal/public builds and 180 non-legal Node/API/SSR tests pass; seven legal-fixture checks pass separately. Browser regressions cover
bilingual responsive geometry, settings uniqueness, identity loading/retry/races,
Family/free/expired/missing-price states, consent reset, keyboard and history.
Local Chromium cannot start because its sandbox socket operation returns EPERM;
therefore local build/static checks are not visual evidence. Exact GitHub runner
results and inspected screenshots will be added after they finish.

Initial candidate20b2898 passed all three source CI jobs and41/41 browser scenarios.
Actual screenshot inspection then found a320px button extending outside its Family
card, which a document-width assertion had missed. The candidate was corrected and
card-bound assertions added. Neutral Family product bullets replace an over-strong
included-rights assertion. Final browser rerun also covers the retained Stripe TEST
entry when ordinary sales are closed and an honest unavailable-environment error
when the TEST API is absent; no payment request is sent by these checks. No native runtime,
real login, purchase, deployment or end-user acceptance is claimed.

## Integration handoff

Apply this narrow Web branch alongside the independent guide and external-link safety
fixes, preserving each side. Before claiming the reported email problem fixed in
production, verify the actual Web host reaches the intended matching identity API.
No shared historical document or private test log was republished by this task.
