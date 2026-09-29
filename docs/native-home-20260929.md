# Native public Home aligned to the selected website

Status: IMPLEMENTED, BUILT, INSTALLED AND VERIFIED IN THE CURRENT SIMULATOR
Last updated: 2026-09-29 (Asia/Hong_Kong)

Owner reports the Simulator still looks old, then explicitly selects adopting the
new website visual on the native App homepage. This supersedes the old instruction
to preserve the signed-out native Overview composition only. Keep authenticated
workspace/editor/account flows and real data intact.

The target is the selected WWW paper/ink-green composition and its existing
hero artwork, full03brand, serif headline, concise actions and permitted-only
Mum/Alex demonstration. Build actual SwiftUI, not a WebView or screenshot mock.
The homepage offers real Sign in, matter exploration and incoming invitation
entry, with a bottom start action preserving the first-matter intent. It keeps
the three existing native tabs; it does not reproduce five desktop navbar links.

Home uses the same app-wide System/Light/Dark preference as the workspace. A
device-local appearance value remembers the explicit choice; it contains no
identity/content and System removes it. The later Owner correction extends semantic
colors to private tabs/details while preserving their composition. The dedicated
Home palette still coordinates its selected artwork. No new dependency, provider,
guide disclosure or paid gate.

The example is labeled, local and non-persistent. Switching recipient clears
expanded detail and exposes only their example items. Motion describes selection
or expansion and respects Reduce Motion. Text scales, targets remain44pt, and
light/dark/navigation/cancel behavior must be checked in the actual Simulator.
Build/install/start, rendered checks and tests are distinct evidence. No real
account, invitation, purchase, TestFlight or production release is implied.

[QA](../output/qa/rillora-launch-goal-20260926/simulator-refresh-20260929/),
[website target](landing-page-20260928.md).


## Prior homepage delivery checkpoint

`Rillora-Matrix-17-Pro` / iOS26.5 now runs the new native homepage in the ordinary
Debug Rillora app, com.rillora.ios, connected to the existing staging API. Built
and installed executable/asset hashes match. No device erase, App uninstall,
account deletion or reset of private content occurred.

Four distinct targeted UI cases pass across the retained result bundles: theme
selection/relaunch and invitation dismissal to Home; example visibility and category
exploration without auth; expired-session public browsing; AX5/Reduce Motion.
The latter was rerun successfully after inspecting the screenshots and fixing
oversized decorative initials/checkmarks. Reading text still scales normally.
Light/dark ordinary UI and light status-bar contrast were visually verified.

First refresh used an unsigned simulator build and failed Keychain access; signed
ad-hoc builds with the original project entitlements fixed it. No fail-open or
storage-clearing workaround. Two initial UI failures came from a scroll helper
assuming a standard navigation bar; it now handles this custom homepage header.
Original failure bundles are retained. This is not a full native/API retest or a
new end-user authentication/real sharing/purchase ceremony.

## Later September29 scope correction

Owner reports Profile forcing dark and explicitly requests a whole-product audit.
The original home-only delivery scope is superseded by[app-wide appearance](ui-ux-audit-20260929.md).
One migrated preference and semantic palette now cover every native tab, detail and
sheet, preserving composition and business behavior. The homepage still uses this
selected visual; this is not another visual direction.
