# Rillora Commercial Model And Pricing Contract

Role: canonical commercialization, packaging and subscription-lifecycle contract  
Authority scope: free/paid boundary, launch offer, future tier architecture, billing periods, trials, refunds and safe downgrade  
Superseded by: later Owner decision recorded in `docs/decision-log.md`  
Do not use for: proof of willingness to pay, legal/tax advice, current implementation, App Store approval or payment-provider selection  
Status: FREE / SINGLE FAMILY STRUCTURE LOCKED; 1 / 5 OUTGOING ALLOWANCE CLARIFIED AS LAUNCH DESIGN; QUOTA ENFORCEMENT AND ORDINARY PAID ACCESS NOT ACTIVE; PRICES PROVISIONAL; STRIPE TEST STAGING DEPLOYED, APPLE IAP DEPLOYMENT / PURCHASE / LIVE COMMERCE OPEN  
Last reviewed: 2026-09-10 (packaging, implementation audit and continuity; provider/legal checkpoints retain their own dates)

## Executive Summary

Rillora should charge for ongoing coordination work that it performs, not for information that users can already configure for free through Apple, Google or another provider, and not for baseline security, export or recipient access.

The launch catalog remains permanent `Free` plus one `Rillora Family` entitlement with two billing periods. The current prospective validation price is **US$6.99/month or US$49/year**, after the Owner rejected shared reviews as sufficient US$99 value. Annual is US$4.08/month equivalent and 41.6% below twelve monthly payments. This is a reversible Agent-selected hypothesis under the current repricing instruction, not validated willingness to pay. US$39/59 are comparisons, US$89 is historical, and US$99 is a conditional expanded-product scenario. No second paid tier, founder promotion or introductory-price expiry is active. See [rebuilt economics](unit-economics.md).

The product and data model must nevertheless support future `Personal`, `Family`, human-service add-ons and a separate professional catalog. Entitlements must be capability-based and versioned; no client or API may reduce the model to `isPremium`.

Rillora already has a meaningful free plan, so the recommended launch does **not** use an auto-converting paid trial. The current direct-Web candidate is non-refundable except where mandatory law applies or Rillora expressly agrees in writing; the former 30-day first-purchase guarantee remains only a dormant experiment and is not promised by the current legal candidate. A 14-day paid-feature preview also remains designed but disabled until activation and conversion behavior can be measured. App Store and any future storefront refund process, taxes and local consumer rights remain controlled by the applicable channel and law.

The provider-neutral model and official Stripe test boundary are now deployed without opening sales. Migrations `0022–0026` define the versioned catalog, capability, integer-minor-unit price, market/storefront/route policy, provider test-catalog binding, subscription, entitlement and finance records plus a durable minimal provider-event inbox and independent commerce executor role. The two Global USD hypotheses remain `test_only`; every market and purchase route is disabled, ordinary runtime commerce remains read-only, and the executor cannot mutate entitlement grants. The shared `commerce-v1` API and iOS storefront observer still expose only server-owned current access and fail-closed route evaluation.

Stripe Account `acct_1U6B2RCxTlowhyiG` remains separate from FanPass and contains only non-live test objects. A restricted `rk_test_` and endpoint-specific `whsec_` are stored separately in AWS Secrets Manager; broad `Core: Read` remains rejected. The raw-body Webhook and authenticated test-only Checkout／Portal routes are live in synthetic Frankfurt staging. One US$9.99 sandbox payment completed with synthetic data, creating test Customer／Subscription and four applied signed events. Every reconciliation kept `entitlementMutationApplied=false`, and ordinary access remains Free. Customer Portal creation and scheduled cancellation are verified. A later full test refund was resolved through authoritative Refund／Charge／Invoice Payments／Invoice／Subscription reads; `refund.updated` now applies `revoke / refunded` without entitlement mutation, and a second delivery is idempotent. No live card, real payment, saleable offer or entitlement activation exists.

The same sandbox now covers a fraudulent Dispute from created／under-review revoke through won restore, plus a subscription-linked failed renewal from `invoice.payment_failed / past_due` through successful invoice recovery to active. The restricted key adds only Payment Disputes read on top of the refund／invoice reads. These are operational test-state transitions, not revenue or entitlement evidence: ordinary plan state stays Free throughout.

**Runtime boundary, September 10:** existing US$9.99/99 Stripe, Xcode and App Store Sandbox objects and `family_usd_*_v1` records retain their original test amounts. They are not the current proposed offer. This reset changes the product decision and economic model, not provider catalog, API or deployed price UI. Before customer exposure, use distinct prospective price codes bound to the actual capability version. Do not relabel receipts or mix old/new offers. Ordinary billing remains closed. Necessary work follows AGENTS default authorization; missing personal interaction, merchant facts and production evidence remain separate.

## How The Research Rounds Fit Together

The two reports answered different layers of the same decision:

| Research round | Primary question | Evidence produced | Decision role |
| --- | --- | --- | --- |
| Initial feasibility and global scan | Should this product exist, for whom, and within what legal/security boundary? | Problem exposure, competitors, platform rules, global legal cautions, user hypotheses, map-not-password and non-automatic-release boundaries | Defines what Rillora is allowed to become |
| Free/paid and pricing round | Inside those boundaries, what ongoing responsibility is worth paying for, and how should subscription lifecycle work? | Ethical free baseline, paid value drivers, current price anchors, monthly/annual/trial/refund/cancellation patterns | Defines how Rillora may earn revenue without weakening trust |
| Unit economics and fundability round | Can the price support cost of revenue, retention, acquisition, compliance and a diligence-ready business? | Channel fees, contribution/reporting gross margin, LTV/CAC sensitivity, break-even, runway and finance-data contract | Defines the economic conditions required before scale, financing or acquisition claims |

