# Provider Marks Re-review QA

Status: PURPOSE REVIEW COMPLETE; TWO OFFICIAL ASSETS IMPLEMENTED AND DELIVERED  
Last updated: 2026-09-19 (Asia/Shanghai)

## Request and recovery

Owner asks to research whether the company logos can in fact be used. Continued the prior logo/contextual-guidance task, using the [existing full-body read](../rillora-surface-motion-20260917/full-read-completion.json) and [focused recovery](reading-continuity.json). No repeated account ceremony, full repository scan or initial commit/branch/stash.

## Research result

[19-brand purpose-specific table](../../../docs/provider-mark-usage.md) is the deliverable. It corrects the overbroad inference that absence of a general brand license proves every identifying reference is unlawful. Hong Kong Trade Marks Ordinance21 was read in the verified English PDF linked from [WIPO's current2025 record](https://www.wipo.int/wipolex/en/legislation/details/23733), and actual PDF page32 was rendered and visually inspected. It addresses honest identifying use and specific countervailing factors, not all copyright or world markets. This is legal-source research, not a formal legal opinion.

Google media and visual-brand policies, Microsoft's actual application/icon restrictions, LinkedIn's full versus[in] mark rules, Adobe, Bitwarden, 1Password developer versus media sources, Binance global/U.S. terms, Coinbase scoped terms, PayPal and Yahoo were distinguished rather than conflated. Netflix's rendered terms were actually read; their approval requirement was not inferred from Reddit. PayPal's expressly permitted HTML-logo/direct-traffic exception was preserved. Yahoo's vendor-license page did not fully load; no general conclusion is based on an unread body. Binance Square user posts and third-party logo aggregators are not treated as rights grants.

## Adopted artwork

[Exact asset provenance and hashes](adopted-assets.json):

- Facebook Primary PNG from Meta's official Facebook Brand Asset Pack; unchanged54,771bytes.
- Dropbox current Glyph_128.svg from the official brand site's linked partner toolkit; unchanged553bytes. This is the current five-rhombus glyph, not the previously inspected old box illustration.
- Keep brand colors and proportions. Facebook uses24px Web display and proportional native padding above the16px minimum. Dropbox's SVG already contains clear space; it is displayed at38px canvas without double-padding.
- Place marks only beside independent guidance, not as Rillora branding, ad/partner badges, payment acceptance or invented integration. Existing Instagram/GitHub/X remain. Other rows follow the explicit/unclear distinctions in the research table.
- Source, ownership and non-affiliation notices added to THIRD_PARTY_NOTICES and bundled DesignCredits. No new dependency, royalty, paid asset or outgoing permission message.

## Actual checks

- Native main build succeeded, log `build_run_sim_2026-09-18T17-02-54-841Z_pid39212_62568506.log`, no warnings/errors reported. Both logos viewed in actual Matrix13 and ordinary Matrix17Pro directory. [QA image](native-marks.jpg), [final installed image](native-final.jpg).
- Release Web build passed ([log](web-release-build.log)); existing chunk/HPKE warnings only. Sites4 passed ([log](sites-tests.log)). No new behavioral test was added for a two-asset visual change; the prior154/80 suites were not rerun or relabeled current.
- Web actual Facebook and Dropbox rendering, loaded natural dimensions,24px/38px sizes and no console errors checked. An early cold-load observation occurred before the Facebook raster completed; final naturalWidth2084 and visible image confirmed successful loading.
- Native/Web source copies have exact original hashes, and native bundled credits match source. [Verification summary](verification-summary.json).

## Publication and cleanup

[CDK diff](aws-diff.log) changes only WebDeployment SourceObjectKeys to **e7635129f00c693e6b802a0eee2ae504327b883aae7c312df9b0bd85ab8163e3.zip**. Deployment exited0; [20 HTTPS/exact-build checks](aws-http-verification.json) passed. [Separate Facebook raster hash check](published-logo-check.json) returned200 and matched the local original. Actual published images checked, not only the upload status.

Ordinary Rillora installed with env{} on Matrix17Pro, open on Account inheritance, Simulator frontend opened. No QA identity or real Owner data modification. Matrix13 shut down; temporary local Web4291 stopped; research tabs closed and published directory retained. API30/0060, legalSites5 and launch/sales gates unchanged. Existing AWS session worked without new Owner login.

## Documentation closeout

Created the [purpose-specific contract](../../../docs/provider-mark-usage.md); updated [asset register](../../../docs/asset-licenses.md), [provider-guide contract](../../../docs/provider-death-account-guides.md), [product gateway](../../../docs/product.md), [README](../../../README.md), [design QA](../../../design-qa.md), notices and bundled credits. Appended decisions and journey because this supersedes a too-broad interpretation and adopts two assets. [Decision log](../../../docs/decision-log.md), [journey](../../../docs/journey/PROJECT_JOURNEY.md), [active handoff](../../../docs/handoff.md) now route to this result; prior handoff archived HISTORICAL. No legal approval or vendor affiliation claim.

Final local-document check: 849 local targets in 90 Markdown files,0 missing. [Link report](markdown-links.json). Root/nested Web whitespace checks passed.
