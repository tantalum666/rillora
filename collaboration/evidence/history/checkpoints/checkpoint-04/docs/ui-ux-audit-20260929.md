# Rillora Web / iOS UI and UX audit — September 29

Status: AUDIT COMPLETE FOR RECORDED SCOPE; REPAIRS INSTALLED/PUBLISHED; CI29 SUCCEEDED
Last updated: 2026-09-29 (Asia/Hong_Kong)

## Scope and authority

Owner reports Profile forcing dark appearance and requests a careful Web/iOS audit.
Owner then explicitly chooses app-wide Web System / Light / Dark as well. These
instructions supersede home-only native appearance and fixed-dark Web workspaces.
Preserve page structure, brand03, Free1/Family5, annual pricing, permission logic,
real account data and provider contracts. This is a repair/audit, not a redesign.

The ongoing release workflow's complete Markdown read is retained:
[147-file body/range manifest](../output/qa/rillora-launch-goal-20260926/full-read.json).
Compacted recovery uses current authority and relevant changed files.

## Appearance contract

- Native uses one `rillora.appearance.v1` preference across Overview, Matters,
  Profile, details and sheets. Migrate the old homepage key once without replacing
  a newer app choice. Default System has no forced color scheme; selecting System
  clears the saved override. Home and Profile expose the same menu.
- Web reuses the public website's single appearance store and chooser. Workspaces,
  account/invitation pages and dialogs use semantic color roles; approved branding
  gets the matching original light/reversed asset. No CSS inversion of logos.
- WWW links carry only the enum `appearance=system|light|dark` to the fixed owned
  app destinations. Each origin keeps its own optional local preference. Consume
  just that hint, preserving other parameters, history state and invitation hash.
  This is no account identifier or remote preference synchronization.
- A hashed same-origin bootstrap applies the preference before rendered styles;
  React and pre-paint behavior use the same source. System follows later device
  changes. Unsupported storage still permits a current-page choice.
- The existing Privacy/Cookie publication supplement now covers both website and
  web app. Accepted legal bodies, versions and identity consent digest are unchanged.
- The original authenticated folio's dark rectangle is replaced with a transparent
  derivative of that same artwork. Native fits the entire artwork; no new design
  direction, animation library or third-party asset is introduced.

## Confirmed findings and repairs

P1 means risk to task data; P2 means usability/readability or consistency failure.
All evidence below is from this run, not inherited September15 screenshots.

| ID | Severity | Observed issue | Repair and evidence |
| --- | --- | --- | --- |
| A01 | P2 | Home followed light/System but Profile, Matters and sheets forced dark | Root preference and adaptive palette; [ordinary Profile after](../output/qa/rillora-ui-ux-audit-20260929/screens/53-ios-ordinary-profile-final.png). Migration, restart and cross-tab/detail tests pass. |
| A02 | P1 | Refreshing an edited matter reopened server values over a recoverable draft; closing that apparently clean editor could delete the pending recovery | Offer pending recovery before route rehydration/new editor. Cleanup matches owner plus matter/request identity. [Recovery prompt](../output/qa/rillora-ui-ux-audit-20260929/screens/12-web-recovery-prompt-after-fix.png); exact text resumed, saved and read back from API. |
| A03 | P2 | Dark opaque folio rectangle interrupted the light Overview | Same art with alpha; [Web](../output/qa/rillora-ui-ux-audit-20260929/screens/43-web-overview-light.png), [native](../output/qa/rillora-ui-ux-audit-20260929/screens/15-native-authenticated-map-final.png). Initial crop rejected; final native uses scaledToFit. |
| A04 | P2 | Native export had an unlabeled “Choose…” at normal text size | Visible audience question, meaningful placeholder and “Before you export”; [after](../output/qa/rillora-ui-ux-audit-20260929/screens/21-native-export-scope-final.png). |
| A05 | P2 | Disabled Previous guide action looked enabled | Shared quiet style now distinguishes disabled state; [Apple guide](../output/qa/rillora-ui-ux-audit-20260929/screens/28-native-apple-guidance-final.png). |
| A06 | P2 | White official Coinbase/X/GitHub/Instagram marks disappeared on light icon plates | Keep original marks on a dark contrast plate; [guide directory](../output/qa/rillora-ui-ux-audit-20260929/screens/29-native-guide-marks-final.png). |
| A07 | P2 | Web long-form close control scrolled above the viewport (top=-467 at390px) | Shared sticky dialog title/close,44px control and focus scroll padding; [after](../output/qa/rillora-ui-ux-audit-20260929/screens/39-web-mobile-editor-sticky-header.png), close top=16px at Notes. |
| A08 | P2 | Shared inbox refresh was a33×27px browser-default control | Shared44px semantic icon button; no permission or refresh behavior change. |
| A09 | P2 | Review network failure exposed bare “Failed to fetch” | Explain unconfirmed changes, reconnect/retry and retained draft; [failure with selection kept](../output/qa/rillora-ui-ux-audit-20260929/screens/55-web-review-network-recovery.png). Never claim an uncertain server result was definitely unsaved. |
| A10 | P2 | Web account agreement used11px text and16px checkbox |14px text,22px checkbox within minimum44px label; same wording, below actions, still unchecked. [Final online390px](../output/qa/rillora-ui-ux-audit-20260929/screens/62-account-consent-390-after.png). No agreement accepted by the audit. |