The first round remains distributed across [`research.md`](research.md), [`product.md`](product.md), [`mvp.md`](mvp.md) and [`trust-safety-legal.md`](trust-safety-legal.md). This document combines its conclusions with the second round and becomes the focused packaging/subscription authority. The third round is governed by [`unit-economics.md`](unit-economics.md); neither document replaces the underlying evidence register.

## Evidence Boundary

The current prices below were checked on official public pages or an official product API on 2026-08-13. They are snapshots and can change. Competitor packaging proves that price points exist, not that Rillora users will pay them or that the competitors have healthy retention.

Rillora has no external payment, subscription, retention, refund, trial-conversion or support-cost data. Owner has paused external testing. Therefore:

- the free/paid trust principles and forward-compatible catalog shape are product decisions;
- exact prices, limits, trial timing and price-localization rules remain `PROVISIONAL`;
- no payment button, App Store product or external billing contract is authorized by this document;
- any real payment claim still requires transaction-level evidence and the market gates in [`mvp.md`](mvp.md).

## Commercial Thesis

The first broad report identified a continuing problem: a static document becomes stale while accounts, debts, devices, roles and platform policies change. The paid value is therefore not “a list in the cloud.” It is Rillora accepting recurring responsibilities:

1. keep a household plan coordinated across people and roles;
2. detect staleness and guide review after life or platform changes;
3. preserve version history and show what changed;
4. rehearse exactly what different roles would see under different events;
5. package selected information for later lawful action;
6. provide bounded human help where a separately priced service can be operated safely.

The recurring price is justified only while those recurring responsibilities are real and evidenced. Storage volume alone is not the value proposition.

## 2026-09-10 Packaging Resolution — Current

**Latest correction:** shared review is a supporting capability, not sufficient US$99 core value. The main route is a smaller self-service offer at US$49/year or US$6.99/month for controlled validation. Do not expand review dashboards or contacts merely to defend99. The assisted-capture, substantive-change and action-workspace extension is unbuilt, conditional and separately costed in [unit-economics.md](unit-economics.md).

**Implementation checkpoint after Owner's “直接规划并落实”:** the
[shared-maintenance slice](family-maintenance.md) is now implemented and deployed
as an explicitly enabled synthetic-staging preview. It includes scoped requests,
recipient checks/issues, one designated suggestion contributor, owner-approved
provider/location corrections, their before/after history, recurring in-product
review dates and a safe shareable inbox link. This supersedes earlier “nothing
implemented” wording only for that slice. It does not complete full co-owner
editing, all-plan history, external reminders, numeric sharing enforcement or the
paid-cutoff live/archival lifecycle. Ordinary billing stays closed.

The permanent Free / single Family structure and Free's one-person complete path were already discussed and recorded. This review clarifies what a “person” counts as after account-bound invitations were added. **The numbers below are launch-design hypotheses, not active purchase entitlements or a claim that quota enforcement is deployed.**

| User job | Permanent Free | Family launch target | Current implementation evidence |
| --- | --- | --- | --- |
| Organize a useful plan | Text Matter map, outcomes, official guides and manual review; no commercial item-count cap | Same baseline | Web/iOS core paths implemented; ordinary access remains Free |
| Share the plan you own | 1 outgoing relationship receiving current updates, including link/QR and acceptance | Up to 5 current-updating recipients per plan; parents, partner and friends may have different scopes | Direct sharing is implemented and deployed to synthetic staging; **plan-based count enforcement is absent**; archival access mode is not implemented |
| Choose what each person sees | Every included recipient supports per-item Name / Directions / Details, default-private and revoke | Same privacy controls for all included recipients | API field projections and local B/C isolation verified; real-provider recipient acceptance remains open |
| Receive someone else's plan | Free Web/iOS acceptance and authorized reading; whether content is live or an authorized saved version depends on the owner's access | Identical; recipients do not buy seats | Receiver flow implemented; received relationships do not consume an outgoing allowance; no commercial snapshot mode exists yet |
| Maintain together | Planner edits their own plan | 1 scoped contributor suggests provider/location corrections; owner approves | This bounded contributor flow is implemented in preview; full co-owner editing is outside the smaller launch promise |
| Keep the plan current | Manual checks and basic non-operative rehearsal | Joint checks, in-product due dates and approved-correction history | Implemented preview scope; external automation and all-plan history are outside the smaller launch promise |
| Rehearse and prepare | Existing basic/field-level safety previews and Start Here export remain Free | Saved comparisons and coordinated multi-person review when implemented | Existing role simulation must not be removed or relabeled paid; no real-event release is open |
| Trust and exit | Authentication, privacy, safe export, deletion and basic recipient retrieval | Identical baseline | Each claim keeps its existing security/operational evidence boundary |

**Why 5:** it covers a concrete small network such as two parents, a partner, a sibling and a friend without adding a second paid tier or promising unlimited service. It is an Agent-selected, reversible `PROVISIONAL` allowance, not customer research. Validate actual household needs and cost before publishing; change it through a new catalog/plan version, never by editing a purchased version. The additional co-planner seat is separate from the five read-only recipient slots. If the same account already collaborates, do not charge a second seat merely to show the same authorized plan. Neither role grants access to another household member's otherwise private matters.

### Exact counting and upgrade boundary

