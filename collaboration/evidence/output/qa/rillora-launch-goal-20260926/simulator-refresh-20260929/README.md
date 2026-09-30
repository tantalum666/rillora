# Native public Home delivery

Owner clarified that the actual native App homepage should adopt the new website
visual. The selected existing target/assets were reused in SwiftUI. Full reading
from this ongoing workflow remains in `../full-read.json`; focused recovery and
changed-source reading are recorded in `work-state.json`.

- Current app: Rillora, com.rillora.ios, on Rillora-Matrix-17-Pro/iOS26.5.
- Current state: ordinary Debug launch, no UI-test fixture environment, Home/System.
- Build/install evidence: `final-build.json`, `before.json`, `after.json`. Executable
  and asset hashes match, and the API remains staging. No data reset/uninstall.
-4unique UI cases pass. `HomeUITests.xcresult` has the successful theme/relaunch/
  invitation-return case and the original2scroll-helper failures. Those failures
  were repaired and the3exploration/expired/AX cases pass in
  `HomeExplorationTests.xcresult`. The final decoration-only AX adjustment passes
  again in `HomeLargeTextFinal.xcresult`.
- Inspecting captured AX5 screenshots caught a checkmark/initial sizing problem
  despite a passing interaction test; only decorative sizes were fixed, preserving
  scaling of all reading labels. `native-home-sharing-ax5.png` is the final capture.
- First unsigned refresh could not access Keychain. Ad-hoc signing with project
  entitlements restored normal access; no app code bypass or credential reset.
- The temporary Simulator App AX-tree absence after UI automation recovered after
  frontend/App reopening. Ordinary Dark/System selection was verified afterward.
  A process sample showed the main event loop idle; no App deadlock was established.
- Source scan:25reviewed non-secrets/0unreviewed; two public client-ID source spans
  only moved by1line. No new exception content or broadened ignore was introduced.
-158Markdown files/1552local references pass; focused spec, decision log, product,
  platform, provenance, handoff/history and journey updated. SourceCI27success is
  separate from native UI evidence and does not prove App Store readiness.
- No WWW/API/database deployment, full native/API suite, actual signup/sharing/
  purchase, TestFlight or store submission in this follow-up.

Final normal screenshots: `native-home-light.png`, `native-home-dark.png`.
