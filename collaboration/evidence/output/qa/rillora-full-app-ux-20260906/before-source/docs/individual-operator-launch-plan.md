# Rillora Individual Operator Launch Plan

Role: personal-operator release, market, commerce and later-company migration authority  
Authority scope: operator identity, public legal identity, first-market gates, payment-channel routing, personal-liability boundary and company-conversion continuity  
Superseded by: applicable law, platform rules, verified tax/payment onboarding facts, or a later Owner decision in `docs/decision-log.md`  
Do not use for: personal legal/tax advice, permission to charge, public-release approval, or a claim that a market is compliant  
Status: INDIVIDUAL-THROUGH-LAUNCH LOCKED; NO-EXTERNAL-COUNSEL LEGAL CANDIDATE AND LOCAL CLICKWRAP IMPLEMENTED; ROLE EMAIL INTERNAL LOOP AND ORGANIZATION TFA ENFORCEMENT COMPLETE; EXTERNAL DELIVERY／FACTOR ENROLMENT／MONITORING／REAL OPERATOR／PUBLICATION／KYC GATES OPEN  
Last reviewed: 2026-08-27

## Executive Decision

Rillora will be developed, tested and first publicly released by an **individual operator**, not by a company. The project must not invent or imply `Rillora Inc.`, `Rillora Ltd.` or another entity that does not exist. `Rillora` is the product and brand; the individual is the seller, contracting party and data controller wherever those roles apply.

This is a deliberate launch model, not a temporary omission. A company is considered only after objective traction, contractual, liability, funding or team triggers make conversion worthwhile. Architecture and records must nevertheless allow that conversion without reissuing user accounts, losing subscription history or creating a second entitlement system.

The Owner's exact legal name, residence/tax country, publishable address and final public contact details are personal release inputs. They are not stored in this repository and must be entered only when a real platform, provider or reviewed legal page requires them.

On 2026-08-27 the Owner privately supplied the English legal-name input, stated Hong Kong as the residence／tax-country input and supplied a candidate address. Exact values remain outside Git, source, Markdown, fixtures, logs, screenshots and QA artifacts. The stated country is an Owner input, not an independently verified tax-residence finding. The candidate residential address is not automatically the public service address: the controlling instruction is to disclose the minimum required personal information and prefer a documented lawful service address or P.O. Box wherever the applicable platform and market accept it.

The Owner also confirmed the recommended Hong Kong-law／non-exclusive-court candidate, liability cap, one-year claim period, channel refund model, long-lived active-account retention, `USA / HKG` first-wave intent, separate purchase consent and personal-operation model. Immigration／visa／self-employment classification is outside the current legal-drafting assignment; the Agent will not request or assess those materials. This document retains only the neutral boundary that legal text does not itself grant a licence, registration or regulatory permission.

## What Individual Operation Changes

| Surface | Individual-launch rule | Product consequence |
| --- | --- | --- |
| Apple Developer / App Store | Enrol and contract as an individual; the legal personal name is the seller name. An individual cannot choose an unrelated organisation-style developer name. | App Store listing will publicly connect the product to the operator's legal name. This is accepted unless the Owner later converts the membership to an organisation. |
| Google OAuth | A company is not inherently required, but production branding requires a verified domain, accurate public homepage, Privacy Policy, Terms/support information and minimum scopes. | Keep `rillora.xyz`, `login.rillora.xyz`, public legal routes and `openid / email / profile`; production publication remains a separate gate. |
| Privacy | A natural person can be a controller. | The Privacy Policy must name the real individual controller, a working privacy contact and the actual cross-border/data-region facts. |
| Terms | The individual, trading under the Rillora brand, is the service provider. | Terms cannot describe a fictional corporation. Liability limits, governing law and consumer rights require first-market review. |
| iOS commerce | Digital features used in the app default to StoreKit, but the current US storefront permits an external purchase CTA without an entitlement. | US iOS may open Rillora Web + Stripe in the system browser after explicit purchase intent; non-US storefronts use StoreKit or show no purchase CTA. Both remain adapters to one entitlement ledger. |
| Web commerce | Use an individual-compatible provider after actual KYC, business-permission/registration, domain, bank and payout approval. | A genuine Hong Kong path makes Stripe HK direct the primary technical candidate; Paddle remains the lower-operations MoR fallback. A separate Rillora Stripe HK dashboard account now exists for test-mode engineering, but no provider is live-activated by this plan. |
| Tax/accounting | Revenue belongs to the individual until a company exists. A Merchant of Record may handle covered customer indirect taxes but not the operator's personal income tax/accounting duties. | Preserve gross billings, tax, fees, refunds, cash settlement and recognized-revenue fields from the first transaction. Use professional tax/accounting review before charging. |
| Liability | Contract, privacy, security and product claims attach directly to the individual. | Keep verified release, legal-document review, legal advice and human claim handling closed; obtain appropriate insurance and professional review before expanding promises. |