- Count outgoing relationships receiving current updates plus unexpired pending reservations on the owned plan. Do not count address-book records, typed names, event-role assignments, invitation URLs, selected matters or received shares. An accepted relationship with only an existing paid-term saved copy has archival access, not an extra live slot. Saving contact names stays available.
- An accepted live relationship or an unexpired pending reservation consumes one slot, even with empty grants. Expiry/revocation frees a reservation; regeneration of the same pending invitation does not add one. Reactivating an expired or archival relationship must recheck the live allowance. Acceptance status, commercial live/archival mode and disclosure scope are separate states.
- Prevent duplicate active invitations to the same verified target on the same plan. Reissuing and accepting are idempotent for that relationship; a different account still requires explicit matching and acceptance. Email remains an address check, not an account-merge key.
- Check quota server-side in the same transaction as reserving/creating/reactivating a connection, serialized per owned plan. Client counts and payment callback results cannot authorize access. A failed or cancelled upgrade preserves the contact and scope draft and changes no existing permissions.
- At the second outgoing invitation, preserve the selection and offer the specific Family benefit only when an eligible purchase route actually works. Offer return/keep-draft and deliberate replacement of the included connection; never silently revoke the existing person. A replacement's release/reservation is atomic.
- While ordinary billing and paid entitlements are closed, do not switch synthetic staging to a dead-end “pay to invite” wall. Its existing multi-recipient QA access is development evidence, not a Free commercial promise or purchased Family. Before public billing, migrate/version the catalog, enforce limits and verify both platforms together.
- Per-item privacy levels, previewing exactly what someone sees, making a matter private and revocation are always included. Advanced Family packages mean additional coordination/history, never an upsell to avoid oversharing.

### Recurring value and expiry

The Family promise is a maintained shared plan: the right people can find the right directions, changes are reviewed, and unresolved preparation is visible. A contact-count unlock alone is too weak a basis for assuming US$99 annual retention. Co-planning plus a real review/change workflow must work on Web and iOS before advertising that bundle as sellable.

**Owner follow-up correction, 2026-09-10 — supersedes the earlier same-day live-read survival proposal.** The Owner correctly identified that preserving continuing updates for all accepted recipients would let one paid month buy lasting multi-person service. Preserve access to data already made available, while ending the extra ongoing service. This is a revised `PROVISIONAL` launch design; commercial archival snapshots are **not implemented** and must be built/verified before charging for this behavior.

| State at the paid term's end | What remains | What stops |
| --- | --- | --- |
| Planner's own account | Own core text stays readable, editable and exportable under Free; privacy/revoke/delete controls remain | Paid co-planning/automation, additional live recipient slots and future paid history capture |
| One owner-designated Free recipient | Current permitted content continues to update | Nothing from the Free sharing baseline |
| Other recipients who accepted during the eligible paid term | Their last authorized paid-term version remains readable, labeled with its actual saved date and `Updates paused` | New/revised matters, newly granted fields, live change feeds and continuing shared updates |
| Pending recipients above the Free allowance | Invitation/contact draft retained without content disclosure | Acceptance cannot activate above-limit access or create an archive for someone who had never accepted |
| Existing scoped co-planner | Their already-authorized data remains retrievable; live reading uses a selected Free recipient slot or a paid-term saved version | Editing the owned plan on someone else's behalf |
| Previously generated history/export | Existing authorized outputs remain readable/exportable under the existing retention and privacy contract | New paid comparisons/history versions and scheduled review service |

Turning off renewal does not end the purchased period. Use the provider-authoritative end timestamp; no loss of paid features at the cancellation tap. Before expiry, show the effect and let the owner designate the one Free live recipient. If no choice exists, keep accepted recipients on their eligible saved versions and ask the owner to choose; do not auto-select a family member, broaden permission or delete data. Routine cancellation grants no repeatable extra full-service grace; failed-payment grace, if used, is bounded and tied to the original provider entitlement window.

Saved access covers only information the same bound recipient was already authorized to read during the eligible paid period. It follows the existing account/data retention contract and is not a promise of perpetual hosting. Owners can revoke or narrow it for free. Never-disclose, removal of a grant, archive/deletion of a source matter and account deletion invalidate/redact the relevant hosted saved content; restoration of a field does not silently restore an old grant. A later broader permission setting cannot add fields or fresh values to a saved version. Information already copied outside Rillora cannot be recalled.

Technical prerequisite: keep a bounded, per-recipient permitted projection/version while the paid access is eligible and seal it at the server-authoritative cutoff. Do not build the saved copy lazily from whatever the plan contains when a delayed job or first post-expiry read runs. Reads must resolve live/archival/none with identity and current restrictive permissions, including cache/offline labeling and revalidation. Missing snapshot evidence cannot fall back to unrestricted live reads. Verify this path before enabling a paid offer; do not impose an unimplemented freeze on current synthetic staging.

### Legitimate monthly use and avoidance of entitlement bypass

- A user may buy one month, cancel renewal, and use/export the work completed in that paid month. That is a valid monthly purchase. A later one-month resubscription may legitimately refresh the plan during that new paid period. Do not invent a cancellation penalty, make export paid or impose a hidden minimum term to turn every such user into an annual subscriber.
- Enforce ongoing Family capability at every relevant server read/write and background job, not only when creating a contact. The app, Web, APIs and scheduled work must resolve the same versioned entitlement and clock; a hidden button, changed device time, old token or replayed callback cannot extend it.
- Free slot replacement atomically stops the old live relationship before enabling the new one. It never mints a new continuing entitlement or refreshed paid archival copy for the old person. An existing paid archive keeps its paid cutoff. Manual serial sharing/copying cannot be completely prevented while users own their data; prevent multiple concurrent live grants and automated mass replacement rather than claiming absolute control over copied information.
- Repeated cancel/restart must not reset expiry/grace, produce additional live slots or duplicate subscriptions. One provider subscription/transaction binds to one authorized Rillora household plan. Existing server reconciliation, idempotency and identity rules still apply.
- Disabled trials stay disabled; if an introductory offer is ever introduced, its eligibility must not reset on reinstall/logout. Do not add invasive device tracking or household bans based on shared IP addresses. Mandatory refund rights remain unchanged.
- Repurchasing Family does not itself broaden disclosure. The owner reviews/resumes the selected relationships and field scopes; revoked contacts are not silently restored. Any new recipient still explicitly accepts.

