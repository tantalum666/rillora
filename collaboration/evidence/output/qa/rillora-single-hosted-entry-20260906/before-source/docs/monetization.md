# Rillora Commercial Model And Pricing Contract

Role: canonical commercialization, packaging and subscription-lifecycle contract  
Authority scope: free/paid boundary, launch offer, future tier architecture, billing periods, trials, refunds and safe downgrade  
Superseded by: later Owner decision recorded in `docs/decision-log.md`  
Do not use for: proof of willingness to pay, legal/tax advice, current implementation, App Store approval or payment-provider selection  
Status: LAUNCH PACKAGING LOCKED; STRIPE PHASE 1C TEST LIFECYCLE COMPLETE; STOREKIT SK0 COMPLETE, LIVE USA SANDBOX CATALOG LOADED AND SANDBOX SERVER／PURCHASE BRIDGE VERIFIED LOCALLY; APPLE CREDENTIAL LOCAL COMPLETE; TESTER LOGIN／PURCHASE COMPLETION／SALES／ENTITLEMENT MUTATION／DEPLOYMENT／REVIEW／LIVE COMMERCE CLOSED; EXACT PRICE AND OFFER POLICIES PROVISIONAL  
Last reviewed: 2026-08-25

## Executive Summary

Rillora should charge for ongoing coordination work that it performs, not for information that users can already configure for free through Apple, Google or another provider, and not for baseline security, export or recipient access.

The launch catalog is deliberately simple: a permanent `Free` plan and exactly one paid entitlement tier, `Rillora Family`. The paid tier has two billing periods, not two product tiers. For paid-launch planning, the primary standard-price hypothesis is now **US$9.99 monthly** or **US$99 annually**, a **17.4%** saving versus twelve monthly charges. **US$6.99/month or US$59/year** remains only a bounded founder/willingness-to-pay cell; the former US$8.99/month or US$89/year center is retained as a downside sensitivity rather than the default. All prices remain research hypotheses, not validated market truth and not authorization to create products or activate payments.

The product and data model must nevertheless support future `Personal`, `Family`, human-service add-ons and a separate professional catalog. Entitlements must be capability-based and versioned; no client or API may reduce the model to `isPremium`.

Rillora already has a meaningful free plan, so the recommended launch does **not** use an auto-converting paid trial. The current direct-Web candidate is non-refundable except where mandatory law applies or Rillora expressly agrees in writing; the former 30-day first-purchase guarantee remains only a dormant experiment and is not promised by the current legal candidate. A 14-day paid-feature preview also remains designed but disabled until activation and conversion behavior can be measured. App Store and any future storefront refund process, taxes and local consumer rights remain controlled by the applicable channel and law.

The provider-neutral model and official Stripe test boundary are now deployed without opening sales. Migrations `0022–0026` define the versioned catalog, capability, integer-minor-unit price, market/storefront/route policy, provider test-catalog binding, subscription, entitlement and finance records plus a durable minimal provider-event inbox and independent commerce executor role. The two Global USD hypotheses remain `test_only`; every market and purchase route is disabled, ordinary runtime commerce remains read-only, and the executor cannot mutate entitlement grants. The shared `commerce-v1` API and iOS storefront observer still expose only server-owned current access and fail-closed route evaluation.

Stripe Account `acct_1U6B2RCxTlowhyiG` remains separate from FanPass and contains only non-live test objects. A restricted `rk_test_` and endpoint-specific `whsec_` are stored separately in AWS Secrets Manager; broad `Core: Read` remains rejected. The raw-body Webhook and authenticated test-only Checkout／Portal routes are live in synthetic Frankfurt staging. One US$9.99 sandbox payment completed with synthetic data, creating test Customer／Subscription and four applied signed events. Every reconciliation kept `entitlementMutationApplied=false`, and ordinary access remains Free. Customer Portal creation and scheduled cancellation are verified. A later full test refund was resolved through authoritative Refund／Charge／Invoice Payments／Invoice／Subscription reads; `refund.updated` now applies `revoke / refunded` without entitlement mutation, and a second delivery is idempotent. No live card, real payment, saleable offer or entitlement activation exists.

The same sandbox now covers a fraudulent Dispute from created／under-review revoke through won restore, plus a subscription-linked failed renewal from `invoice.payment_failed / past_due` through successful invoice recovery to active. The restricted key adds only Payment Disputes read on top of the refund／invoice reads. These are operational test-state transitions, not revenue or entitlement evidence: ordinary plan state stays Free throughout.

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

## Free Baseline — LOCKED Principles, PROVISIONAL Limits