Web theme support is an explicitly approved improvement in addition to these ten
repairs. Known literal colors now map to semantic text/surface/accent/warning
roles. Both palette tests enforce4.5:1 for specified reading and action roles;
this is not a claim of full WCAG certification for every rendered pixel.

## Current-run journey coverage

| Journey | Evidence and result | Boundary |
| --- | --- | --- |
| Public entry / appearance | WWW Home, Product, Security, Pricing, Support navigation; manual/system chooser, public-to-app hint; narrow320px pricing and44px controls | Third-party hosted login has its own appearance; no Auth0 restyling |
| Native public / Profile / sheets | Ordinary signed Debug app Home→Profile;3appearance unit tests,1navigation/restart regression;2authenticated route tests | Authentication unchanged; actual account login not repeated |
| Matters |10synthetic items;7category forms, required input states, crypto structure, guide matches, search/filter;320/390px and AX5 | Does not claim all countries/providers' legal processes work |
| Drafts / errors | Dirty exit defaults Keep editing; route-refresh recovery, exact-note save; offline failure retains input and retry saves | No real user's records edited |
| Contacts / recipient | A creates invite/QR; B accepts; only selected bank item/directions visible; reduce to name-only; revoke; replay same old link rejected | Local distinct dev identities, not a new production Google/email verification test |
| Family review | Explicit3-hour local synthetic entitlement; accepted A/B connection, request one check, B responds, A completes, history/next cadence; error/dirty-exit guard | No real subscription, email or external notification |
| Export | Personal preview9of10 excludes Never disclose; plaintext export; encrypted package and separate recovery file; exit guard; local reader decrypts correct9items | Saving outside Rillora remains irreversible by the service |
| Data / restore | Complete10-item backup download, actual file parse, import into isolated empty D; no live sharing restored; archive reader and delete preconditions inspected | No account purged; actual deletion/restoration systems retain separate prior evidence |
| Profile / plan / guides | Native My data, saved reader, plan inclusions, review entry, Safety, safe-information, About; Apple/Coinbase details and official mark plates | Real Apple purchase/restore, provider identity and device-only steps remain launch gates |
| Accessibility / motion | Native AX5+Reduce Motion isolated case passes and five screenshots inspected; native category/editor/export stacks; Web320/390px, keyboard Escape, no horizontal overflow at captured widths | Does not replace a full VoiceOver audit, physical devices or slow-device profiling |

## Validation and delivery

- Web107tests plus7independent legal-artifact checks pass. Eight appearance
  behavior checks include query/hash preservation and allowed destinations; eight
  draft checks include cleanup isolation. Palette-role contrast has two checks.
- Native3appearance unit cases,1appearance-navigation case,2normal route cases and
 1AX5/reduced-motion case pass. Ordinary signed Debug app is installed on
  Rillora-Matrix-17-Pro/iOS26.5. Tests use an explicit isolated4280fixture and are
  opt-in, never an implicit cloud/dev-auth override in ordinary builds.
- The first attempted old large-text matrix expected a different authenticated QA
  setup and failed before reaching the requested pages. Its failure is retained;
  the new isolated route test passes. It is not relabeled a passing old test.
- Preview Web uses immutable assets and an index-last update to the existing
  CloudFormation-owned bucket. Old hashes stay for open tabs/rollback. No staging
  API task, migration, permission, or production customer switch was deployed.
- WWW's reviewed CDK diff changes only the existing static-asset deployment.
  LegalSites10is published from8a884b58882c721f536afe0c82f013f786f7e656; audience stays
  public and the accepted legal document bodies/versions are unchanged.
- Online HTML and bootstrap/entry assets are checked against the built artifacts.
  Browser confirms the actual Preview account entry and its unaccepted agreement.
  [Current evidence/state](../output/qa/rillora-ui-ux-audit-20260929/work-state.json),
  [online artifact readback](../output/qa/rillora-ui-ux-audit-20260929/online-readback.json).

The audit's artifact captures, failures, fixture boundaries and final source/CI
receipts are indexed in the [QA folder](../output/qa/rillora-ui-ux-audit-20260929/).
A build still warns about a653KB minified entry (about184KB gzip); no measured
runtime regression is established here. Further bundle splitting should follow
performance evidence, not an unrelated rewrite during this repair.

## Remaining boundaries

No new observed P1 task-data issue is intentionally left open in this scope.
This audit does not certify every possible state, complete live authentication/
mail/payment, operate a real estate request, test physical devices, or mark the
whole release goal complete. The single release next step remains in
[handoff](handoff.md), with production identity/email, channel pricing, transaction
validation, signing and review submission tracked in[release readiness](release-readiness.md).

Engineering[eadefd435 / CI29](https://github.com/tantalum666/rillora/actions/runs/36566846971)
is pushed and successful. The source scan has25reviewed non-secret spans and
0unreviewed;161project Markdown files/1583local links have0missing targets. The
ordinary Simulator is left at[Profile/System](../output/qa/rillora-ui-ux-audit-20260929/screens/63-ios-installed-profile-system.png).
