# Web UX refinement QA, October6

Status: LOCAL CHECKS PASS; EXACT BRANCH BROWSER RUN IN PROGRESS

## Source and reference basis

- Verified activity branch at start: device-config `e229c4668b9868f29dbb44c938fa3930cdd60b77`;
  fresh GitHub trees and blobs were materialized, with retained files reused only
  after Git blob-hash comparison. Main was not used as the active source.
- Both Owner PNGs were materialized and their pixels inspected. They confirm the
  left-shifted navigation and repeated book fallback. Real-user screenshots are
  not copied into Git or synthetic test artifacts.
- Continuation retains the recorded194-file full-body Markdown review at2cc95f77.
  The current continuation reconciled44 changed/new document bodies/deltas against
  that baseline, with no remaining recorded gap. This does not mean this task
  reread all211 current documents from scratch. The focused source review covers
  the header cascade, public/App entry, locale store/auth return/history,
  session/account projection/lifecycle and all18 provider identifiers.

## Current local results

- API typecheck and build pass;17 focused identity/proof cases pass.
- Shared foundation CI62 succeeds in all three jobs, including its four additional
  database-backed account-identity cases and full existing API suite.
- Initial Web source/build checkpoint passes172 Node/SSR checks, internal build
  and public build; subsequent transient-navigation/session-expiry changes have
  their own final result recorded below. Seven isolated legal-package checks pass.
- The Web Vite build has the existing large-chunk advisory. No TypeScript-wide
  Web pass or standalone lint script is implied by a JavaScript build.
- Local Playwright cannot launch Chromium: socket EPERM before navigation. There
  are zero local visual passes; no flag/security workaround is used.

## Cloud browser scope

The dedicated workflow has contents-read permissions, no secrets, no deployment,
no schedule and a15-minute bound. Chromium and dependencies come from pinned npm
lockfiles/official installation. All account responses are synthetic; external
hosts are blocked or the exact App origin is fulfilled from the local compiled
fixture. Auth-start is captured locally, never sent to an identity provider. Other
writes are blocked. Artifacts contain synthetic screens only and expire after7days.

- Public routes: Home/Product/Security/Pricing/Support/Legal/Notices, English and
  Simplified Chinese,320/390/1280/1440/1920, light and dark selections
- Desktop navigation center and no collision; narrow menu open/Escape/focus
- Workspace: overview/plan/matters/contacts/shared/reviews/access/activity/settings/
  more/guides, English/Chinese at390/1440
-18 guide open/reload/close loops; six images loaded;12 distinct neutral fallbacks;
  all18 remain distinguishable after image errors
- Website language→separate App origin→unchecked consent→synthetic auth return→reload;
  explicit choice priority, blocked storage and underscore guide URLs
- Current account, bilingual labels, missing email, wrong-account response
- Nonblank identity, HTML language, raw-key leaks, missing images, overflow,
  framework overlays, uncaught page errors and unexpected network requests

Passing tests are not a substitute for viewing screenshots. Exact final run,
failed attempts, fixes, artifact links and inspected images will be recorded after
this branch's workflow finishes. Real Auth0/Apple, production-account screenshots,
real sharing/export/restore/deletion/payment, VoiceOver and other browsers remain
outside this synthetic matrix.

## First actual cloud browser run

Commit04091cf1a65a4865c368a374c1cadda706e5fb46 passes full
[source CI](https://github.com/tantalum666/rillora/actions/runs/37498971593).
The [first browser run](https://github.com/tantalum666/rillora/actions/runs/37498972097)
executes18 scenarios:17 pass and one fails. All70 public route/locale/width checks,
44 workspace route combinations and72 provider open/reload/close loops pass.
The failure is a test navigation race: the harness follows a fake auth return while
the App is still following its fake authorization URL. The corrected test waits
for that first navigation before following the captured return. No product assertion
is removed. Its [synthetic artifact](https://github.com/tantalum666/rillora/actions/runs/37498972097/artifacts/11428682966)
was downloaded, digest-verified and inspected.

Actual screenshots reviewed: Chinese desktop1920 centered header, English mobile320
public header, Chinese mobile390 provider rows, English desktop1440 provider rows,
and mobile390 current-account panel. Screenshot review found tight multiline row
spacing and a default browser border on the new summary. Both are corrected;
a duplicate account-name heading is removed. The next run also adds actual
cross-tab language/draft/discard preservation and delayed-identity invalidation.
