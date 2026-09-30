# Rillora whole-app UI/UX review — 2026-09-06


这轮按整个原生 iOS App 处理。你指出的灰色输入和删除底部说明已经落实；主要改进是让静态说明安静下来、让入口直达对应任务、让输入标签和退出行为一致。

下面四张均来自实际 Simulator，私有页面使用明确标记的合成测试数据：

![当前 App 主要页面](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/app-review-overview.jpg)

快速查看：[总览前后](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/comparison-overview-portrait.jpg) · [事务编辑前后](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/comparison-new-matter-editor.jpg) · [联系人前后](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/comparison-contact-editor.jpg) · [角色页前后](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/comparison-role-policy-editor.jpg) · [Start Here 前后](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/comparison-start-here.jpg) · [最大字号](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/verified-large-text.jpg) · [真实横屏布局](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-full-app-ux-20260906/verified-landscape.jpg)

Scope: native iOS app, current graphite design and three-tab shell. The Owner
explicitly expanded the Account screenshot request to the entire app. All 50
project-owned Markdown files had been fully read earlier in this conversation;
this review continues that workflow and preserves its read coverage artifact.

## Evidence and original findings

The current-run `before-tour.xcresult` passed its three traversal tests and
captured 19 screens before edits. Four `before-sheet-*.jpg` contact sheets were
opened and visually reviewed. Exact screenshots and their Xcode attachment
manifest live in `before-captures/`. A first contact-sheet read suggested horizontal overflow in Role scope; the
original-size paired images disproved that default-size interpretation. The
accepted finding is excess nested-card emphasis, not default-size overflow.
The Owner’s attached Account image is also
source evidence for the blue email prompt and rejected domain footer.

| Journey | Finding | Original evidence | Repair |
| --- | --- | --- | --- |
| Public Overview / Matters | Static “What / Where” tiles looked like buttons and pushed the useful action down | `before-captures/signed-out-matters.png` | Compact passive labels; Overview create action follows the product map |
| Account | Blue email prompt looked like a link; redundant headings and four equal-weight actions; domain helper rejected by Owner | Owner-provided Account image | Literal gray prompt, explicit input/focus colors, one header, quieter fallback, helper removed |
| Private Overview / Matters | Named next-matter action opened a list; next-matter summary showed added items first; contact evidence was truncated | `before-captures/overview-portrait.png`, `matters-portrait.png` and source route | Exact editor navigation, tappable review-first rows, searchable list, wrapping status |
| Matter / Contact editors | Labels disappeared after input; required/optional meaning unclear; large passive warning blocks; unsaved cancellation unprotected | `new-matter-editor.png`, `contact-editor.png` | Persistent labels, explicit requirements, optional value/review disclosure, protected drafts |
| Role scope | Nested fact cards gave passive limits excessive visual weight and made the form feel crowded | `role-policy-editor.png` | Shared wrapping fact rows without nested card geometry |
| Profile tools | Short internal nouns offered little indication of what each tool did | `profile-portrait.png` plus source | Full-width task rows with a purpose and internal chevron |
| Official guides | Actual provider links were below several long sections; AX introduction dropped its useful explanation | `official-guide-apple.png` plus source | Links immediately after provider header; AX retains explanation |
| Simulation / Role disclosure | Large “No…” cards led the page; useful purpose was missing | `simulation.png`, `role-disclosure.png` | Task-first purpose and concise boundaries; clearer primary actions |
| Start Here | Six passive fact cards surrounded a “no-file” button without explaining the guide; loaded page mixed two export methods and implementation details | `start-here.png` plus source | Explain guide, preview first, choose one format, show corresponding acknowledgements, secondary encryption details |
| Loading / recovery | Refresh replaced loaded content with a full failure page; Retry target measured 28pt | Source and expanded UI test | Retain loaded snapshot with explicit retry notice; 401 still clears private state; larger Retry target |