The value to validate is **ongoing multi-person updates, scoped co-editing and a working review/change cycle**. Before selling the bundle, demonstrate a concrete loop: the owner changes a direction -> only the permitted people see the change -> a scoped collaborator reviews/corrects it -> the owner sees what changed and what still needs review. A review acknowledgement means that action occurred, not that legal authority or true comprehension is proven. Extra contact rows and generic reminders alone do not establish annual value.

If many customers need only occasional one-month service, treat that as evidence about product/price fit. Measure paid-service use, meaningful 30/90-day joint maintenance and reasons for cancellation; do not hide the result by calling ordinary monthly use abuse. US$99/year remains unvalidated.

Reference checked on September 10: [1Password's lapse policy](https://support.1password.com/frozen-account/) keeps item viewing/copying while disabling new/edit/invite functions. [Apple's iCloud+ downgrade policy](https://support.apple.com/en-us/108318) ends a cancelled plan at the billing-period boundary and pauses syncing/updating when the new storage allowance is exceeded. These illustrate separating retrieval from continuing service; Rillora does not inherit their terms or restrict its own Free editing baseline.

### Evidence, price and willingness-to-pay test

On 2026-09-10, [Everplans' own FAQ](https://www.everplans.com/faq) lists a three-item Free allowance and US$99.99/year Premium. [Trustworthy's pricing](https://www.trustworthy.com/pricing) lists Free with one family member and Silver at US$10/month billed annually with five; its all-plan baseline includes security/privacy and download. These are external packaging examples, not equivalent entitlement units, independent security validation or evidence that Rillora customers will pay. Rillora deliberately preserves the complete lightweight text map. [Apple 3.1.2](https://developer.apple.com/app-store/review/guidelines/#subscriptions) also requires ongoing subscription value and a clear description of what the price buys; it does not pre-approve Rillora.

Use the prospective US$6.99/month or US$49/year hypothesis and show the complete annual charge, with an optional US$4.08 monthly equivalent. Old US$99 test objects are historical; they do not define the current offer. Do not add an extra tier, lifetime promise, automatic trial, fabricated discount or new refund guarantee. Free supplies the initial experience; the disabled no-card preview is not activated by this review.

Validate in order, when real-user/payment gates are ready:

1. **Value before price:** a new planner records useful matters, one designated recipient accepts and can locate the selected directions. Invite generation, page views and simulated identities are not this outcome.
2. **Paid intent:** observe eligible activated households attempting a second recipient, inviting a co-planner or scheduling a substantive review. Show a short scope diagram and three concrete benefits in the existing Plan & access destination; no public-home sales wall or long feature article.
3. **A fixed cohort:** retain the MVP's first 30–50 testers and at least three real payments as operational signals only. Record the chosen interval, exact price/plan version and any bounded founder cell before exposure. Treat non-payment, checkout failure and lack of Family need as different outcomes; no per-person improvised price negotiation.
4. **Conversion denominator:** paid households / eligible activated households shown the actual offer during a fixed 30-day window. Report the count as well as the rate, and separately report payment completion and first use of a paid feature. Choose a go/no-go target before that cohort opens; competitor prices provide no conversion benchmark.
5. **Retention evidence:** at 30/90 days, count meaningful changes, joint reviews and recipient comprehension checks, not daily opens or reminder clicks. Report cancellations, refunds, support minutes and one-month setup-only use by price cohort. Annual renewal remains unknown until an actual eligible year passes.

No external recruitment, messages, live charge, tracking deployment or market experiment occurred in this review. The source audit and drift corrections are saved in [the packaging QA record](../output/qa/rillora-packaging-review-20260910/README.md). Invitation audit events currently exist, but the pricing/acceptance/retention measurement pipeline is not implemented; use the event contract rather than treating audit logs as validated product analytics.

## Free Baseline — LOCKED Principles, PROVISIONAL Limits

Free must be useful enough to reduce real preparation risk and to let a person judge Rillora without a payment card.

### Always free

- public guidance for Apple Legacy Contact, Google Inactive Account Manager and other provider-owned setup;
- a lightweight text-based Matter map and basic desired-outcome recording;
- one outgoing trusted-person relationship, including the full invitation/acceptance path and all per-item privacy controls when available; contact records and incoming shares do not consume it;
- a basic non-operative rehearsal and readiness gaps;
- Start Here basic export and account/data export;
- authentication, account recovery, security controls, privacy controls and account deletion;
- recipient access to information already validly made available to that recipient;
- a reasonable retrieval path after any paid plan expires.

The launch recommendation is **not** to imitate three-item paywalls. Text Matter rows have low marginal cost and a complete lightweight map is part of Rillora's safety promise. Exact anti-abuse limits can use rate limits and attachment allowances rather than making the eleventh or twentieth existence record disappear behind a paywall.

### Never paywall

- stronger authentication or the minimum safe encryption required by the product;
- export or deletion needed to leave Rillora;
- proof/status explanations needed to understand whether a role, invitation, claim or release is valid;
- a recipient's basic ability to receive or retrieve an already-authorized package;
- cancellation, billing history or changing auto-renewal;
- platform-native instructions whose underlying capability is free.

## Launch Offer — One Paid Tier, Two Billing Periods

`Free` is a durable baseline. The only paid entitlement offered at launch is `Rillora Family`.

| Offer | Launch visibility | Price hypothesis | Intended value |
| --- | --- | ---: | --- |
| Rillora Free | Visible | US$0 | Complete lightweight map, one trusted-person path, basic rehearsal, official guides, basic export and all baseline trust controls |
| Rillora Family monthly | Visible when billing opens | Prospective US$6.99/month | Same verified entitlements; no minimum term |
| Rillora Family annual | Visible when billing opens; full annual amount | Prospective US$49/year | Same verified entitlements; US$4.08 monthly equivalent, 41.6% below twelve monthly payments |
| Personal | Hidden/dormant | No active price | No additional launch tier; US$39/59 are comparisons for the same Family scope |
| Human setup/review | Hidden/dormant add-on | Preliminary US$199–299 research range only after time-and-motion evidence | Bounded setup or review with a separate services P&L, excluding legal advice and real claim handling |

Monthly and annual products share the same entitlement set. Billing interval must never change security, data ownership, recipient rights or feature quality.

### Intended `Rillora Family` entitlements

- one scoped suggestion contributor; the owner approves provider/location corrections, with no full co-owner permission implied;
- up to five outgoing current-updating trusted-person relationships as the provisional launch allowance, with independent scopes and no charge to recipients;
- joint checks, actionable recipient issues and configurable in-product review dates;
- before/after history for approved review corrections, not every edit to the full plan;
- coordinated advanced packages, adaptive external reminders and all-plan history are deferred extensions, not included launch benefits; baseline per-item privacy and existing safety rehearsal remain Free;
- encrypted attachments only in a later evidenced capability version after their production security gate is complete;
- priority product support only after response expectations and operating capacity are defined, excluding legal advice and real-event case handling.

These entitlements describe the target, not current implementation. Attachments and priority support are not part of the minimum launch promise merely to lengthen the comparison. A capability cannot appear as available in a sellable paid comparison until the corresponding product, security and operational evidence exists. A deliberately opened planned-feature preview must identify its unavailable state.

## Commercial UI Contract — LOCKED Principles, PROVISIONAL Copy

- Public, signed-out top-level and account-choice entry points use task and account language, not `Free plan`, `no card`, plan-name or price promotion. Account creation does not start a paid trial or subscription; the product should demonstrate that through the absence of billing and through truthful lifecycle behavior, not by turning Free into the primary conversion label.
- The complete Free/Family comparison lives in one `Plan & access` destination, but it is not promoted from the public homepage, signed-out `Matters`／`More` or Account choice. It appears only after explicit plan-review intent inside the authenticated workspace, or after the user attempts a named Family capability. That contextual destination may explain the offer before authentication, but purchase and entitlement use still require the appropriate identity and server-owned authorization. No fourth phone-level tab is added.
- Free is presented as a durable foundation, not a disabled demo. The interface must not scatter crowns, lock badges or upgrade banners across baseline preparation and trust controls.
- Family prompts appear only after a user expresses intent toward a capability whose ongoing collaboration or maintenance value is actually paid. A prompt names that capability and the current billing state; it does not use a generic `Premium` wall.
- Until server entitlements and billing exist, all customer-facing comparison surfaces say `planned`, `pricing preview` and `billing is not open`. Development access to unfinished capabilities is not described as a purchase or subscription.
- The global research preview labels the current hypothesis explicitly as `US$`; a live storefront must use the catalog currency and localized display returned for that storefront rather than inheriting this prototype string.
- The client cannot authorize from hard-coded feature copy. Availability must come from the shared versioned capability result; offline or failed entitlement resolution fails safely without hiding Free data or exit controls.
- Continuity-plan state, identity/session state and commercial subscription state use different labels. `Plan active` cannot stand in for `subscription active`.
- Downgrade explanation remains visible before purchase: the core map stays readable/exportable and security, deletion and already-authorized recipient retrieval remain available.

The focused implementation audit and remaining UI gates are recorded in [`free-paid-ui-audit.md`](free-paid-ui-audit.md).

## Long-Term Catalog Designed Now, Activated Later

| Catalog family | Future role | Launch state | Migration rule |
| --- | --- | --- | --- |
| `free` | Individual safety baseline | Active | Never removed merely because paid tiers change |
| `personal` | Lower-cost solo maintenance | Dormant | May be introduced below Family; must not strip existing Family customers |
| `family` | Household collaboration and advanced maintenance | Only launch paid tier | Versioned price and entitlements; current customers retain the purchased term |
| `care_addon` | Human setup or annual review | Dormant and separate from software tier | Price from actual labor/insurance/partner cost; never silently bundled into an unsustainable promise |
| `professional` | Advisor/employer/partner distribution | Separate dormant catalog | Separate buyer, contract, consent, tenancy and support model; not a consumer tier |

Do not launch a “lifetime” plan. Decades of storage, security maintenance and recipient availability cannot be promised without a funded long-term fulfillment structure.

## Entitlement And Price Architecture — LOCKED

The system must separate four concepts:

1. **Plan** — the named entitlement bundle, such as `family`.
2. **Plan version** — the immutable capability/limit set accepted by a customer.
3. **Price** — currency, amount, billing interval, region and effective dates.
4. **Subscription state** — trial, active, grace, cancellation or expiry status.

Minimum provider-neutral records:

- `catalog_product_code`
- `plan_code` and immutable `plan_version`
- `capability_code`, allowance and enforcement mode
- `price_code`, amount, currency and `monthly|annual|one_time`
- `storefront` and external provider product/price identifier
- country/region, tax behavior, effective dates and visibility
- introductory-offer/trial policy code and eligibility result
- household subscription, payer, current period and renewal preference
- state history, refund state, grace end and scheduled downgrade
- explicit entitlement override with reason, issuer and expiry

Rules:

- never use one boolean such as `isPremium` as the authorization source;
- clients may render entitlements but the server decides them;
- provider price IDs never appear in business authorization logic;
- features, limits and billing periods change independently;
- price changes create a new `price_code`; historical invoices keep their original price;
- adding future tiers must not reinterpret an existing purchase or silently downgrade its entitlements;
- Web and iOS resolve the same Rillora entitlement, even when storefront purchase mechanics differ;
- recipients are actors, not billable seats.

Recommended normalized lifecycle states:

`free -> previewing -> active -> cancel_at_period_end -> expired_read_only`

with independent payment recovery states:

`active -> grace -> past_due -> active|expired_read_only`

and terminal financial adjustments:

`refunded` or `revoked`.

No billing state can create a death, incapacity or unreachable claim, advance a disclosure rehearsal, send a recipient package or establish legal authority.

## Monthly And Annual Policy

### Launch recommendation

- display both monthly and annual totals before purchase;
- show the annual equivalent and exact saving, not only “per month billed annually”;
- recommend annual because legacy planning is maintained over years, but do not hide monthly;
- do not preselect or visually disguise auto-renewal;
- send Rillora's own annual reminders before renewal where the storefront permits it;
- let users turn off renewal self-service without contacting support;
- paid access continues through the paid term after cancellation.

The US$49 annual / US$6.99 monthly hypothesis reflects a smaller self-service scope and nearby lower-price alternatives. Monthly has an initial support burden: the base model leaves only US$0.48 contribution from a one-month purchase before CAC and fixed costs. One-month use remains legitimate. Do not buy such customers through expensive acquisition, restrict basic export or add an undisclosed minimum term. If US$49 does not convert, revisit the job and audience before further cuts or feature expansion. Full assumptions are in [unit-economics.md](unit-economics.md).

## Paid-Ready Public Release — LOCKED Sequence

Each regional first public release must have a functioning subscription path at launch. This supersedes the earlier `public Free -> later paid` sequencing, but it does not remove the permanent Free plan or permit pricing to dominate public first-use UX.

- Global and mainland releases are independent; Global may charge first while mainland remains closed.
- Public signed-out surfaces remain product-first. Price appears only after explicit plan review or a named Family capability intent.
- Global paid availability uses every market-register row that is actually ready rather than an artificial US-only launch. `USA` and `HKG` are core first-wave candidates. Global Web and US iOS may use the same Rillora-hosted Stripe Web checkout after all operating gates; the iOS link appears only after explicit plan or Family-capability intent and opens in the system browser. Hong Kong and ordinary ready non-US storefronts use StoreKit unless a separately approved route exists. StoreKit remains the App Review fallback for the US and the default adapter for non-US rows. The app reads the current StoreKit storefront immediately before merchandising; the backend separately evaluates service market, provider availability and any existing renewal provider. A household never sees two simultaneous new-purchase routes for the same Family entitlement.
- Mainland iOS uses StoreKit; mainland Web uses approved local payment products only after operator, licence/filing, data and merchant gates pass.
- A region does not publicly launch in a Free-only state merely because its billing work is late; instead, that region remains in controlled beta until the paid path and the permanent Free path are both truthful.

## Trial And Purchase-Risk Policy

### Launch: no auto-converting trial

The permanent Free plan is the initial product trial. The current direct-Web legal candidate is **non-refundable except where mandatory law applies or Rillora expressly agrees in writing**, rather than using a trial that silently begins charging. Reasons:

- users can already experience the core product without a card;
- trusted people, role assignments and retained data make trial expiry more sensitive than in a content app;
- a paid-feature trial adds entitlement-expiry edge cases before Rillora has conversion or support evidence;
- competitor patterns show both viable models: free tiers plus guarantees, and 14-day trials in adjacent security software.

The previously designed 30-day first-purchase guarantee is not active and must not appear in the offer unless the Owner explicitly reactivates it and the market-specific policy, fraud controls and support workflow are ready. App Store refunds are requested from and decided by Apple; Rillora must not promise to override that process. Any future Google Play or other storefront must use its mandatory refund channel.

### Future experiment: designed but disabled

The catalog supports one **14-day Family preview**, preferably without a payment card, activated only after the user has created a meaningful plan or explicitly opens a paid collaboration feature.

- one preview per household, enforced across Web/iOS identity;
- no human service, real claim handling or release capability;
- reminder before expiry;
- no surprise charge in the no-card variant;
- safe downgrade to Free with export and core plan access preserved;
- controlled by a feature flag and separately measured from permanent Free usage;
- an App Store introductory offer, if later used, must clearly show duration and post-trial price and follows Apple eligibility rules.

Do not enable the preview merely because the data model supports it. The go-live gate is a tested expiry/downgrade flow plus a specific conversion hypothesis.

## Cancellation, Payment Failure And Safe Downgrade

### Voluntary cancellation

- turn off renewal immediately;
- keep paid entitlements until the current period ends;
- downgrade to Free at term end;
- keep core text records readable and exportable;
- preserve basic recipient retrieval: one designated Free live relationship and already-authorized paid-term saved versions for the others, under the current provisional expiry contract;
- never delete the account as a side effect of cancellation.

### Payment failure

- enter a bounded billing grace state and request payment correction;
- do not treat billing failure as inactivity, death, incapacity or consent;
- after grace, resolve commercial access to Free/live-one plus eligible saved versions rather than deleting data; a ledger `expired_read_only` state does not disable the owner's baseline text editing;
- no new paid-only uploads or collaborators after downgrade;
- over-limit attachments remain download-only for a defined retrieval period before any separately notified retention action.

The precise attachment retrieval period must be finalized before production attachments launch; the current design target is at least 180 days with advance notices. Core map/export/recipient-access rights do not depend on that attachment allowance.

## Refund And Renewal Baseline

For direct Web billing, the current candidate is:

- non-refundable after purchase except where mandatory law applies or Rillora expressly agrees in writing;
- self-service cancellation and visible next-renewal date;
- advance annual-renewal reminder;
- clear handling for accidental renewal, duplicate charges and service outage credits;
- no refund promise that conflicts with mandatory local consumer rights.

For App Store billing, Apple manages purchase, cancellation, refund eligibility, tax collection and price points under the applicable storefront. A future Google Play or other storefront follows that provider's mandatory channel. The backend must reconcile signed storefront events and keep one Rillora entitlement without allowing duplicate subscriptions to produce duplicate charges or contradictory access.

## Global Pricing And Storefront Boundary

Launch pricing should have one USD reference price and explicit storefront-specific price records. Do not store a single floating-point “global price.”

- amount is stored in minor currency units;
- storefront price and tax-inclusive display may differ by country;
- local currency display must come from the active storefront or reviewed price table;
- purchasing-power or regional discounts are future experiments, not an automatic exchange-rate conversion;
- Web and App Store net revenue will differ because of processor/store fees and taxes;
- Apple currently provides country/region price points and comparable local prices, but Rillora still owns entitlement consistency;
- eligibility for Apple's 15% Small Business Program must be verified before using it in margin forecasts.

The provider-neutral checkout architecture is implemented locally and disabled. Provider activation remains a separate implementation and operating gate because App Store purchase rules and regional alternatives change. The catalog therefore treats `web`, `apple_app_store` and future storefronts as adapters, not as separate plans.

### Individual-operator channel decision

The launch operator remains an individual through first public release. This changes provider routing but not the Free/Family catalog:

- iOS digital Family access uses a versioned storefront policy: the US storefront may use a system-browser Rillora Web checkout under the current external-link rule; Hong Kong and other ready non-US storefronts use StoreKit or expose no in-app purchase CTA unless a current documented regional entitlement applies;
- Global Web keeps a provider-neutral adapter. Stripe HK direct is now the primary technical candidate only after a genuine Hong Kong business-permission/registration/bank/tax/KYC chain is proven; Paddle remains the lower-operations Merchant-of-Record fallback after identity, domain, product and payout acceptance;
- Stripe Managed Payments is a conditional third route, not a mainland solution: it is currently public preview and lists China as a restricted customer country;
- Lemon Squeezy is only a contingency after actual identity and payout acceptance; no foreign address, bank, phone, paper business or false commencement may be invented to bypass onboarding;
- Merchant of Record customer-tax handling does not remove the individual's privacy, support, personal income-tax, accounting or product-safety obligations;
- Apple and Web events resolve into the same server-owned entitlement and financial journal, including duplicate-subscription detection.

The current payment/operator/region comparison is maintained in [`global-mainland-commerce-plan.md`](global-mainland-commerce-plan.md). It does not activate payment or change the rule that paid UI appears only after an explicit capability/plan intent.

No provider is selected contractually and no payment is authorized here. First markets and company-conversion continuity are governed by [`individual-operator-launch-plan.md`](individual-operator-launch-plan.md).

## Current competitor implications — 2026-09-10

The [five-product official-source comparison](competitor-ux-audit.md) adds the
lower-priced direct alternatives missing from a narrow Everplans/Trustworthy
anchor. MyLifeLedger's current main price is US$49/year, while LifeHub advertises
US$3.99/month regular and US$1.99 introductory display with annual billing. The
comparison records promotion and stale-document limits; these are not Rillora
WTP results or permission to adopt a rival's restrictions.

Member/recipient counts are not interchangeable: Trustworthy separates live
collaborators from free Legacy Access; Everplans includes paid Deputy creation;
MyLifeLedger does not position sharing as a separate add-on. Rillora's Free 1 /
Family 5 remains its own provisional design, not a market-proven quota.

Chargeable value must be assessed against the actual job completed: reduced
input/organization effort, working multi-person maintenance, substantive review
or a concrete output. Granular sharing, a map without credentials and reminders
are not unique differentiation. The US$99 hypothesis still needs task-outcome and
full-price demand evidence; model margin alone cannot justify it. No new price,
annual-only switch, trial, paid gate or runtime capability is introduced here.

## Historical Pricing Evidence — Snapshot 2026-08-13

| Product | Public consumer price observed | Trial/risk reducer or lifecycle note | Rillora interpretation |
| --- | ---: | --- | --- |
| MyLifeLedger 1.0 | Free; US$39/year Premium | No-card Free; cancellation returns to Free | Low-end lightweight organizer anchor; 2.0 price pending |
| Quicken LifeHub | Regular US$3.99/month equivalent, annual billing | Current first-year promo lower than regular | US$47.88 regular annual organizer anchor; ignore promo as durable price |
| DGLegacy | US$9.99/month or US$95.88/year Gold | 90-day guarantee; cancellation preserves account and reverts to Free | Direct category monthly/annual pattern; its trigger/password model is not a product model for Rillora |
| Everplans | Free up to 3 items; US$99.99/year Premium | Annual only on the current FAQ | Direct category upper anchor; item wall should not be copied |
| Trustworthy | Free; US$120/240/480 yearly tiers | Multi-tier household/concierge packaging | Proves higher willingness hypotheses require materially broader service |
| GoodTrust Estate+ | US$149 first year, then US$39/year updates | Active subscription required to edit/download | Legal-document bundle, not a direct software anchor; download lock is an anti-pattern |
| 1Password Families | US$5.99 monthly or US$4.49/month annual equivalent | 14-day free trial | Adjacent high-trust family-software billing anchor |
| Bitwarden Families | US$47.88/year | Permanent Free and a Families trial | Adjacent safety tool shows useful Free can coexist with paid family value |

Official sources:

- [Everplans FAQ](https://www.everplans.com/faq)
- [MyLifeLedger pricing](https://www.mylifeledger.com/pricing)
- [Trustworthy pricing](https://www.trustworthy.com/pricing)
- [GoodTrust Estate+ pricing](https://support.mygoodtrust.com/support/solutions/articles/66000513649-how-much-does-goodtrust-cost-)
- [DGLegacy plan API](https://app.dglegacy.com/api/1/membership-levels) and [refund/cancellation FAQ](https://www.dglegacy.com/questions-and-answers/)
- [Quicken LifeHub](https://www.quicken.com/products/lifehub/)
- [1Password personal/family pricing](https://1password.com/pricing/personal)
- [Bitwarden pricing](https://bitwarden.com/pricing/)
- [Apple subscription review rules](https://developer.apple.com/app-store/review/guidelines/)
- [Apple introductory offers](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions)
- [Apple subscription pricing and storefronts](https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/in-app-purchase-and-subscriptions-pricing-and-availability)
- [Apple refund request](https://support.apple.com/en-ie/118223)
- [Apple Small Business Program](https://developer.apple.com/go/?id=app-store-small-business-program)
- [Apple Legacy Contact](https://support.apple.com/en-euro/102631)
- [Google Inactive Account Manager](https://support.google.com/accounts/answer/3036546)

## Subscription Consent And Refund Candidate

Registration Terms acceptance never authorizes a recurring charge. Before any Web or StoreKit purchase, the offer must separately show the exact capability, billing period, full price／currency, tax treatment when known, automatic-renewal frequency, how and when to cancel, refund／withdrawal boundary and provider. Consent must be affirmative and retained with the offer／document versions and transaction reference; no prechecked control, silence or hidden footer term is sufficient.

The current direct-Web candidate for every approved Stripe market is non-refundable except where mandatory law applies or Rillora expressly agrees in writing. Cancellation stops the next renewal and ordinarily preserves Family through the current paid period; it is not a retroactive prorated refund. Duplicate, unauthorized or materially defective charges receive a support investigation and may be corrected／refunded without creating a general discretionary-refund promise. Apple controls App Store refund decisions. A future Google Play or other storefront follows that provider's mandatory refund channel. Public sale remains closed until the role support email, self-service cancellation, purchase confirmation and this separate clickwrap are operational.

The account legal bundle now contains Subscription Terms and Refund & Cancellation Policy but purchase UI acceptance is not yet implemented because ordinary billing remains closed. This legal drafting does not reopen sales or mutate entitlements.

## Validation Plan

Pricing remains a hypothesis until users face a real, comprehensible offer.

### Before payment activation

- retain the locally verified provider-neutral entitlement／finance model and Phase 1A synthetic signed-event contract; never let a callback or client result grant access by itself;
- replace the synthetic-only verifier with the selected provider's official production verifier, retrieve authoritative current provider state, and execute mutations through a separately reviewed least-privilege database role;
- preserve the completed replayable reconciliation coverage for idempotency, out-of-order event, refund, dispute, cancellation, grace, revocation, duplicate-subscription conflict and safe downgrade when the real adapter is introduced;
- make the comparison table truthful to shipped capabilities;
- test monthly/annual display, renewal disclosure and cancellation copy;
- verify Web/iOS resolve one entitlement and cannot double-subscribe silently;
- complete payment, tax, privacy, refund and App Store review decisions;
- ensure payment lapse cannot enter any claim/release state.

### First market test

- keep one paid tier so the test measures willingness, not choice overload;
- expose both billing periods, immutable `price_code` and any founder/full-list cohort and record which was selected;
- record pricing view, checkout start, successful subscription, gross billings, tax, fees, refund, cancellation, direct support time and 30/90-day meaningful review without sensitive plan content;
- use the first three real payments among 30–50 invited testers only as an operational continuation signal; require a later full-list cohort before meaningful paid acquisition or fundability claims;
- interview non-purchasers about value and trust without changing prices per person ad hoc.

### First decisions after evidence

- if activated users want maintenance but reject household collaboration, consider activating dormant `personal`;
- if Family converts but human setup demand is strong, price `care_addon` from measured labor and risk rather than hiding it inside Family;
- if monthly dominates because users fear annual commitment, improve trust and renewal clarity before increasing the annual discount;
- if refund/cancellation is unusually high, investigate offer comprehension and capability truth before experimenting with lower prices.

## Open Gates

- distinct prospective US$49/US$6.99 price versions and truthful screens, followed by real purchase and cost evidence;
- no active founder offer; any future promotion needs its own cohort, term and renewal promise;
- actual operator／merchant onboarding and provider selection for the first market;
- Stripe test-card／signed Webhook／authoritative lifecycle／no-entitlement-mutation evidence is complete. StoreKit has the full Xcode-local lifecycle plus non-live App Store Connect group／products, eight representative storefronts and two retained purpose-limited testers. Official Apple PKI verification, device／notification intake, Server API signed-status normalization and durable no-entitlement reconciliation are implemented locally. The earlier Pro Max unavailable result was caused by stale Xcode-local StoreKit routing; clean iOS 26.4／26.5 Simulators now load the real USA annual／monthly catalog. Chrome final IAP credentials are secured locally, construct the official Sandbox client and receive Apple's bounded `4040010` authenticated response; two earlier no-private-file keys were revoked and Apple retains one active key. A Debug-only purchase scheme keeps transactions unfinished until durable server acknowledgement. Tester credentials were submitted after Owner confirmation, but three independent account attempts across both runtimes all failed in Apple's post-AuthKit persistence layer with `AMSErrorDomain 100 / Password reuse not available for account`; therefore no transaction exists. One automation-exposed replacement tester was deleted and rotated. Apple-enabled AWS has not been deployed, StoreKit Sandbox ledger rows／mutations remain zero, and no completed real Sandbox purchase／restore／notification, App Review or ordinary access mutation exists;
- first launch countries, tax/Merchant-of-Record responsibilities and local consumer terms;
- validate the provisional Free 1 / Family 5 outgoing allowance against household need and cost; implement transactional counting, pending expiry, upgrade cancellation and the explicit safe-downgrade contract before public enforcement;
- attachment retention after downgrade;
- real-event human support scope, insurance and jurisdiction coverage;
- activation of any trial, discount, promotional code or regional price;
- actual market demand, conversion, retention and unit economics.

The focused unit-economics, runway, accounting-boundary and diligence gates are maintained in [`unit-economics.md`](unit-economics.md) and the linked editable workbook.
