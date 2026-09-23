# HISTORICAL — economics before the September 10 value reset

Status: HISTORICAL. Recommendations, old approval wording, fee omissions and financial outputs below are superseded by [current unit economics](unit-economics.md). Archived 2026-09-10.

# Rillora Pricing, Unit Economics And Fundability Contract

Role: pricing economics, cost allocation, runway and fundraising/acquisition readiness authority  
Authority scope: price hypotheses, unit-economics definitions, scenario model, cost map, finance instrumentation and diligence gates  
Superseded by: later Owner decision recorded in `docs/decision-log.md`  
Do not use for: market validation, valuation, financing amount, accounting/tax/legal advice, payment activation or a claim of profitability  
Status: PROVISIONAL PAID-LAUNCH MODEL; PAYMENT CLOSED  
Last reviewed: 2026-09-10 (current-decision alignment only; dated legal, fee and financial research is not a fresh revalidation)

## Decision Summary

The current `US$6.99/month` or `US$59/year` should no longer be treated as the likely permanent list price. It remains useful as a **bounded founder / willingness-to-pay cell**. The primary paid-launch hypothesis for product, margin and fundraising planning is:

- `Rillora Family monthly`: **US$9.99/month**;
- `Rillora Family annual`: **US$99/year**;
- annual saving versus twelve monthly charges: **17.4%**;
- downside sensitivity: **US$8.99/month or US$89/year**.

This is not evidence that users will pay US$99. It is the safer paid-launch planning center because it preserves more room for Apple’s 30% first-year downside, high-trust support, security, compliance and acquisition cost. The exact price remains `PROVISIONAL`; permanent `Free`, a single launch `Family` entitlement and provider-neutral plan/version/price architecture remain the governing decisions in [`monetization.md`](monetization.md).

The companion editable model is [`Rillora_Unit_Economics.xlsx`](../output/finance/rillora-unit-economics-20260813/Rillora_Unit_Economics.xlsx), and the portable review surface is [`Rillora_Pricing_And_Fundability_Report.html`](../output/finance/rillora-unit-economics-20260813/Rillora_Pricing_And_Fundability_Report.html). Orange spreadsheet cells are hypotheses. Every current output must be replaced by actual cohort, vendor and jurisdiction data when available.

September 10 commercial comparison adds lower-priced direct alternatives and
different billing/seat units; see [the source review](competitor-ux-audit.md).
The US$99 model center provides a cost scenario, not a demonstrated competitive
price or conversion advantage. Include those alternatives in real willingness-
to-pay research before a sellable offer. This document update does not recalculate
the old workbook, change catalog prices or validate any assumed fee or margin.

## What Changed From The Previous Pricing Round

The previous round answered what should be free, what Rillora may ethically charge for, how many visible tiers to launch and how cancellation/refunds should behave. It compared public prices but did not fully model the business behind the price.

This round adds five missing layers:

1. payment/store fees by billing period and channel;
2. refunds, direct support and infrastructure as cost of revenue;
3. variable contribution margin versus fully allocated reported gross margin;
4. retention, LTV, CAC capacity, payback and paid-household break-even;
5. cash runway, revenue recognition, compliance reserves and a diligence-ready finance/data contract.

The two rounds are complementary. Competitor prices anchor the range; this model asks whether a price can finance a durable product.

## Evidence Boundary

As of 2026-08-13, Rillora has no real:

- paid household;
- subscription renewal or cancellation cohort;
- refund or chargeback;
- attributed CAC;
- production support-time distribution;
- production cloud cost per paid household;
- tax filing, insurance, legal or security-assurance quote;
- recognized subscription revenue.

Therefore all margin, LTV, break-even and runway outputs are planning sensitivities. They are useful for choosing what to measure and detecting an economically impossible offer. They are not forecasts and must not be inserted into an investor deck as historical performance.

## Price Architecture

### Recommended commercial ladder

| Price cell | Monthly | Annual | Annual saving | Use |
| --- | ---: | ---: | ---: | --- |
| Founder / WTP | US$6.99 | US$59 | 29.7% | Bounded first-cohort transaction and trust test; not permanent list and not lifetime grandfathering |
| Downside sensitivity | US$8.99 | US$89 | 17.5% | Tests whether the paid-launch center needs to move down after real conversion data |
| Recommended paid-launch list | US$9.99 | US$99 | 17.4% | Primary hypothesis for product, margin and fundraising planning |

