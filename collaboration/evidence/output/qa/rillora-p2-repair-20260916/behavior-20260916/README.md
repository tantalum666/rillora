# Rillora behavior repair — final checkpoint

Status: DEPLOYED AND SYNTHETIC-STAGING VERIFIED — 2026-09-16

## Preserved scope

Owner rejected a UI redesign, then requested repairs. Original homepage composition/artwork, root navigation and normal Profile layout remain. The rejected images and intermediate preview page remain withdrawn. New functionality fits the existing People, contacts, form, status and Visible details areas. Accessibility-size reflow and print-only styling are bounded exceptions needed for legibility.

## Implementation and acceptance

- [Contract and audit disposition](../../../../docs/ux-behavior-repair-20260916.md).
- [Guide pause/reload/resume](guide-browser.log), native cross-client step2 recovery in [native evidence](native-state-evidence.json).
- [Invitation and lost-response acceptance](invitation-browser.log); native accept/back/re-entry and same-process foreground downgrade/revoke in native evidence. PID34593 was retained while resuming through Simulator Home, not a relaunch.
- [Matter → existing sharing → original matter](matter-sharing-browser.log): exact selected preview, Name removes details, dirty cancel keeps focus,814px panel scroll and search restored.
- [New contact → real link/QR → original matter](new-person-browser.log); native recorded the same route and pending/Name state after returning.
- [Recipient late-response/copy/revocation](shared-refresh-browser.log), [keyboard and empty states](keyboard-empty-browser.log), [published public page](published-browser.log).
- Public graph controls receive task labels; the original selector remains. AX5 Connected and Disconnected words were visually inspected after reflow. This is not physical VoiceOver certification.

## Tests and deployment

- [API149](api-final-tests.log), [native145/0/1 existing StoreKit skip](native-final-tests.json), [Web75](web-final-tests.log), [legal artifact7](legal-tests.log).
- API24 healthy1/1, pending0, rollout COMPLETED: [service readback](ecs-final.json). Migration definition18 updated its image, but no database migration was run. Flags/market closure preserved.
- [37 final application/API HTTP and asset checks](aws-http-verification.json), [25 legal checks](legal-http-verification.json), [12 authenticated synthetic cloud scope checks](cloud-preview-result.json).
- [Sites version5 deployment](sites-deployment.json), sourcee3bbfabfa76fc100137d3b36f2b0d9c081b2a45f. Final date-only Web followup source52042d7d0b6d8c4f5c25f620674b64f7fe2a42c1.
- [Cloud cleanup](cloud-cleanup-logs.json) removes two synthetic planners/identities. [Both sessions subsequently return401](cloud-cleanup-verification.json); protected temporary credential file removed. No provider account or message was created. Minimized synthetic legal records remain under the existing schema's retention rules.
- [Seven print-route checks](print-check.log); [27 PDF pages, no out-of-page text](print-layout.json). Representative PNGs inspected. PDFs containing published operator facts stay in protected build storage and are not deliverables or new legal advice. Consent source/digest/versions did not change.

## Excluded attempts and limits

- Stale/expired UI refs, off-screen taps and early animation/scroll captures were re-observed; they do not prove application failure.
- A value-based native navigation experiment was withdrawn; existing destination navigation passes. The first AX5 screenshot still split status text because the sheet test override reached Form children but not the parent layout decision. The adaptive child now reads the same environment; the later screenshot passes.
- A local preview404 used the old API process; restart/retry passed. Browser harnesses were corrected for actual labels/routes and the CLI's unavailable URL global. Old legal HTML/CSS cache was bypassed with a harmless QA query when checking the current build.
- Print color alone was insufficient: entry opacity and dark root color scheme affected generated PDFs. Final print CSS disables animation and forces light/white output; the final images were inspected.
- The first cloud fixture attempt stopped before deployment completion. Its first remote seed also failed JavaScript syntax validation before database work; a refresh against absent fixtures failed harmlessly. The corrected helper adds local syntax preflight, then its seed/check/cleanup pass. These are harness failures, not successful provider/consent events or product regressions.
- System Python HTTPS produced timeout/TLS transport errors; final checks use curl with certificate verification intact. A normal unauthenticated `/overview`401 appears in the public browser console; it is the expected guest transition, not a JavaScript exception.
- No true Google/Apple signup ceremony, real-person legal acceptance, delivery, paid lifecycle or physical VoiceOver is claimed. Larger UX12/13/on-screen UX20 redesign recommendations remain unimplemented under the Owner's constraint.

## Documentation and cleanup

Product, account/matter, sharing/motion, active repair contract, audit disposition, MVP/parity/design/quality clauses, decision log, handoff and journey were synchronized. Decisions were appended because the narrow repair approach replaces the earlier discarded preview flow without reinstating redesign. The original complete Markdown read is reused; no repeated administrator MFA was requested. Final Markdown links and owned-service cleanup are recorded separately.

Final reconciliation:75 Markdown files and636 relative links checked with0 missing targets. Owned preview services and browser QA session closed. Existing in-app tab8 was refreshed to the published application and retained; the actual accessibility tree exposes one three-control public selector. Native defaults remain env{} and the ordinary cloud build is installed.
