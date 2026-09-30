# Mobile Logo consistency correction

Date: 2026-09-20 (Asia/Shanghai)  
Status: COMPLETE — NATIVE INSTALLED/OBSERVED; WEB STAGING PUBLISHED/VERIFIED

The Owner reports that the mobile header differs from the selected identity03. This directly continues the previous brand-adoption work; use the [incremental recovery record](read-recovery.json) and the prior full Markdown reading evidence, not a new exploration workflow.

## Cause and correction

The native `RilloraBrand` defaulted to `compact=true`, selecting a simplified three-arc symbol. Web's compact brand variant did the same. This was the Agent's implementation choice, not a font or device-rendering issue. Prior checks verified that assets loaded but did not reject this visible geometry difference against the selected board.

Native now always references `RilloraBrandLockup`; About uses the same component with its existing height. Web's compact flag affects CSS height only and always loads the complete lockup. Header dimensions, outlined wordmark, colours, page layout and App icon are unchanged. Tiny browser favicon assets remain a separate context. The old simplified lockup is marked historical and is not imported by any active brand component.

The canonical usage guide, brand.json, DESIGN and current Logo contract now state that all page/app headers use the complete03 master scaled proportionally. A corrected [September20 package](../../../assets/brand/rillora-approved-brand-20260920.zip) retains full assets and updated usage guidance; the previous ZIP remains dated history.

## Evidence

- [Asset checks](asset-checks.json): native/Web full lockups equal the same canonical bytes; alternate-geometry branches are absent; all37 original03 files remain unchanged.
- [Native build](native-build-result.json): normal Matrix17Pro Debug build/install/run succeeds in24.5seconds, with0warnings/errors. [Observed Simulator image](ios-full-logo.jpg) shows the complete outer ridges. No development identity or synthetic fixture was injected.
- [Web build](web-build.log): release build succeeds; existing Sites worker tests4/4 pass. This is a scoped bundle/route check, not a rerun of the earlier80-application/7-legal suites.
- [AWS diff](aws-diff.log): only the Web artifact changes, from `ff23f63968422d104675da6a62df52e82272791a19be340590fb5358ce6765fa.zip` to `35c50a342ee9a055cf7a374e9c53511b8f41ec09daca7677d4f3eef45f99f6d9.zip`. Deployment exits0 and 30/30 HTTP/exact-asset checks pass. [Deployment log](aws-web.log), [HTTP evidence](aws-http-verification.json) and [final verification](verification.json) record the actual result.
- Legal Sites6 already renders the complete logo at all widths. It is not republished for this app/mobile correction, and its prior verification is not represented as new testing.

## Closeout

The focused brand-use rules and current handoff are updated, with a correction appended to the decision log and journey. [Earlier handoff—HISTORICAL](../../../docs/handoff-history-20260920-before-logo-consistency.md). [Link check](markdown-links.json).

No unrelated UI changes, full native/API suite, personal login, App Store submission or production product launch. Font licensing remains the previous verified result. Resume the existing isolated-production/restore work after this correction.
