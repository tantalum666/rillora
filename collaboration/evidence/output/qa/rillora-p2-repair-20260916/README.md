# Repair continuation and Owner UI correction — 2026-09-16

Status: ORIGINAL UI RESTORED; LOCAL TARGETED FIXES ONLY; NO P2 DEPLOYMENT

## Controlling instruction

Owner: “我不是叫你重做ui，你怎么把我的ui给改了”. Preserve the existing homepage, navigation, Profile, public experience, palette, typography and composition. Both generated references are WITHDRAWN, including `populated-overview-reference.png`. `withdrawn-ui/` is historical scratch work, not active code or a selected design.

## Restoration

- [Web comparison](ui-rollback-web.json): six files byte-equal to pre-turn nested-Web HEAD; App navigation/render sections restored separately.
- [Native comparison](ui-rollback-native.json): four components match original source plus already deployed P1 changes. Earlier data tools/status semantics are retained.
- New matter-sharing/preview components and API removed from active code. No new app imagery consumed. Policy JSX/digest unchanged. No AWS/Auth0/Sites write.
- Simulator rebuilt/installed/run against ordinary cloud with env{}. Build log is named in native comparison. Two earlier compile errors were fixed; only the final successful build is current evidence.

## Retained functional work

Web URL/history/draft-return; existing Activity action/date clarity; native accepted-invitation completion and already-open shared-detail refresh; factual safety wording. These changes do not reorganize the original screen layout.

- [Navigation browser flow](navigation-browser.mjs), [result and limits](navigation-browser-result.json).
- [9 focused Web tests](navigation-tests.log); [restored Web build](web-build-restored.log), with existing bundle-size advisory.
- [Settings screenshot](restored-settings.png) confirms original navigation/composition in local synthetic QA. [Normal-cloud native public screen](restored-native.jpg) was visually inspected; no new composition is installed.
- Native state changes compile; acceptance, foreground remote revocation and physical VoiceOver are not proven this turn. UX07–22 remain open/partially addressed.
- `sharing-tests.log` (12 tests) and earlier builds cover the subsequently withdrawn preview implementation; do not present them as current code proof.

## Documentation

Updated product boundary, account/matter contract, invitation/motion contract, audit scope annotation, append-only decision log, current handoff and project journey. A decision was required because Owner explicitly rejected the inferred redesign. Previous handoff is archived as HISTORICAL. Markdown validation is recorded separately. Reading reuses the continuous workflow's full-read record.

## Final checks

72 owned Markdown files and585 relative links checked;0 missing targets. Scoped browser and local4260/4261 services closed; isolated synthetic database retained for continuation. No real account changes.
