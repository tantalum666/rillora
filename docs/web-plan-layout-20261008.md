# Web navigation, settings and Family plan corrections

Status: IMPLEMENTED; SOURCE CI AND 43 BROWSER SCENARIOS PASS; NOT MERGED OR DEPLOYED
Updated: 2026-10-08 UTC


本分支状态是独立交付检查点；后续本机整合、原生运行修正、依赖补丁及PR2合并以
[October8整合记录](dot-integration-20261008.md)为准。以下旧“未合并／原生待运行”不再作为当前执行门。

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
runtime diagnosis. The owner confirmed app.staging.rillora.xyz; the cloud browser
was signed out there, so its authenticated identity/commerce responses remain
unobserved. No fabricated
email, cross-account cache, origin switch, permission expansion or provider change was
made. A source/client improvement cannot prove the deployed session now displays email.

## Verification and actual visual review

Internal/public builds and 180 non-legal Node/API/SSR tests pass; seven legal-fixture checks pass separately. Browser regressions cover
bilingual responsive geometry, settings uniqueness, identity loading/retry/races,
Family/free/expired/missing-price states, consent reset, keyboard and history.
Local Chromium cannot start because its sandbox socket operation returns EPERM;
therefore local build/static checks are not visual evidence. The independent GitHub
runner supplied the actual browser results below.

Initial candidate20b2898 passed all three source CI jobs and41/41 browser scenarios.
Actual screenshot inspection then found a320px button extending outside its Family
card, which a document-width assertion had missed. The candidate was corrected and
card-bound assertions added. Neutral Family product bullets replace an over-strong
included-rights assertion. Final browser rerun also covers the retained Stripe TEST
entry when ordinary sales are closed and an honest unavailable-environment error
when the TEST API is absent; no payment request is sent by these checks. No native runtime,
real login, purchase, deployment or end-user acceptance is claimed.

### Final implementation evidence

Implementation commit: [d90f9db1bba8b1b8c1e2275a6d72a3db0ef9e4a8](https://github.com/tantalum666/rillora/commit/d90f9db1bba8b1b8c1e2275a6d72a3db0ef9e4a8)

- [Source verification](https://github.com/tantalum666/rillora/actions/runs/37716051505): source/publication guards, API/database tests, and Web/infrastructure all pass
- [Browser verification](https://github.com/tantalum666/rillora/actions/runs/37716051477):43 passed,0 failed,0 skipped,0 flaky
- All33 intended published files match exact remote Git blob hashes
- Browser artifact SHA256:48ec66e2e679cebb776d19eebf47e0f9a9fc988c9cb641ed7bfb0b2c6595e409
- EN/ZH public navigation checks span13 widths from320 through1920, including breakpoint edges; seven public routes use a separate seven-width matrix
- Workspace visual/interaction checks span320/390/768/1280/1920, both languages, light/dark examples, free/subscribed/expired/missing-price states, close/back, keyboard, consent reset and retained TEST gates
- Actual inspected pixels:14 initial public/header/price/zoom-equivalent screenshots, followed by final320px English Family,390px Chinese Settings,768/1920 Chinese Family, English subscribed management and Chinese Stripe TEST entry
- The512×384 case is narrow-viewport reflow equivalent to a1024px desktop at200%; it is not an actual browser-zoom or native-device test. Its menu screenshot is intentionally scrolled to Support

Synthetic fixture email and billing status only prove client behavior. They do not
prove real provider email, a user's payment, deployed entitlement, TEST eligibility or
production launch. The final TEST404 scenario shows a clear environment-unavailable
message and disabled action; no real checkout request was sent.

## Integration handoff

Apply this narrow Web branch alongside the independent guide and external-link safety
fixes, preserving each side. Before claiming the reported email problem fixed in
production, verify the actual Web host reaches the intended matching identity API.
No shared historical document or private test log was republished by this task.

Potential shared integration files are apps/web/e2e/ux.spec.mjs and
.github/workflows/web-ux-browser.yml; combine the independent guide assertions and
branch trigger with these changes rather than replacing either side wholesale.
The current operator handoff, decision history and journey were deliberately left
untouched; this focused report records this task's scope, review correction, evidence
and remaining runtime diagnosis without republishing historical/private material.
