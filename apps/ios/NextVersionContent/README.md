# Rillora next-version native content

Status: IMPLEMENTED / SYNTHETIC NATIVE ACCEPTANCE PASSED / NOT DISTRIBUTED
Last updated: 2026-10-23 (Asia/Hong_Kong)

This package implements the existing Web content API in native SwiftUI. The current review target does not link it. The [implementation contract](../../../docs/ios-content-development-20261023.md) is authoritative; current pricing, live accounts and post-death release policy are unchanged.

## Boundaries

The host supplies an account-bound transport and current matter/contact/official-guide choices; the package never sees a session credential. The host pins the Bearer and expected account before I/O and rejects a late response after session replacement. UUIDs, versions, dependencies, file sizes and media signatures are checked on both sides. Upload retries retain their request key and original payload. The server remains the entitlement and sharing authority.

Files use the system importer, coordinated bounded reads, metadata editing and FileDocument export. The voice recorder requests the microphone only after a button tap, stops at three minutes/interruption/background, and normalizes Apple's WAV output to the shared 16 kHz mono PCM format. Temporary audio requests complete file protection, is excluded from backup, and is removed on exit or recovered on the next process start. Simulator checks prove cleanup/backup exclusion, not physical data protection. Optional Apple speech recognition is explicitly on-device only; unavailable/denied recognition leaves manual text entry usable. Text must be separately confirmed and edits clear confirmation.

Drafts remain private until explicit current publication to an accepted contact. Changing person or access intention revokes an existing publication in the database. Editing only steps or selected file versions preserves the earlier published snapshot until replacement/revocation. Recipient progress is a user report, not institutional approval. Access is rechecked after returning to foreground and periodically while visible; uncertain access hides retained drafts, definite revocation clears private state. Downloaded copies cannot be recalled.

HealthKit is a separate package with no dependency on content, upload, export, progress or recipient code. The combined next project adds both features without changing the current project, Info.plist or entitlements.

## Reproduce

From the repository root:

```sh
python3 tools/release/prepare_next_ios.py
swift test --package-path apps/ios/NextVersionContent
python3 -m unittest tools.release.test_native_content_next_version tools.release.test_healthkit_next_version
```

The generator copies the existing reviewed remote Package.resolved pins into the generated next project; build with `-onlyUsePackageVersionsFromResolvedFile`. Xcode's `RilloraNext` scheme runs/tests only against the dedicated loopback fixture, which can be started from `apps/api` with `node --import tsx tests/native-content-ui-fixture.ts`. The fixture verifies a fixed local disposable database, uses synthetic accounts and in-memory encryption/storage adapters, and has no cloud configuration or real payment. It must never be exposed publicly.

Native tests: `NextVersionTests` covers the actual host transport, file I/O and real local API/SQL flow; `NextVersionUITests` covers both languages, actual system file export/import byte round trips, voice entry, HealthKit entry, recipient progress and revocation. Raw test results and earlier failures are retained in the dated QA record. No real microphone recording, speech-system authorization, personal HealthKit permission/sampling, signing, device installation, archive upload or TestFlight is claimed by these tests.