## Public Identity Contract

Before public release, all public and platform identities must use this pattern:

> Rillora is a product operated by **[full legal name]**, an individual developer based in **[operator country]**.

The exact wording is reviewed for the first market. The following rules are locked:

- `Rillora` may be used as the product/brand name, but never as a nonexistent legal entity;
- the legal operator name must match App Store Connect, payment KYC, tax records and the contracting identity where the platform requires it;
- use the configured role addresses `support@rillora.xyz`, `privacy@rillora.xyz` and `security@rillora.xyz`; the latter two route as aliases into the single Zoho support mailbox, their internal send／receive loop passes and organization TFA enforcement is enabled, while production use still requires next-login factor enrolment plus an external monitoring／reply routine;
- use a lawful service address, mail receiving service or post-office box only if the relevant platform and jurisdiction accept it; do not fabricate an address;
- if the EU App Store is opened to a trader, Apple may publicly display an individual trader's address or post-office box, phone and email. EU availability therefore stays closed until that disclosure is consciously accepted and verified;
- platform forms may contain personal information that is not committed to the repository, analytics or screenshots.

## Broadest-Ready-Market Release Direction

The prior `US storefront only` launch restriction is superseded. The Owner wants every country／region that is genuinely ready to open, not an artificial single-country release. Readiness is a versioned market-register result, not Apple's checkbox alone. `USA` and `HKG` are the first-wave core candidates; Canada, Australia, New Zealand, Singapore and other low-friction English／StoreKit rows may join when their consumer, privacy, tax, support and storefront facts pass. Special-rule rows remain conditional.

Hong Kong is technically available on the App Store and may sell Family through StoreKit. If the individual carries on the paid internet service in Hong Kong, actual condition-of-stay／right-to-operate facts and Business Registration remain gates; HKID alone is not proof. Web Stripe HK also needs live KYC, actual bank／address／phone, tax／accounting and underwriting. Apple Paid Apps／bank／tax readiness does not silently prove those Web-merchant facts.

EU／EEA requires the trader decision and public address／phone／email plus GDPR／consumer operations; UK has its separate privacy／subscription gate; mainland China remains a separate app／data／identity／filing／payment plane; Brazil, Korea, Japan and other special rows retain their exact platform／tax／payment requirements. The product may select all rows marked `ready`, but it must not use `All Countries or Regions including future additions` while a closed row exists.

## Release Stages

### Stage 0 — Development and synthetic staging (current)

- individual developer accounts;
- synthetic data only in the Frankfurt staging plane;
- no billing, real recipient invitation, legal-document intake, claim verification or disclosure;
- Google remains testing until public legal and brand-verification gates pass;
- Apple Release identity, App Store product and StoreKit products remain closed.

### Stage 1 — Closed free beta

- invite-only adults who have reached the age of majority where they live;
- first-party free product paths only; no card and no recurring charge;
- privacy/terms identify the real individual operator before real personal data is accepted;
- account deletion, export, support response, incident response and shutdown recovery are tested;
- no service promise that requires a human lawyer, death-certificate reviewer or claims team.

### Stage 2 — Paid-ready first public release set