### Why US$99 is the planning center

- It remains within the observed public annual range for broader digital-legacy/household products while sitting above lightweight organizers.
- A 17.4% annual saving rewards commitment without a 30% discount that materially compresses future acquisition capacity.
- Annual is the economic engine because it reduces fixed per-transaction fees, improves cash collection and fits a product maintained over years. Monthly remains available because trust and flexibility matter.
- It provides additional downside capacity for Apple’s standard 30% first-year commission, refunds and professional compliance costs; the existing spreadsheet remains a historical US$89 model until a new editable model is regenerated.
- It does not force a multi-tier launch: price and entitlement count are separate decisions.

### Founder-cell guardrails

The founder price must be bounded before it is shown. Recommended test contract:

- maximum cohort or closing date is written into the offer;
- benefit lasts only for the purchased term or another explicitly defined period;
- renewal price and notice rules are disclosed before purchase;
- no “lifetime,” “forever” or indefinite storage promise;
- no individualized hidden price discrimination;
- founder and full-price cohorts retain distinct `price_code` values so revenue, refunds, retention and support can be compared.

Do not spend meaningful paid acquisition against the founder cell. Its modeled CAC ceiling is too low to support an uncertain consumer funnel.

## Unit-Economics Definitions

Rillora must use one metric contract across the ledger, dashboards, board updates and diligence exports.

### Revenue and cash

- **Gross billings**: customer price charged before refund, excluding collected indirect tax from revenue.
- **Cash collected**: settlement cash after timing, provider reserves and deductions; it is not recognized revenue.
- **Recognized subscription revenue**: service revenue allocated over the paid coverage period. An annual payment creates cash upfront and deferred revenue, not twelve months of day-one revenue.
- **Refunds/credits**: reduction of revenue or liability according to the approved accounting policy; retained processing fees remain cost.
- **Net subscription revenue**: gross recognized revenue less refunds/credits, excluding tax.

Merchant-of-Record principal/agent presentation and the treatment of fees, tax, refunds and deferred revenue must be confirmed from the signed contract and an accountant. The model does not decide GAAP/IFRS presentation.

### Cost of revenue

Direct software cost of revenue should include consistently allocated:

- payment, billing, App Store and commerce-provider fees;
- production compute, database, storage, network, monitoring and backup serving customers;
- identity or security tools consumed by active customer accounts;
- directly attributable customer support and production operations;
- refund/chargeback cost that is not recovered;
- any direct third-party delivery or verification cost.

R&D, general legal work, fundraising, broad product research and general corporate administration do not become cost of revenue merely because they are expensive. Conversely, direct support and production operations must not be relabeled as R&D to inflate gross margin.

### Two gross-margin views

1. **Contribution margin** = `(net revenue - commerce fees - variable infrastructure - direct support) / net revenue` per paid household.
2. **Reported gross margin** = `(total contribution profit - fixed direct production COGS) / total net revenue` at an actual scale.

The first helps price and acquire a customer. The second is the defensible company metric. At small scale, reported gross margin can be negative even when the unit contribution is healthy.

### LTV and CAC

The initial spreadsheet uses a deliberately simple planning formula:

`simple contribution LTV = annual contribution profit / (1 - annual renewal rate)`

`CAC ceiling = simple contribution LTV / target LTV:CAC`

This is not a board-ready LTV after real data exists. It omits cohort age, monthly/annual differences, expansion/contraction, survival shape, discount rate and changing support cost. Once payments open, use observed contribution by cohort and show the complete formula, source rows and maturity.

CAC includes paid media, partner fees, agency/creative spend, attributable sales labor and other acquisition costs. Organic acquisition is not “zero CAC” if founder or team time is the channel.

## Scenario Results

Historical workbook snapshot: the row labels below preserve its former US$89
center and assumptions. They were not recalculated on September 10 and must not
be quoted as the economics of the current US$99 / provisional five-recipient
Family bundle. Rebuild from observed use/support before a real price decision.

### Per paid household per year

