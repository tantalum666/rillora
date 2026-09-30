# Web / Apple IAP channel pricing review

Status: COMPLETE — ADVICE ONLY; NO PRICE OR ACCESS CHANGE  
Date: 2026-09-21, Asia/Hong_Kong

This follows the current subscription-value discussion, using the existing full Markdown reading baseline and current focal records. [Reading/source record](read-record.json). No new full repository read, provider session or live transaction is claimed.

## Supported findings

- Apple3.1.1(a),3.1.3(b), current subscription proceeds and SmallBusiness rules were read. Different prices and permission for in-app external-purchase messaging are distinct. Only the relevant current rule scope is refreshed; the old detailed non-US country matrix was not entirely revalidated.
- Telegram and Patreon official pages explicitly describe direct/Web purchases costing less than store/IAP purchases. No unverified current YouTube numbers or historical Spotify examples are promoted.
- StripeHK pricing currently lists3.4%+USD0.30 forUSD settlement,0.5% international-card addition,2% conversion when applicable; Billing lists0.7% pay-as-you-go. The arithmetic explicitly assumes no conversion and excludes taxes/payouts and other costs.
- [Exact scenarios](fee-comparison.json) and [executed notebook](channel-fees.ipynb) independently verify the annual fee-only balances84.42/75.48/84.99/62.16/83.99. Candidate prices are not validated portal price points or saved offers; actual15% eligibility is not established.
- A30% percentage commission remains30% when the price rises. Under the project's existing channel-cost/gross-sales management denominator, raising the price does not turn that channel into80–90% margin.

## Delivery and limits

The main deliverable is the [current research note](../../../docs/channel-pricing-20260921.md). The private inline Sources receipt contains three findings and five price rows, with explicit cost exclusions. Its first JSON-writing command encountered an encoding error; structured file writing resolved it and the renderer completed successfully. No source credential or personal transaction information is embedded.

Notebook execution passed two code cells and assertions. Structured outputs were inspected. No browser-rendered notebook preview is claimed; the preceding local-file URL rejection is respected, with no repeat or workaround. Public catalog arithmetic was the only kernel data. No application test/build, deployment, provider price edit, enrollment, tax configuration, real charge or outgoing message occurred.

## Project closeout

Updated the scoped iOS payment research, price-contract cross-reference, monetization/product routing and unit-economics qualification. Appended decision and journey entries explicitly preserving proposal/approval distinctions. Replaced handoff after archiving the [previous one](../../../docs/handoff-history-20260921-before-channel-pricing.md). [Validation](validation.json) checks all touched Markdown links and confirms the catalog hash is unchanged.

The current88.80/9.99 prices and Family capability version2 remain in force. Annual-only and channel-price proposals are independently undecided. Existing release/device/merchant boundaries remain as recorded; this analysis does not reopen them or claim release approval.