- one versioned first-wave market set is selected rather than describing the product as globally lawful;
- the United States and Hong Kong are core first-wave candidates; every additional ready row may launch at the same time, while no closed row is enabled merely for reach;
- the App Store storefront allowlist and Web service eligibility use the same market register;
- EU/EEA, UK and mainland China stay closed until their additional gates pass;
- the product remains a planning/map service and does not perform verified post-death release.
- permanent Free and one visible paid entitlement, `Rillora Family`, launch together; price remains contextual rather than a first-screen demand;
- iOS purchase route: US storefront uses Rillora Web + Stripe external checkout; StoreKit remains the App Review fallback and the default for future non-US storefronts;
- Web purchase adapter: provider-neutral. Stripe HK direct is the primary technical candidate only after the Owner's real Hong Kong immigration/business-registration/bank/tax path and provider underwriting pass; Paddle MoR remains the lower-operations fallback; Stripe Managed Payments remains conditional on production status and eligibility;
- no auto-converting launch trial; no human legal/claim service;
- one server-owned entitlement ledger reconciles Web and App Store access and prevents silent double subscription;
- payment failure cannot create inactivity, death, incapacity, unreachable or release state.

If payment onboarding is late, the region remains controlled beta rather than making a separate public Free-only release. Mainland follows the same paid-ready rule, but on its own later timeline after operator/licence, local data and local payment gates.

### Stage 3 — Controlled regional expansion

Every market is enabled by a reviewed row in the market register. A global domain and globally downloadable binary do not establish global legal readiness.

## Region Register

| Region band | Default launch state | Gates before opening |
| --- | --- | --- |
| United States | `FIRST-WAVE CANDIDATE` | public legal facts; US consumer／subscription flow; support; StoreKit fallback; live Stripe only after merchant gate |
| Hong Kong | `FIRST-WAVE CANDIDATE` | actual right to operate／condition of stay; business commencement and registration; PDPO／support; StoreKit; live Stripe HK only after KYC／bank／tax |
| Canada / Australia / New Zealand / Singapore | `READY-ROW CANDIDATES` | separate consumer, privacy, tax/storefront, marketing and support review; may join first wave once each row passes |
| EU / EEA | `CLOSED` | DSA trader-status disclosure; GDPR lawful bases, records and data-subject operations; Article 27 representative analysis; international-transfer mechanism; consumer withdrawal/renewal rules; App Store trader contact publication consciously accepted |
| United Kingdom | `CLOSED` | UK privacy representative/fee analysis, UK transfer terms, consumer/subscription review and public contact requirements |
| Mainland China | `CLOSED — SEPARATE PLANE` | App/ICP filing and commercial-service licence classification; mainland data/identity/payment plane; PIPL sensitive-information and cross-border process; localized legal/support operations; App Store filing metadata; truthful mainland operator/tax path |
| Any other market | `CONDITIONAL` | open whenever its explicit legal, payment, privacy, storefront and operational row is `ready`; otherwise remain closed |

An IP address is not a reliable legal-residence proof. Region enforcement is layered: the current StoreKit storefront controls iOS purchase presentation; declared service market controls legal availability; Stripe／Apple billing country informs tax and payment checks; the existing renewal provider controls management and migration. A US App Store storefront does not prove US residence. Do not collect government identity merely to make a marketing allowlist look precise, and do not persist StoreKit storefront as a user-profile or marketing attribute.

## Payment Architecture For An Individual

### iOS

The first Global release is the set of ready storefront rows, not US-only. Under the current US external-link rule, the US primary iOS purchase route may be a Rillora-owned Web subscription page opened in the system browser and completed through Stripe Checkout. Hong Kong and ordinary non-US ready rows use StoreKit unless a separately approved regional route exists. It is not an embedded WebView or native Stripe PaymentSheet. Before activation:

1. verify App Store availability and StoreKit storefront gating rather than using IP, GPS or language;
2. show the external route only after explicit plan review or a named Family capability intent;
3. complete Stripe, banking, tax, cancellation, refund and consumer-law onboarding under the same real individual operator;
4. implement signed, idempotent Stripe event reconciliation and server-owned cross-platform entitlement restoration;
5. prepare App Review notes, a review account, the complete Web checkout/cancellation route and evidence that every non-US storefront without an approved external route hides that CTA;
6. keep StoreKit receipt/server-notification, refund, grace, billing retry and revocation support as a provider adapter and review fallback;
7. for every ready non-US market, enable StoreKit or a separately documented regional entitlement before exposing an in-app purchase path;
8. prevent an existing Stripe subscriber from accidentally starting a second StoreKit subscription.
9. read `Storefront.current` immediately before merchandising (`USA`, not `US`), listen for `Storefront.updates`, and fail closed when it is unavailable;
10. keep one active renewal provider per household and plan; changing storefront never auto-migrates or cancels an existing subscription.

This is a routing decision, not prior App Review approval. Japan and Brazil technically allow alternative payments on newer iOS versions but require simultaneous IAP, disclosures, reporting and continuing Apple fees; South Korea requires a separate binary, one PSP and currently does not pre-approve Stripe. EU/EEA external purchase has separate Apple terms, fees and reporting and remains closed. These regions use StoreKit first. Mainland China continues to use StoreKit. See [`ios-external-payment-research.md`](ios-external-payment-research.md).

### Web

The Owner's Hong Kong identity card changes the prior provider assumption but does not by itself authorize payment. The exact comparison and regional gates are maintained in [`global-mainland-commerce-plan.md`](global-mainland-commerce-plan.md).

- **Stripe HK direct** is the primary technical candidate if the Owner's condition of stay permits business, a real Hong Kong sole-proprietorship/Business Registration path exists where required, and Hong Kong bank/address/phone, cross-border tax/accounting and provider underwriting all pass. Stripe is the more capable platform; direct processing leaves Rillora as merchant and responsible for covered registrations, filings, consumer operations, refunds, disputes and billing support.
- **Paddle** remains the lower-operations Merchant-of-Record fallback for first paid validation after individual/sole-trader identity, product, domain and payout acceptance.
- **Stripe Managed Payments** is a conditional MoR-style third path. It is currently public preview, has additional eligibility rules and lists China as a restricted customer country; it cannot be treated as the mainland route.
- **Lemon Squeezy** remains only a verified-identity/payout contingency, not an assumed provider.

Before contract or checkout, confirm exact operator/residence, business permission and registration, bank/payout, live-domain/product acceptance, launch countries, indirect tax, consumer/subscription operations, reserves/holds, refunds/disputes, settlement/FX and change-of-control/data-export terms. No foreign address, bank, phone, business commencement or tax residence may be invented to pass onboarding.

### Shared ledger

The product model must remain provider-neutral:

`catalog_product -> plan_version -> capability -> price -> storefront_product -> subscription -> entitlement_grant -> financial_transaction`

Every external event stores provider, immutable external id, storefront, currency, gross, tax, fee, refund, net/settlement, effective period and reconciliation status. Apple, Stripe, Paddle and any successor are adapters; they do not own product capability truth. Provider migration cannot require users to recreate Matters or identities.

## 2026-08-24 No-External-Counsel Legal Candidate

The Owner has decided not to hire external counsel and accepts that the project must not claim lawyer review or guaranteed enforceability. Rillora now uses a source-backed, liability-minimising candidate rather than leaving legal pages as short placeholders. It contains seven documents, explicit electronic clickwrap, no professional／fiduciary／custody relationship, user content and third-party duties, prohibited-secret rules, disclaimers, indirect／consequential-loss exclusion, proposed `max(US$100, prior-12-month fees)` aggregate cap, user indemnity, force majeure, proposed one-year claim period, non-refundable direct-Web default and a proposed Hong Kong-law／non-exclusive-Hong-Kong-court clause with mandatory-rights carve-outs.

This choice does not let the repository guess publication facts. Final public configuration still needs the real English legal name, residence／tax country, service address and monitored role emails. The Owner must also explicitly accept or revise the proposed governing-law, cap, channel-refund and exact first-wave ready-market choices. Active continuity retention is life-of-account; the shorter 30／90-day periods begin only after verified deletion. Binding US arbitration and class waiver remain absent because a forum, registration, fees and enforceability are not operationally established; a nominally harsher clause may increase rather than reduce personal risk.

