# Guide layout and bilingual bodies — October 8

Status: PUSHED; EXACT-SOURCE CI AND 20/20 BROWSER PASS; NATIVE RUNTIME PENDING
Updated: 2026-10-09 (Asia/Hong_Kong; integration closeout)


本分支状态是独立交付检查点；后续本机整合、原生运行修正、依赖补丁及PR2合并以
[October8整合记录](dot-integration-20261008.md)为准。以下旧“未合并／原生待运行”不再作为当前执行门。

## Owner report and diagnosis

The Owner's two screenshots show a top navigation band clipping the Coinbase header,
and a green trailing check on the GitHub directory row. Both original images were
viewed as pixels; private screenshots are not published in the repository.
The check is `reviewStatusIcon`, rendered from a saved self-reported completion, not
the removed detail acknowledgement and not proof from GitHub. Earlier removal of a
loading label did not establish stable first-frame geometry.

The directory attached an always-visible search drawer to the navigation bar while
the destination lazily measured its short header. This provides a concrete source
path for changing top geometry during navigation, but the cloud cannot prove the
exact UIKit frame timing seen on the Owner's installed build.

## Correction and boundaries

- Search is screen-owned through a top safe-area inset, not a navigation-bar drawer.
  The short detail uses eager VStack layout. No arbitrary delay, fixed top offset,
  hidden header, opacity workaround or suppression of content is used.
- Directory browsing no longer loads self-report status or renders completion ticks.
  Existing API/store records, mutation methods and overview state remain untouched.
- All 18 shared catalog entries have authored Simplified Chinese summaries,
  preparation/after-death steps, documents, limitations and all 35 link titles/details.
  English remains canonical. Locale overlays never change IDs, URLs, phase filters,
  review dates, matching or permissions. Chinese presentation is not Mainland launch.
- Web resolves the existing locale reactively, retaining the current step and draft.
  iOS uses the selected bundle language, consistent with its OS-owned per-app choice.
  Unsupported, absent, malformed or incomplete translations fall back to English.
- Each overlay's sourceDigest is checked against exact canonical content by tests;
  same-length source edits/reorders therefore require a translation review.
- Official URLs were reopened during translation review. Some login/forms/bot-limited
  destinations did not expose complete bodies. Existing review dates are unchanged;
  this translation does not claim new provider approval or a new factual review.

The accepted English legal agreements, source instructions and regional authority
limits are not rewritten. Reading a guide does not change provider settings or confer
access, asset ownership, executor authority or approval.

## Verification

Cloud Web build and 177 Node/SSR checks; 34 native source guards. These are separate
from Apple compilation. Added native XCTest covers all locales/provenance and malformed
overlays; a UI case covers unscrolled Coinbase push/pop/re-entry with first-observable
header geometry and screenshots. It is written but not executed in this Linux cloud.

The existing isolated Chromium matrix now checks every provider's reading tabs/steps,
body language, documents, reload and close paths. Exact remote CI results are recorded
in the handoff after the branch push. The first local browser attempt ended before
results, so it is not a visual pass. No Xcode, Simulator, physical device, TestFlight,
main merge, deployment, real account operation or external provider submission occurred.

Native acceptance must inspect the transition video, not only a settled screenshot,
on cold/warm navigation, back/re-entry, long text, dark/light and larger accessibility
sizes, including a matter-sheet entry. Source changes are not installed-build proof.

Apple layout references: [search drawer](https://developer.apple.com/documentation/swiftui/searchfieldplacement/navigationbardrawer),
[VStack](https://developer.apple.com/documentation/swiftui/vstack).


## Publication scope

Only the focused product/test changes and this new report are published. Local
handoff/decision/journey updates are withheld because full historical shared-document
payloads require separate sensitive-information review; no historical body is copied
under another filename. The parallel external-link guard files are untouched.
Detailed logs and Owner screenshots are not uploaded. Gitleaks is unavailable in the
cloud executable path; changed payloads were inspected for credentials/private data,
and repository source CI remains required rather than claiming a local scanner pass.


## Final remote verification

Product implementation: `002201bd20db2f6af39a1a85d0b3cfccea3b0958`.
Final test/source checkpoint: `a69df86f98be4ec4022654c61bce2743b321dc35` on
`codex/guide-layout-locale-20261008`. All 15 original changed-file blob hashes
matched the intended local payloads; the follow-up changes only browser test timing
and screenshot capture.

- [Source CI86](https://github.com/tantalum666/rillora/actions/runs/37713119904): success,
  all source/API/Web-infrastructure jobs. CI82 also passed the initial product code;
  its source scan reports 29 reviewed nonsecrets and zero unreviewed findings.
- [Expanded Chromium regression](https://github.com/tantalum666/rillora/actions/runs/37713119855):
  20 passed, zero failed/skipped/flaky, after repeating the complete matrix.
- All 18 guides: both language/width combinations, every reading phase and next/previous
  step, documents, reload and close paths. Existing cross-tab language/draft and
  asynchronous identity/session tests also pass.
- First browser attempt: 19 passed/1 failed. An existing synthetic logo-error event
  fired before asynchronously restored guide rows existed. The harness now waits for
  18 rows before dispatching the same event and keeps the 18-fallback assertion.
  This was not a weakened assertion or hidden product failure.
- [Final synthetic artifact](https://github.com/tantalum666/rillora/actions/runs/37713119855/artifacts/11522174888)
  downloaded and SHA256 verified:
  `503a96ea9ccb9488edb89f29c67692de2b82610b56d89abddbd97c8b63f7c668`.
  Actual Chinese mobile directory, Chinese mobile Coinbase body and English desktop
  Coinbase body pixels were inspected. The artifact expires after seven days.
- Local Web 177/177 and native source guards 34/34 pass; internal and public builds
  pass with existing chunk-size advisory. No native compile/runtime is implied.

This final receipt changes documentation only and does not rerun or relabel the
above exact-source results. Shared historical documents remain withheld as stated.
