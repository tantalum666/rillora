# Rillora full-depth UI and interaction verification — 2026-09-09

Status: implemented and locally verified; normal cloud Debug app restored.

The Owner rejected the login-only expired home and text-heavy screens at every
depth. This revision changes public discovery, private tasks, child editors,
provider details, rehearsals, export and support on the existing native/Web apps.
The [focused contract](../../../docs/interaction-experience.md) records the product rules.

## Working result

- Public home stays useful before login and after expiry. The generated map has selectable What / Next step / Who nodes and concise feedback.
- Accounts / Documents / Devices / Other expand in place. Add preserves category; account cancel preserves the public route and local exploration.
- Matter editing uses Details / Directions / People. Contact editing is a real saved mutation. Role controls visualise the selected person, role and scope.
- All 11 provider guides have deliberate Set up / Later / Details navigation and one current instruction; safety and policy explanations are optional disclosures.
- Rehearsal uses selected event graphics and actual server states. Selecting a new event clears the old displayed result; primary and secondary actions are distinct.
- Start Here uses Review / Format / Save with generated artwork. Meaningful acknowledgements appear only at Save. Recovery-key exit protection retains the in-memory key when the user returns.
- Web uses modal HTML dialogs with keyboard focus and in-product draft decisions. No native browser confirmation interrupts ordinary editing.

## Route coverage

| Surface family | Directly exercised | Evidence |
| --- | --- | --- |
| Public | fresh/expired home, all map topics, category expansion, Add, auth cancellation | `public-motion-and-expiry-v3.xcresult`; `final-interactions.xcresult`; `public-after-captures/` |
| Native roots | Overview, Matters, Profile, search, empty fixture, orientation | `deep-pages-first-verification.xcresult`; `depth-accessibility-guides.xcresult` |
| Native editors | new/existing matter, preserved tabs, contact, motivation, role scope and picker access | `deep-pages-first-verification.xcresult`; `deep-motion-transitions.xcresult`; `sheet-accessibility-and-key.xcresult` |
| All provider children | Apple, Google, Meta, GitHub, password managers, Microsoft, LinkedIn, X, PayPal, Coinbase, Binance; step and details for each | `depth-after-captures/`; `depth-accessibility-guides.xcresult` |
| Rehearsal children | event choice, returned counts, scenario invalidation, actual disclosure advancement and role detail | `final-after-captures/`; `final-interactions.xcresult` |
| Start Here | initial, preview, formats, acknowledgements, encryption and recovery exit | `deep-after-captures/`; `recovery-key-verified.xcresult`; Web gate checks below |
| Support/access | safety hub, safe-information checklist, separate-event safeguards, About and inline copy, plan access | `deep-after-captures/`; previous public traversal; current source review |
| Accessibility | native AX5 controls/role scope/export; real tap area; reduced-motion override; Web 390px modal layouts | `sheet-accessibility-and-key.xcresult`; `web-mobile-*.png` |
| Hosted identity | direct native entry/cancel; earlier same-day email-first/Apple entry evidence retained | [prior hosted report](../rillora-apple-restore-20260909/README.md) |

## Test evidence

- Native unit suite: **118 passed, 0 failed, 1 existing StoreKit environment skip**, `units-after-deep-refinement.xcresult`.
- Revised UI: **16 distinct revised UI cases have passing final evidence**, including `recovery-key-verified.xcresult`; machine-deduplicated case/history index is `native-ui-coverage.json`. Failed intermediate bundles are preserved and are not counted as passing evidence.
- Web core tests: **44 passed**, `web-core-tests.log`. The seven legal-only artifact tests are excluded from an ordinary app build; this revision did not build or publish a legal-only artifact.
- Native Debug build/run and Release Simulator compilation passed.
- Web production build passed, `web-build-final.log`. Existing HPKE/Rollup build notices remain.
- API CORS regression tests: **2 passed**, `api-cors-tests.log`; typecheck in `api-typecheck.log`.

## Browser interaction record

Local synthetic planner only; APIs on 4180/4181, public Web 4175 and private Web
4176. No real personal data, message, purchase or invitation was used.