| Price / scenario | Gross billings | Net revenue | Contribution profit | Contribution margin | Simple contribution LTV | CAC ceiling at 3.0x | Payback on assumed CAC |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Founder US$59 — Base | US$65.22 | US$62.94 | US$45.17 | 71.8% | US$82.14 | US$27.38 | 10.6 months on US$40 CAC |
| Recommended US$89 — Downside | US$96.55 | US$89.79 | US$52.79 | 58.8% | US$75.41 | US$25.14 | 13.6 months on US$60 CAC |
| Recommended US$89 — Base | US$93.72 | US$90.44 | US$70.25 | 77.7% | US$127.74 | US$42.58 | 6.8 months on US$40 CAC |
| Recommended US$89 — Upside | US$91.83 | US$90.00 | US$76.51 | 85.0% | US$191.27 | US$63.76 | 3.9 months on US$25 CAC |
| Upper US$99 — Base | US$104.22 | US$100.57 | US$79.49 | 79.0% | US$144.54 | US$48.18 | 6.0 months on US$40 CAC |

The annualized gross-billings figure can exceed the annual price because the model includes a monthly cohort paying twelve monthly charges. None of these figures is actual ARR.

### What drives the downside

The model's Downside case assumes 60% annual billing, 50% Web share, 7% refunds, US$6 variable infrastructure, US$20 direct support and only 30% annual renewal. The US$89 offer still has positive contribution, but a CAC ceiling near US$25 means paid consumer acquisition would be dangerous. The correct response would be improving ongoing value, trust, support efficiency and organic/partner distribution, not merely raising price.

### Scale and reported gross margin

At the Recommended/Base assumptions, using explicit fixed direct production COGS placeholders:

| Paid households | Annualized gross billings | Annualized net revenue | Reported gross profit | Reported gross margin |
| ---: | ---: | ---: | ---: | ---: |
| 100 | US$9,372 | US$9,044 | -US$4,975 | -55.0% |
| 1,000 | US$93,720 | US$90,440 | US$46,255 | 51.1% |
| 10,000 | US$937,200 | US$904,398 | US$630,549 | 69.7% |
| 50,000 | US$4,686,000 | US$4,521,990 | US$3,332,743 | 73.7% |

These are run-rate sensitivities, not a forecast. They demonstrate why a 77.7% per-household contribution margin must not be reported as company gross margin at 100 customers.

### Operating break-even sensitivity

Using annual company fixed-cost reference cases and Base contribution profit:

| Operating model | Annual fixed cost | Paid households at US$89 | Paid households at US$59 |
| --- | ---: | ---: | ---: |
| Lean founder-led | US$150,000 | 2,135 | 3,320 |
| Small product team | US$500,000 | 7,117 | 11,068 |
| Scale team | US$1,000,000 | 14,234 | 22,136 |

Price does not substitute for retention or distribution, but the founder price requires roughly 55% more paid households to cover the same fixed cost in this Base model.

## Channel Economics

### Public list-fee snapshot

- Stripe Hong Kong's public card rate is 3.4% + HK$2.35 for a domestic card or 3.4% + US$0.30 when settled in USD, plus 0.5% for an international card and 2% when currency conversion is required. Billing pay-as-you-go is 0.7%; Tax Basic is 0.5% for no-code transactions where registered. Calculation tooling does not make direct Stripe a Merchant of Record or remove registration/filing work.
- Paddle publicly lists 5% + US$0.50 per Checkout transaction as Merchant of Record, including tax/compliance, billing, fraud/chargeback protection and payment-related buyer support. Its contract, provider authority and payout terms still require review.
- Stripe Managed Payments adds a listed 3.5% on top of Payments and assumes covered Merchant-of-Record responsibilities, but is currently public preview and lists China as a restricted customer country. Other recurring/product fees and eligibility must be confirmed before modeling it as an all-in rate.
- Apple's Small Business Program can reduce commission to 15% outside mainland China for eligible and accepted developers. Standard subscriptions otherwise yield 70% in the first paid year and 85% after one accumulated paid year, minus applicable taxes. Since 2026-03-15, mainland China iOS/iPadOS standard IAP commission is 25% and the qualifying Small Business／post-year rate is 12%. Neither reduced rate may be assumed until its qualification is proven.

At the former US$89 model price, the historical spreadsheet produced the rows below. They are retained only for traceability and must not be presented as the current US$99 result:

| Channel | Annual purchase cost | Twelve monthly purchases | Observation |
| --- | ---: | ---: | --- |
| Paddle MoR | US$4.95 | US$11.39 | Fixed fee makes monthly materially more expensive; includes broader MoR operations |
| Stripe HK direct + international + Billing + Tax Basic | US$4.84 | US$9.10 | Before FX, registrations, filings, dispute/billing support and accounting labor |
| Stripe Managed Payments + international card, minimum listed payment components | US$6.89 | US$11.58 | Before any separately applicable recurring/product fee; public-preview and eligibility risk |
| Apple at modeled 15% | US$13.35 | US$16.18 | Largest channel cost; assumption depends on eligibility and storefront |

