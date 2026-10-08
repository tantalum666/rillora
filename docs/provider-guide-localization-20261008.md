# Guide layout and bilingual bodies — October 8

Status: SOURCE CORRECTION; CLOUD CHECKS PASS; NATIVE RUNTIME PENDING
Updated: 2026-10-08 (Asia/Hong_Kong)

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
