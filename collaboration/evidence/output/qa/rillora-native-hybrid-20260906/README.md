# Native Account verification — 2026-09-06

Scope: Rillora-Matrix-17-Pro, iOS 26.5, Xcode 26.6 (17F113).

All 50 project-owned Markdown files (14,408 initial lines) were read before
implementation. The inventory records original file hashes; the read ledger
records complete bounded coverage and rereads of truncated output.

The final source fixes the method divider, email accessibility, keyboard and
working-state handling, explicit hosted-email explanation and AX5 mid-word
wrapping. Existing tests now follow the static public map and native Account.

| Check | Final result | Evidence |
| --- | --- | --- |
| Native unit tests | 106 passed, 0 failed, 1 existing StoreKit skip | `unit-tests-final.xcresult` |
| Focused default UI | 3 passed, 0 failed | `ui-default-final.xcresult` |
| AX5 consent flow | 1 passed, 0 failed | `ui-ax5-final.xcresult` |
| Debug runtime / Release compile | Passed | `verification.json` and build logs |
| Project Markdown links | 50 files, 144 local links, 0 missing | `markdown-links.json` |
| Source whitespace / runner syntax | Passed; Markdown hard breaks preserved | `change-summary.json` |

Manual runtime checks cover native Terms and Privacy opening the correct
formal pages in Safari and returning to Account; hosted system-notice
cancellation; native Passkey cross-device request and cancellation. The system
reported Bluetooth off; Bluetooth was not changed and no credential was
selected. No assertion/token, Rillora session or actual acceptance was created.

## Visual evidence

- [Default unchecked final](09-account-unchecked-final.jpg)
- [Default before / after](11-default-comparison.jpg)
- [AX5 before / after](12-ax5-comparison.jpg)
- [Passkey cancelled](03-account-passkey-cancelled.jpg)
- [Passkey Bluetooth requirement](08-passkey-bluetooth-requirement.jpg)
- [Image hashes](image-manifest.json)

Comparisons use the same Simulator, pixel size and unchecked state. The AX5
comparison aligns the bottom content; its visible top differs because repaired
labels require less height. No QR or credential is retained in this package.

## Boundaries

The current native Account is left empty and unchecked with content size
restored to large. Debug Apple and Passkey are visible; Google is hidden;
Release Apple, Google and Passkey are all disabled. Apple identity-key rotation
is still open and is unrelated to the earlier StoreKit IAP key replacement.
There was no real Apple authorization, physical-device work, tenant write,
deployment, billing or private-map mutation.

The parent Git repository has no tracked baseline. `before-source/` and `diffs/`
preserve this task's changes; no initial commit was created. The existing nested
Web AGENTS.md modification was preserved and is not part of this task's edits.

The next authentication proof needs the Owner to complete a usable Rillora
passkey ceremony, or first establish a passkey through an Owner-controlled
hosted account flow, followed by session/private-plan/logout verification.