### Launch-planning recommendation

Use Stripe HK direct as the primary Global Web planning route after a genuine Hong Kong condition-of-stay, business-registration/commencement, bank, tax/accounting and KYC chain is proven. Keep Paddle MoR as the scheduled operational fallback if those direct-merchant duties are not launch-ready at week 8. At US$99, the currently selected public components are approximately US$4.85 for `Stripe HK + international + Billing`, US$6.83 when 2% FX also applies, and US$5.45 for Paddle; the small list-fee difference is immaterial beside tax registrations/filings, refunds, disputes, support, accounting labor, reserves and provider-control terms.

The US-storefront iOS route now uses the same Rillora Web + Stripe Checkout path as Global Web, subject to actual App Review. StoreKit remains the non-US/default fallback. At the US$99 annual planning price:

| iOS purchase route | Selected public components | Estimated channel cost | Balance after listed cost | Excluded |
| --- | --- | ---: | ---: | --- |
| Apple SBP | 15% | US$14.85 | US$84.15 | applicable tax, refunds and operator tax |
| Apple standard first year | 30% | US$29.70 | US$69.30 | same |
| Stripe HK international card + Billing | 3.4% + 0.5% + 0.7% + US$0.30 | US$4.85 | US$94.15 | Stripe Tax, tax filing, disputes, refunds and support |
| Stripe route + Tax Basic | above + 0.5% | US$5.35 | US$93.65 | registrations, filing labor, disputes, refunds and support |

Against Apple at 15%, the selected Stripe-plus-Tax components retain US$9.50 more per annual subscription. The external Web route therefore needs to preserve approximately `84.15 / 93.65 = 89.9%` of the IAP conversion rate to match the same listed-cost net revenue; it can lose about 10.1% relative conversion before the apparent fee advantage disappears. Against Apple at 30%, the equivalent threshold is about 74.0%. These are conversion break-even ratios, not forecasts. Tax operations, refund/chargeback labor, App Review risk and customer-support cost can move the threshold materially.

Measure `purchase_route`, Apple storefront, plan view, checkout open, completed entitlement, abandonment, refund/dispute and renewal by cohort. The decision metric is `eligible purchase intents × conversion × net contribution`, not payment-fee percentage in isolation. Full classification and routing are in [`ios-external-payment-research.md`](ios-external-payment-research.md).

### Cost treatment for pricing and break-even

- commerce fees, refunds/chargebacks, variable infrastructure and direct support are per-household contribution costs;
- VAT/GST/sales tax is modeled by storefront and merchant role, not as revenue;
- legal, tax, security, insurance, filing, MLPS and minimum production capacity are annual fixed costs and drive the break-even household count;
- reserve 5% of gross billings for refund/chargeback/bad-debt planning until observed cohorts replace it;
- target at least 75% blended contribution margin at 1,000 paid households and at least 60% in the Apple 30% downside channel.

Internal readiness reserves, not quotes: Global one-time US$15,000–40,000 plus US$5,000–15,000 recurring annually; mainland public paid readiness ¥150,000–400,000 one-time plus ¥50,000–150,000 recurring annually, with cloud usage separate. Obtain three scoped quotes before any purchase.

The provider decision tree, Hong Kong/mainland boundaries and complete official source register are in [`global-mainland-commerce-plan.md`](global-mainland-commerce-plan.md). Unit economics must preserve separate rows for `stripe_hk_direct`, `stripe_managed_payments`, `paddle_mor` and `apple_storekit`; never collapse them into a generic payment-rate assumption after real data exists.

This is not a provider decision. Before a contract:

- model actual merchant country, customer countries, currencies, tax registrations and payout timing;
- review reserves, chargebacks, refunds, data export, termination and change-of-control terms;
- preserve a provider-neutral product catalog, entitlement ledger, invoice identity and transaction journal;
- confirm App Store purchase rules for each intended surface and storefront;
- prevent duplicate Web/App Store subscriptions from creating double charges or conflicting entitlements.

Merchant of Record does not remove Rillora's privacy, security, consumer-protection, corporate-income-tax, accounting or product-safety obligations.

## Compliance And Cost Map

### Before first payment

The true commercial gate is not code. It is a complete answer to:

