# Low-frequency subscription-value analysis

Status: ADVICE COMPLETE; NO CATALOG, PROVIDER OR ACCESS CHANGE  
Date: 2026-09-21, Asia/Hong_Kong

This continues the existing release/pricing discussion. The Owner asks about one-month setup use and possible restrictions; this does not authorize an annual-only conversion or revocation of received information. Reuse the prior [full project Markdown reading](../rillora-release-readiness-20260919/full-read-completion.json) and read current authority, handoff, pricing, commercial lifecycle, Family maintenance and affected source. This is not a claim of another full repository read. [Incremental source record](read-record.json).

## Evidence

- Current catalog explicitly retains88.80annual/9.99monthly, capability version2 and billing disabled. [Input snapshot](catalog-before.json); its hash is unchanged after this analysis.
- Read monetization expiry/legitimate-monthly-use rules, current completion contract and SQL0048/0049/0052. Paid sharing is time-limited; one selected Free relationship stays live, others use their authorized paid-period projections. No new cloud lifecycle test was performed.
- Family maintenance is bounded suggestions, joint checks, in-product dates and approved-correction history. External notification delivery, provider-change monitoring and all-plan history are not claimed as implemented. Corrected its stale68/7.99 top-level reference to the current price contract; functionality is unchanged.
- [Trustworthy official plan description](https://help.trustworthy.com/en/articles/11104129) states annual household billing; [Apple guidelines](https://developer.apple.com/app-store/review/guidelines/) require ongoing value and clear offer information. Competitor packaging is not Rillora demand evidence. Everplans' FAQ still quotes99.99/year but has a2023 body date, so it is not promoted as a freshly verified checkout price.
- [Four payment scenarios](scenarios.json) are deterministic arithmetic from catalog cents. One month9.99, four isolated monthly periods39.96, annual88.80 and continuous monthly119.88; fees/tax/refunds/costs excluded. No equal-conversion assumption, ARR claim or retention forecast.

## Calculation and presentation

[Notebook](billing-frequency.ipynb) executed top to bottom using the existing JupyterLab runtime. Bundled/default Python lackednbformat; no package installation or app dependency change was made. Assertions checked8880/999cents and all four totals. Saved outputs contain the table and11.25%/25.93% arithmetic.

The generated [HTML](billing-frequency.html) was not visually inspected: Browser URL policy rejected opening the local file URL. No alternate browser, localHTTP serving or other route was used to bypass the rejection. Structured notebook outputs were inspected; do not call that browser/rendered visual QA. The local kernel handled only public catalog amounts and shut down through the notebook executor lifecycle.

The collapsed source receipt was built with the supplied Data renderer, four findings and four scenario rows. It contains no secrets, personal data or absolute local paths in embedded evidence. This is a private conversation artifact, not a Sites publication.

## Documentation

- New [recommendation](../../../docs/subscription-value-20260921.md), explicitly not adopted.
- Current product/monetization pointers distinguish that advice from the existing two-period offer.
- A factual current-price reference in Family maintenance was corrected.
- Decision log records the question and Agent advice without fabricating Owner approval; journey records goal, attempts, reasoning changes, outcome and limits.
- Current handoff is updated; the previous brand handoff is [HISTORICAL](../../../docs/handoff-history-20260921-before-subscription-review.md). Its native/Web evidence remains dated.
- [Validation](validation.json) records catalog preservation and local Markdown links.

No product builds/regression tests, payment/provider updates, entitlement changes, deployment, billing, recruitment, outgoing messages or automation creation occurred. Actual conversion, willingness to pay and annual renewal remain unknown. Independent production/restore preparation remains the next engineering work; annual-only sales require a later explicit decision.