Technical enforcement is complete locally: no real Rillora planner/session is issued without current versioned clickwrap, and old sessions without it fail. The evidence survives account deletion only as a de-linked identity digest and contract metadata. No legal page or acceptance flow is public or production-authorized.

## Minimum Legal And Operational Pack

Before the first public release, the individual operator path requires:

- finalized Privacy Policy naming the individual controller, processing purposes, legal bases where applicable, categories, recipients/subprocessors, regions/transfers, retention, rights and contacts;
- finalized Terms naming the individual service provider, scope, prohibited secrets, no legal advice/will/automatic transfer, account and acceptable-use rules, availability, termination, liability, governing-law and mandatory-consumer-right treatment;
- support, privacy-request, security-incident, account-deletion, data-export, backup-expiry and service-shutdown procedures;
- production subprocessor register and data-flow diagram;
- age/majority rule and market eligibility;
- a no-human-claim boundary matching shipped functionality;
- tax/accounting treatment for the operator's actual residence;
- security review and incident-response readiness proportionate to the sensitive planning data;
- an Owner-signed publication checklist and fresh official-source review for the first public market. No external-counsel claim may be made.

## Personal-Liability Containment

While operating personally, Rillora must avoid promises whose safe operation assumes a staffed regulated service:

- no legal advice, will drafting or claim that a record grants authority;
- no automated finding of death from missed activity, Apple Watch, obituary or payment status;
- no manual or AI-only acceptance of uploaded death/legal documents as authority to disclose;
- no custody of passwords, seed phrases, private keys or direct-transfer secrets;
- no real-event release corridor until authoritative verification, applicant authority, disclosure scope, appeal and insurance are separately operational;
- no `24/7`, guaranteed response, guaranteed uptime or guaranteed execution claim without real coverage.

Before accepting real sensitive public data, obtain quotes/advice for cyber/privacy and appropriate professional/business liability coverage. Purchasing insurance is a separate Owner money decision.

## When To Form A Company

Company formation is not a release prerequisite. It becomes a decision gate when any of the following is real rather than hypothetical:

- an investor, accelerator, lender or grant requires an entity;
- a cofounder receives equity, an employee is hired or a contractor relationship creates material IP/worker-classification risk;
- a B2B, insurer, platform, payment provider or professional partner requires an entity;
- Rillora plans legal/document review, verified release, claim handling or another service with materially higher personal liability;
- stable full-price paid demand makes recurring legal/accounting/insurance overhead proportionate;
- revenue, data volume, security exposure or support obligations become material to the Owner personally;
- acquisition, IP licensing or a formal diligence process begins.

Product-planning signal, not legal threshold: review formation after roughly `50–100` full-price paid households or another cohort that proves ongoing paid use. This number does not override an earlier liability, tax, platform or investment trigger.

## Company Conversion Runbook

1. form the entity and establish tax, bank, accounting and beneficial-owner records;
2. execute written assignment/licence of code, domain, brand work, trademark rights, contracts, documentation and other IP from the individual;
3. update Privacy/Terms from individual controller/provider to the company and notify users of material controller/contract changes as required;
4. request Apple individual-to-organisation membership conversion when eligible; if an app transfer is required, validate transfer criteria first;
5. migrate Sign in with Apple team/user identifiers within Apple's required transfer window if the team changes;
6. update Google project ownership, consent/contact records and production verification without changing redirect/domain contracts unnecessarily;
7. update Auth0, AWS, GoDaddy, email, monitoring and payment-provider ownership, billing and least-privilege roles;
8. onboard the company with Web payment and App Store banking/tax agreements, preserving immutable customer/subscription/transaction mapping;
9. transfer cash, deferred-revenue and refund obligations through reviewed accounting cutover records;
10. retain an auditable effective date; do not silently rewrite historical transactions as if the company always existed.

## Required Publication Inputs

The following remain open and must be supplied privately before public release or payment:

| Input | Why it cannot be guessed | Storage rule |
| --- | --- | --- |
| operator legal name | App Store, contracts, controller and KYC must match reality | platform/provider secret or reviewed legal-page configuration; never test fixture |
| residence and tax country | changes tax, payout, representative and contract analysis | private operational record; repository stores only market-independent logic |
| Hong Kong condition of stay and real operating facts | HKID does not alone prove permission to establish a business, business commencement, bank/payout eligibility or exclusive Hong Kong tax residence | reviewed privately with immigration/tax/accounting evidence; never inferred from the ID card |
| service/public address | may be publicly displayed; platform acceptance differs | publication configuration after privacy decision |
| support/privacy contacts | must actually be monitored | role aliases under `rillora.xyz` |
| first public market | defines counsel, consumer, privacy and storefront gates | versioned market register |
| first paid market/provider | determines KYC, tax, payout, refund and price records | reviewed commerce configuration |

These are major legal/money/publication facts, so autonomous default approval does not apply to entering or accepting them on external systems.

Current status for this workstream: the name／country／candidate-address inputs are privately supplied, while the publishable address form, tax／consumer text alignment, external-mail proof and monitoring SLA remain open. Immigration and registration classification are separate Owner／authority／qualified-adviser matters, not the current Agent task. No exact personal value is to be committed to this repository.

## Official Source Register

- [Apple Developer Program enrolment](https://developer.apple.com/help/account/membership/program-enrollment)
- [Apple individual developer-name rule](https://developer.apple.com/help/app-store-connect/create-an-app-record/set-your-developer-name)
- [Apple membership updates and individual-to-organisation conversion](https://developer.apple.com/help/account/membership/updating-your-account-information/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple paid-app and in-app-purchase setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/)
- [Apple app availability by country or region](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-for-your-app-on-the-app-store)
- [Apple EU Digital Services Act trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
- [Apple app transfer criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria)
- [Apple Sign in with Apple team transfer](https://developer.apple.com/documentation/signinwithapple/transferring-your-apps-and-users-to-another-team)
- [Google OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Google OAuth production brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- [Paddle account and identity verification](https://www.paddle.com/help/start/account-verification/what-is-account-verification)
- [Paddle supported countries](https://www.paddle.com/help/legal/sanctions/which-countries-are-supported-by-paddle)
- [Paddle domain verification](https://www.paddle.com/help/start/account-verification/what-is-domain-verification)
- [Paddle payouts](https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid)
- [Stripe global availability](https://stripe.com/global)
- [Stripe Hong Kong business requirements](https://support.stripe.com/questions/requirements-for-hong-kong-based-businesses?locale=en-GB)
- [Stripe Hong Kong pricing](https://stripe.com/en-hk/pricing)
- [Stripe Managed Payments eligibility](https://docs.stripe.com/payments/managed-payments/how-it-works?locale=en-GB)
- [Hong Kong business registration](https://www.ird.gov.hk/eng/tax/bre_abr.htm)
- [Hong Kong profits tax](https://www.ird.gov.hk/eng/tax/bus_pft.htm)
- [EU GDPR consolidated text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0679-20160504)
- [UK ICO privacy-information guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/)
- [PRC Personal Information Protection Law](https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm)
- [MIIT mobile Internet application filing notice](https://www.miit.gov.cn/jgsj/xgj/hlwgl/art/2023/art_564bf0759d7e41d5b4aa8ce4996b9e84.html)
- [Hong Kong Immigration Department visa／business permission boundary](https://www.immd.gov.hk/eng/services/)
- [Hong Kong Immigration Department student conditions of stay](https://www.immd.gov.hk/eng/services/visas/study.html)
- [Hong Kong IRD business-registration and Internet-business boundary](https://www.ird.gov.hk/eng/tax/bre_abr.htm)

## Evidence Boundary

This plan records a product/operations architecture based on official current documentation reviewed on 2026-08-19. It does not prove that Apple, Google, Stripe, Paddle, a bank, an immigration authority, a tax authority or a jurisdiction has accepted the Owner, Rillora or a future transaction. On 2026-08-19 the Owner authorized creation of a separate Hong Kong Stripe dashboard account named `Rillora` for test-mode engineering; it has not completed business verification／KYC, live activation, bank or tax setup, product configuration or a real payment. No business was registered, paid market enabled, public page published, legal service bought or company formed in this workstream.