1. Which legal operator is the merchant/supplier? The current answer is the individual Owner; the exact legal name and tax residence remain private publication/onboarding inputs.
2. Which countries are actually open at launch?
3. Is Web commerce MoR or direct PSP?
4. Which consumer-withdrawal, renewal-reminder, refund and cancellation rules apply?
5. Which VAT/GST/sales-tax registrations or MoR records are required?
6. Does EU/UK targeting require a representative, data-protection fee, DPIA, DPA/SCC or local filing?
7. What insurance, incident response and customer support coverage is required for the actual service promises?

The EU One Stop Shop can simplify qualifying cross-border B2C VAT reporting, but tax is generally tied to the customer's place of consumption. GDPR can require a non-EU controller targeting the EU to appoint a representative unless a narrow exception applies; likely-high-risk processing requires a DPIA before processing. Consumer renewal/cancellation requirements differ and change. Counsel must verify the selected markets immediately before launch.

### Budget reserves, not vendor quotes

Until entity and markets are chosen, the model keeps legal, privacy, tax, accounting, security assurance and insurance inside explicit cash-planning reserves instead of inventing per-customer precision. The 18-month sensitivity includes:

| Scenario | Subtotal | 15% contingency | 18-month cash need | Average monthly burn | 24-month equivalent |
| --- | ---: | ---: | ---: | ---: | ---: |
| Validation / founder-led | US$234,000 | US$35,100 | US$269,100 | US$14,950 | US$358,800 |
| Core small team | US$784,000 | US$117,600 | US$901,600 | US$50,089 | US$1,202,133 |
| Accelerated | US$1,640,000 | US$246,000 | US$1,886,000 | US$104,778 | US$2,514,667 |

These figures are not a recommended raise. They include cash-compensation assumptions, contractors, infrastructure, legal/privacy/tax/accounting, security review, insurance/admin, research/support/ops and marketing/partner tests. They exclude transaction-specific financing costs, closing delay and a required minimum cash balance. Replace each category with signed plans or quotes before external fundraising.

## Human Service Must Be A Separate Business

The prior US$99–149 setup/review idea is not economically supportable without observed labor. `care_addon` must have its own revenue, labor, supervision, insurance/QA, refunds and margin.

Minimum price formula:

`price >= (loaded labor + supervision + QA + direct insurance/risk + provider fees + expected redo/refund cost) / (1 - target services gross margin)`

A preliminary **US$199–299** range is only a research placeholder for a tightly bounded 1.5–2 hour setup/review service. It may still be too low. Before activation:

- run time-and-motion tests with synthetic cases;
- define included minutes, follow-up and exclusions;
- exclude legal advice, fiduciary judgment, death determination and real claim handling;
- set a services gross-margin target separate from software;
- obtain insurance and jurisdiction review;
- never hide human work inside Family ARR or software gross margin.

## Fundraising Readiness

### Milestones that are honest before annual renewal exists

- 50–100 paid households at full list or a clearly bounded founder offer before material paid acquisition;
- price, channel, refund and support-time cohort records from the first payment;
- a defined 90-day plan-maintenance rate based on meaningful review/update behavior;
- refund planning target below 5%, investigated by reason rather than hidden;
- observed path to software gross margin above 75% using a documented COGS policy;
- CAC payback planning target below 18 months and LTV:CAC at least 3.0x;
- actual annual renewal only after an eligible cohort reaches renewal—never replaced by a fabricated proxy;
- no untracked dependence on one partner, channel or commerce provider.

These are gates for disciplined learning, not universal investor requirements.

### Required data model

For every commercial metric, preserve:

- numerator and denominator;
- cohort start and maturity;
- product, immutable plan version and price code;
- billing period, currency, country and storefront;
- gross billings, tax, refunds, fees, cash settlement and recognized revenue;
- acquisition source, partner and attributable spend;
- direct support minutes/category and allocated infrastructure cost;
- cancellation, refund, renewal and downgrade reasons;
- exact source record and report generation time.

Never report ARR from Stripe/Paddle/App Store gross sales alone. Reconcile provider exports to the internal ledger, bank cash and accounting records.

## Acquisition Readiness

A buyer will discount Rillora for hidden liability even if topline growth looks good. Build the data room before it is requested:

- clean entity records, cap table and approval authority;
- founder/employee/contractor IP assignment, domain/trademark ownership and OSS/SBOM inventory;
- billings-to-cash-to-recognized-revenue and deferred-revenue reconciliation;
- immutable subscription/entitlement history, refunds and cancellation evidence;
- privacy RoPA, DPA/SCC, DPIA where required, subprocessors, DSAR/deletion/export and incident logs;
- access reviews, threat model, backup/restore, key-management and deletion proof;
- disclosure policy/version history and audit events supporting the map-not-password boundary;
- vendor contracts, renewal/termination, data export and change-of-control obligations;
- separate software and human-services P&Ls;
- channel, partner and customer concentration analysis.

The product's strongest strategic option value is not “blockchain” or storing more secrets. It is a defensible trust architecture, provider portability, clean metrics and low successor liability.

## Experiment Sequence

1. Finish provider-neutral entitlement, price-version and finance-event contracts while payment remains closed.
2. Select entity and a narrow set of launch countries; obtain tax/privacy/consumer-law and insurance quotes.
3. Use the current US$9.99/month or US$99/year provisional list in a truthful pricing screen, with any founder cell separately bounded and labeled; US$89 remains only the historical model/downside sensitivity. Do not add multiple visible paid tiers.
4. Instrument billings, tax, fees, refunds, deferred revenue, support minutes, price cohort and attribution before the first transaction.
5. Validate a small founder cohort operationally, then expose a full-list cohort before meaningful paid acquisition.
6. Review after 30 and 90 days; preserve annual renewal as an open question until twelve-month evidence exists.
7. Activate `Personal`, human service, professional distribution, trials or regional discounts only when a specific cohort problem justifies each one.

## Stop / Reprice Signals

Pause acquisition or rework the offer when any of the following appears:

- contribution margin is positive only by excluding direct support or production security cost;
- refund/cancellation indicates users misunderstood what Family provides;
- monthly customers use Family briefly and abandon plan maintenance;
- CAC exceeds the cohort's modeled ceiling without a proven retention improvement;
- Apple/channel concentration makes net revenue dependent on one changing contract;
- a service promise requires unpriced human review or legal judgment;
- launch-market compliance cost is being ignored rather than quoted;
- the company starts using billings, cash, ARR and recognized revenue interchangeably.

## Open Owner Gates

The following require Owner approval before external commitment:

- final list price and the exact founder-offer cohort/renewal promise;
- merchant legal operator details and initial launch countries;
- Paddle MoR versus Stripe HK direct versus eligible Stripe Managed Payments, and App Store purchase architecture;
- external legal, privacy, tax, accounting, security or insurance spend;
- payment activation, App Store product creation or a real recurring-charge test;
- fundraising amount, timing, dilution, valuation or investor outreach;
- activation and price of any human service.

## Primary Sources

Commerce and platforms:

- [Stripe Hong Kong pricing](https://stripe.com/en-hk/pricing)
- [Stripe Hong Kong Billing pricing](https://stripe.com/en-hk/billing/pricing)
- [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments/how-it-works?locale=en-GB)
- [Paddle pricing](https://www.paddle.com/pricing)
- [Paddle terms](https://www.paddle.com/legal/terms)
- [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Apple auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Apple Developer Program membership](https://developer.apple.com/support/compare-memberships/)
- [Auth0 pricing](https://auth0.com/pricing)
- [AWS Fargate pricing](https://aws.amazon.com/fargate/pricing/)
- [AWS API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)
- [AWS RDS for PostgreSQL pricing](https://aws.amazon.com/rds/postgresql/pricing/)

Tax, consumer and privacy:

- [EU VAT One Stop Shop](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en)
- [Directive (EU) 2023/2673 summary](https://eur-lex.europa.eu/legal-content/en/LSU/?uri=CELEX%3A32023L2673)
- [FTC Negative Option Rule](https://www.ftc.gov/legal-library/browse/rules/negative-option-rule)
- [GDPR consolidated text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)
- [EDPB DPIA topic](https://www.edpb.europa.eu/topics/accountability-and-compliance-tools/data-protection-impact-assessment_en)
- [ICO data protection fee](https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/)

Directional benchmarks, not Rillora evidence:

- [RevenueCat State of Subscription Apps 2026 — Utilities](https://www.revenuecat.com/state-of-subscription-apps-2026-utilities)
- [High Alpha 2025 SaaS Benchmarks](https://online.flippingbook.com/view/1018476450)
- [Benchmarkit / Baker Tilly 2025 B2B SaaS Benchmark Report](https://www.bakertilly.com/insights/b2b-saas-benchmark-report)