Field-label decisions were cross-checked against Apple’s current
[Text fields guidance](https://developer.apple.com/design/human-interface-guidelines/text-fields),
which calls out the value of a separate label after a placeholder disappears.
Screenshots establish observed geometry, not complete accessibility compliance.

## Final verification

| Check | Accepted result | Evidence |
| --- | --- | --- |
| Standard-size journey ledger | 14 distinct UI cases passed | `default-surfaces-final.xcresult`, `default-interactions-final.xcresult`, `empty-export-verified.xcresult`; corrected orientation case superseded by `landscape-screen-final.xcresult` |
| Final Account / roots polish | 2 / 2 | `default-polish-final.xcresult` |
| Largest accessibility text | 1 / 1, covering multiple screens and actual input | `ax5-verified.xcresult` |
| Actual landscape layout | 1 / 1 across three roots; width > height | `landscape-screen-final.xcresult` |
| Native unit suite | 111 passed / 0 failed / 1 existing StoreKit environment skip | `unit-verified.xcresult` |
| Debug runtime / Release compile | Both passed | `verification.json` and `build-readback.json` |

The unit suite also verifies failed-refresh recovery, expired-session removal,
older-response protection after a save, and isolation from a later session.
Raw failed attempts remain retained. They expose and document the original
28pt Retry target, a system confirmation without an explicit keep-editing button,
identifier inheritance, a localized no-results label and assertions made before
lazy rows/toolbar state appeared. These were repaired or corrected in observation;
none is hidden by deleting its evidence.

Landscape required a separate correction: the former device-rotation command
did not rotate this Simulator’s scene. Supported orientations are now explicit.
The opt-in Debug-only `RILLORA_UI_TEST_LANDSCAPE=1` requests public UIKit scene
geometry, and the test asserts actual width > height before traversing the roots.
The accepted images use a full-screen capture and normalized orientation; the
runtime’s `app.screenshot()` produced an incorrect rotated crop. This is actual
native landscape layout evidence, not physical sensor/automatic-rotation proof.
No system orientation-lock preference was modified.

The last source change is fully built. Ordinary cloud Debug, no QA planner or
orientation flag, portrait and `large` text are restored; the app is left on the
public Overview. The local QA API process has stopped. Release remains a
fail-closed configuration template with provider flags disabled, not a configured
production release. Native provider authentication, physical devices,
VoiceOver speech, regional localization, external user comprehension and full
five-device coverage are separate evidence boundaries.

The local API uses only development fixtures. A dedicated empty UI-review
planner was added for empty-state/optional-guide checks. Draft tests discard
unsaved input. Rehearsal/preview tests may create local non-operative records;
they send no invitations, create no real credentials or recipient keys, publish
nothing, and perform no payment or actual disclosure. Default Debug cloud
configuration is restored after QA.


## Journey health

1. Public Overview / Matters / Profile — reviewed and reachable, with the same three native tabs and no automatic login wall.
2. Account — gray empty/typed input, explicit unchecked gating, valid/invalid email and cancel/reopen behavior pass; no real credential ceremony was completed.
3. Private Overview / Matters — named editor navigation, review-first rows and recoverable search pass.
4. Optional guide / empty state — start, save-and-exit, resume and empty editor validation pass on the dedicated local fixture.
5. Matter / contact editors — persistent labels, actual typing, protected discard/keep editing and saved-record preservation pass.
6. Role scope / official guides / plan access / safety / About — destinations and returns are traversed; provider-side outcomes are not claimed.
7. Simulation / role disclosure — local non-operative results render and remain distinct from real disclosure.
8. Start Here — in-app preview, printable/encrypted choice and corresponding unchecked acknowledgement gates pass; UI QA does not create a recovery key or share a file.
9. Recovery and adaptive layout — unit-tested stale-request/session protections, larger Retry target, largest text and explicit landscape layout evidence pass; physical automatic rotation remains open.

Named current screenshots are indexed in `image-manifest.json`. Files in earlier
capture directories are raw evidence, not all accepted final images. The three
old “landscape” images from device commands and the incorrectly cropped app
captures are superseded by `landscape-screen-captures/` and the normalized images
in `screenshots/`. Source diffs, hashes and Markdown-link readback accompany the
final verification ledger.


## Persistence check

All 50 project-owned Markdown files remain present; 146 local links resolve
with zero missing targets. The parent repository remains untracked and the
pre-existing nested Web `AGENTS.md` modification is preserved. No commit was
created. `change-manifest.json` contains 38 changed/new files, including 24 Swift
files; exact diffs and final SHA-256 hashes are saved beside the report.

The original Owner Account screenshot is retained as `before-account-owner.png`.
The interface’s field-label decision follows [Apple’s text-field guidance](https://developer.apple.com/design/human-interface-guidelines/text-fields), and the named launch color uses [Apple’s supported launch-screen key](https://developer.apple.com/documentation/bundleresources/information-property-list/uilaunchscreen/uicolorname).