1. Contact name receives focus. Relationship changed to `Sibling QA`; Escape opens the in-product decision; Keep editing preserves the draft; Save succeeds; reopening reads the saved value. Relationship restored to `Sister` with another successful save.
2. Matters search `Bank` returns one record; Needs review returns Insurance/Subscriptions. New matter retains its name across Directions/Details and an explicit discard removes the unsaved draft.
3. Apple guide advances from step 1 to 2; Details remains optional. All official source URLs are retained.
4. Encrypted format at 390px stays within viewport. One acknowledgement keeps Create disabled; both enable it. Local encryption returns Encrypted copy ready. Closing warns about the unkept key; Return to guide preserves the key actions. The disposable synthetic key was deliberately abandoned, not falsely marked saved.
5. Unreachable creates a separate Missing report opened result labelled simulation only. No contact or release occurs.
6. Role recipient selection updates scope and the relationship labels. A test role was added, edited, kept through a draft decision and saved. Browser revocation exposed the missing `if-match` CORS header; after the focused API fix, revocation succeeded and only the pre-existing simulated contact role remained.
7. Public Who/Documents selections survive Add -> Account -> Back. The URL carries only the known `next=add-matter&category=document` intent. No authentication occurs from map/category browsing.
8. Reduced-motion emulation returns `mapTransform: none` and `mapTransition: 0s` with controls still working. Viewport/media overrides are reset afterward.

After the CORS correction, the completed flows had no new app error; the earlier preflight error is retained as a fixed finding. Chrome reported unrelated
extension warnings; they are not attributed to Rillora. The first IAB tab became
blocked by an earlier native JavaScript confirm; Chrome was the supported fallback.
The obsolete inner-browser test tabs were closed afterward. No native Codex-app control or alternate automation bypass was used.

## Visual comparison and corrections

The [selected board](../../../assets/concepts/rillora-public-motion-20260909/deep-pages-v2.png)
was compared with actual editor, scope, rehearsal and format screenshots together.
The implementation keeps the low-text structure and palette while preserving
native navigation and real data. It intentionally avoids the board's skull,
fabricated counts and fake progress. Main fixes found during verification:

- root accessibility identifiers were masking public diagram child controls;
- sheets did not inherit the test-only root AX5 override, so the override is now applied to forms too and the test asserts stacked controls;
- input text bounds were smaller than their surrounding control; the full labelled area now taps to focus and is tested at an edge point;
- native acknowledgement rows needed whole-row checkbox interaction;
- iOS popover confirmations can omit the implicit cancel button, so returning to the recovery key is a visible explicit action;
- role revocation needed the existing version-precondition header allowed by CORS; origins, authentication and the version check remain enforced;
- the new public Web sections needed their own responsive container rule; final 390px capture has 20px side margins, no horizontal overflow, and the wordmark returns to the top while the explicit Account back action retains the earlier scroll.

## Artifacts and limits

- [Public motion recording](public-motion-final.mp4), [deep motion recording](deep-motion-final.mp4).
- [Web format screen](web-mobile-export-format.png), [draft guard](web-draft-guard.png), [key guard](web-recovery-key-guard.png).
- `before-source/` and `source-before-manifest.json` preserve the starting source. The parent repository has no normal tracked baseline; no initial commit, branch or stash was created.
- This is local build/runtime evidence. It does not prove publication, real Apple identity completion, recipient delivery, saved files on another device, legal authority or disclosure release.
- Provider/legal documents remain readable destinations. No wording was deleted from legal agreements, and the hosted legal receipt/ledger were not changed in this revision.
- Transient refresh preservation is source/unit reviewed; no new production outage or real-account fault injection was performed.

## Final normal launch

The normal `Rillora` Debug scheme builds and runs successfully. Info.plist readback
shows the project cloud API and an empty `RilloraDevPlannerID`; no UI-test launch
environment is passed. [Final public home](normal-cloud-public-home.png) shows the
new public experience from that real app launch. No Keychain credential was erased
or replaced to manufacture the screenshot. Readback: `normal-build-readback.json`.

Markdown check: 54 owned/active report files, 190 local links, zero broken targets.
`git diff --check` passed. Source manifest and before snapshots document scope
without inventing a repository commit baseline.

Web draft initialization also preserves an existing undecided outcome instead of silently selecting guidance; this final source correction changes no stored record on open.
