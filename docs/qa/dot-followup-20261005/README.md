# Dot GitHub follow-up and integration — October 5

Status: CONSOLIDATED SOURCE; FOCUSED MAC/BROWSER CHECKS PASS; NOT DEPLOYED
Last updated: 2026-10-05 (Asia/Hong_Kong)

Owner requested follow-up of Dot's GitHub progress. This continues the existing release
workflow and its completed reading/evidence; it is not a new whole-repository audit.
The four fetched branch tips share base `2cc95f77` and are preserved as merge parents
on `codex/dot-integration-20261005`, starting from current release head `03c97fc`.
The source branches and main are unchanged. No force push or history replacement.

| Dot branch | Fetched immutable tip | Delivered scope | Follow-up |
| --- | --- | --- | --- |
| web-ux-acceptance-20261005 | 730071039b2deccaae1404e70cbe002e0af45575 | Three-round staged Web report, 13 published images, unresolved findings | Report integrated; four defects reproduced and repaired locally |
| chinese-ios-20261005 | 26134d44c3bf43c22841039df410d14e133bb6de | 1,058 paired String Catalog entries, native language page/tests; static-only evidence | Actual Debug/Release compilation, 215 unit passes/1 existing skip, two bilingual native UI passes |
| chinese-web-20261005 | 20da7b3910e9498e7ecd82e18ed9e32654987dce | 1,274 paired messages, Web/public implementation and Node/build checks | Real local Chrome checks plus repairs; now 1,276 message pairs |
| ai-mcp-plan-20261005 | 4a470080b917931ce5577dc3d228d2ef97f37251 | AI/MCP and optional Events proposal, no runtime | Documentation retained as PROPOSAL; no new first-launch requirement |

## Reconciliation and preservation

- Merge conflicts were current documentation only. Preserve the later Owner keep-account
choice, actual import/reauth evidence, original-three cleanup and dated runtime13 facts.
Do not restore Dot's inherited pending deletion/temporary-four state as today's task.
- Web `selectAccount: true` from5714ec158 remains in intentional Account auth. Native
81c08bf4 export reauthentication/draft ownership remains intact and its regressions pass.
- API, migrations, infrastructure, legal digest, crypto protocol and release-gate IDs/
statuses are unchanged from03c97fc. Dot localization remains presentation-only.
- Main, strict-review and all four Dot source branches remain independently accessible;
new work is published on the integration branch. All new eligible QA/build originals
are preserved additively; no old archive, CI or provider action is replayed.

## Reproduced findings and focused changes

| Report ID | Before on current source | Fix and actual local result |
| --- | --- | --- |
| INT-01 | Escape from matter drawer left BODY focused | Capture opener before opening, restore after removal, skip replacement dialogs and use main fallback; Escape/Close returns to same matter button, keyboard Enter reopens |
| UI-01 | At390px Draft had computed font-size0px | Two-row narrow item keeps status text at12px, title/arrow readable and no horizontal page overflow |
| UI-02 | Activity date had26px width and93px height | Dedicated semantic time row; Chinese date at390px is240px wide/18.5px high; action and original title stay readable |
| UX-02 | Invalid invitation email after blur had no error; disabled CTA looked active | Associated bilingual error/aria-invalid, explicit email guidance and disabled style; invalid disables, valid synthetic email enables; no invitation submitted |
| UX-03 partial | Directions/Notes boundary easily misunderstood; multiline text collapsed | Explicit inclusion/exclusion wording for Notes/reference and preserve line breaks; no field-level permissions or default disclosure changes; full comprehension/recipient follow-up remains |

The report's UX-01 plan progress/next-action design, UX-04 export-entry naming,
UX-05 terminology, UX-06 hosted-auth continuity, P3 suggestions and OBS-01 restoration
audit coverage remain open. This is not a claim that all Dot observations are fixed.
Existing real production sharing/revoke/file results retain their own dates and are
not erased by Dot's independent staging report's untested list.

## Actual validation

- Xcode26.5 / iOS26.5 Simulator: actual checked-in project Debug build-for-testing and
Release compilation succeed. No XcodeGen regeneration or store archive/upload this time.
- Unit suite:215passed/0failed/1existing StoreKit skip, including all21 new localization
cases and earlier export regressions. First prepared-products attempt reported31failed
because the host still used system Chinese despite CLI testLanguage flags; English was
then explicitly bound in a separate xctestrun/launch argument configuration. No assertion
was weakened and no system language preference changed. Both attempts are retained.
- RilloraLocalizationUITests:2/2passed, English and Simplified Chinese tabs/Profile/
language-page return. Debug's existing volatile signed-out fixture preserves Keychain;
no actual account login, consent, data write or purchase. Chinese public Home screenshot
is actual Simulator rendering, not a design mock or store build.
- Native catalog/target static checks9/9. Full new iPad/AX5/orientation/VoiceOver/system
Settings language persistence and authenticated localized matrix remain uncompleted.
- Web162/162 and isolated legal7/7 pass; internal/public/legal build/packaging pass.
Final integrated CI is recorded separately; no old branch CI is substituted for it.
- Chrome synthetic loopback app at4805, signed-out entry4806, public website4807.
Separate fake API middleware allows GET only;82observed requests/0writes at the saved
checkpoint. No real data/provider identity was used. Vite source browser checks do not
prove deployed or packaged production runtime.
- Actual browser checks: desktop1329px Chinese Home;320px English/Chinese Product,
Security,Pricing,Support,Legal after loaded h1;390px workspace/editor/activity/sharing;
320px Account, unchecked terms and disabled actions retained while switching language.
- Same-origin second-tab language switch preserves unsaved Chinese/English Name/Notes,
relocalizes open confirmation, Keep editing and browser Back preserve the draft. No API
writes occur. Synthetic fields are restored before closing the fixture.
- No app console error/warning was captured in the checked local pages. Existing
MetaMask extension warnings are separately counted; not misattributed to Rillora.
Browser screenshots/DOM are not complete accessibility or real-user acceptance.

## Evidence and remaining scope

Raw current evidence: `output/qa/rillora-dot-followup-20261005/`; preserved readable
receipt and encrypted-original mapping: [collaboration addendum](../../../collaboration/verification/dot-followup-20261005/README.md).
Original Dot reports remain immutable in their own QA folders; newer results are here.

No production deployment, TestFlight upload/invite, physical-device use, account deletion,
provider configuration, public customer/billing activation or AI/MCP implementation.
Owner's deletion/phone/merchant deferrals continue. Actual running cloud clients and
native store4pre-date this bilingual source. Continue from [one current handoff](../../handoff.md).

## Owner's Chinese editorial follow-up

Owner subsequently requested careful Chinese wording. [Editorial contract](../../chinese-copy-guidelines-20261005.md)records complete corpus reading,371Web/225native edits and one context key. Original English fields are unchanged; the added contact key still displaysNamein English. Canonical glossary is now事项地图/详细资料/共同复核/导出指引副本. UX-04's Chinese export naming and part ofUX-05terminology are corrected; English naming and broader UX-01action routing remain open. New copy checks/builds are separate from the initial215-unit checkpoint; archive17is the prior frozen integration evidence,with copy evidence appended separately.

October5最终文案检查：21项原生本地化、2项双语UI、Debug/Release编译、Web162及原生静态9项通过；旧法律7项验证沿用未变正文的检查点。当前Simulator安装的是本轮Debug双语QA版，未清Keychain，测试以临时未登录状态运行，截图后已停止。新原件见[文案保存包](../../../collaboration/verification/chinese-copy-20261005/README.md)。