Free must be useful enough to reduce real preparation risk and to let a person judge Rillora without a payment card.

### Always free

- public guidance for Apple Legacy Contact, Google Inactive Account Manager and other provider-owned setup;
- a lightweight text-based Matter map and basic desired-outcome recording;
- one trusted-person path, including basic acceptance when real invitation capability exists;
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
| Rillora Family monthly | Visible when billing opens | Paid-launch hypothesis US$9.99/month; bounded founder cell US$6.99/month | Same Family entitlements with lower commitment |
| Rillora Family annual | Visible and recommended, not preselected deceptively | Paid-launch hypothesis US$99/year; bounded founder cell US$59/year | Same Family entitlements; standard annual is US$8.25/month equivalent and 17.4% below twelve standard monthly payments |
| Personal | Hidden/dormant | Future hypothesis US$39–49/year | Lower-cost individual maintenance; do not launch until data shows Family is too broad |
| Human setup/review | Hidden/dormant add-on | Preliminary US$199–299 research range only after time-and-motion evidence | Bounded setup or review with a separate services P&L, excluding legal advice and real claim handling |

Monthly and annual products share the same entitlement set. Billing interval must never change security, data ownership, recipient rights or feature quality.

### Intended `Rillora Family` entitlements

- one co-planner/household collaborator;
- multiple trusted people and role assignments without charging recipients;
- granular role-specific packages and advanced rehearsal;
- adaptive review reminders and plan-health maintenance;
- version history and change review;
- encrypted attachments when their production security gate is complete;
- priority product support, excluding legal advice and real-event case handling.

These entitlements describe the sellable target, not current implementation. A capability cannot appear in the paid comparison table until the corresponding product, security and operational evidence exists.

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

The US$99 standard annual hypothesis sits above lightweight organizers and within the entry range of broader digital-legacy/household systems. The move from US$89 is an economic safety margin for Apple’s 30% first-year downside, refunds, security and compliance; it is not proof of willingness to pay. US$9.99 monthly gives a lower-commitment path without making monthly and annual feel like different products. The US$59/US$6.99 cell may be used only with a predeclared cohort/date and renewal promise; it is not a sustainable permanent list-price conclusion. Full economic assumptions and break-even effects are in [`unit-economics.md`](unit-economics.md).

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
- preserve basic recipient access;
- never delete the account as a side effect of cancellation.

### Payment failure

- enter a bounded billing grace state and request payment correction;
- do not treat billing failure as inactivity, death, incapacity or consent;
- after grace, enter `expired_read_only`/Free rather than deleting data;
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

## Current Pricing Evidence — Snapshot 2026-08-13

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

- exact launch price approval after a real pricing screen is ready;
- exact founder-offer cohort/closing date, duration and renewal-price promise;
- actual operator／merchant onboarding and provider selection for the first market;
- Stripe test-card／signed Webhook／authoritative lifecycle／no-entitlement-mutation evidence is complete. StoreKit has the full Xcode-local lifecycle plus non-live App Store Connect group／products, eight representative storefronts and two retained purpose-limited testers. Official Apple PKI verification, device／notification intake, Server API signed-status normalization and durable no-entitlement reconciliation are implemented locally. The earlier Pro Max unavailable result was caused by stale Xcode-local StoreKit routing; clean iOS 26.4／26.5 Simulators now load the real USA annual／monthly catalog. Chrome final IAP credentials are secured locally, construct the official Sandbox client and receive Apple's bounded `4040010` authenticated response; two earlier no-private-file keys were revoked and Apple retains one active key. A Debug-only purchase scheme keeps transactions unfinished until durable server acknowledgement. Tester credentials were submitted after Owner confirmation, but three independent account attempts across both runtimes all failed in Apple's post-AuthKit persistence layer with `AMSErrorDomain 100 / Password reuse not available for account`; therefore no transaction exists. One automation-exposed replacement tester was deleted and rotated. Apple-enabled AWS has not been deployed, StoreKit Sandbox ledger rows／mutations remain zero, and no completed real Sandbox purchase／restore／notification, App Review or ordinary access mutation exists;
- first launch countries, tax/Merchant-of-Record responsibilities and local consumer terms;
- exact Free and Family allowances based on real infrastructure and support cost;
- attachment retention after downgrade;
- real-event human support scope, insurance and jurisdiction coverage;
- activation of any trial, discount, promotional code or regional price;
- actual market demand, conversion, retention and unit economics.

The focused unit-economics, runway, accounting-boundary and diligence gates are maintained in [`unit-economics.md`](unit-economics.md) and the linked editable workbook.
