# Evidence context

Current uncommitted working tree; no immutable Git revision is asserted. Source drift: unknown. This is a focused design review, not a Codex Security scan, independent penetration test or attestation. Prior runtime evidence retains its original timestamp.

Collection SHA-256: 4d0b8e9300ad3cac439bf1f1f19c277132eb9a2c26c0799b0a91158162ae20a3

| Evidence | Title | Repository path | SHA-256 |
| --- | --- | --- | --- |
| E01 | Staging encryption/network/roles | `infra/aws/lib/rillora-staging-stack.ts` | `e2c188d79934dd7ddb086675f0c7f1eba6803c7a6b401eddb5c785aca0892061` |
| E02 | Matter read/write plaintext representation | `apps/api/src/routes.ts` | `b8a117b5be1db8e759d32465f5a39509652a8dadb6b8ef27f94438660dc32622` |
| E03 | Database TLS and role transactions | `apps/api/src/db.ts` | `e33f9843d65741f983b249900f152c35cc57b29d9c1c2af3d99ca7910468f1be` |
| E04 | Typed sessions and identity authentication | `apps/api/src/auth.ts` | `bcfa4ce55f2af68b35851e856a43ae40dbed07e8c6d4f875a252c90f876cd0f5` |
| E05 | HTTP protection and log redaction | `apps/api/src/security.ts` | `f2e1a859aa8854025dfc511c515e4805a952322176c77bae8fe921fea9765ffe` |
| E06 | Tenant RLS and Matter schema | `apps/api/migrations/0001_initial.sql` | `306bc5404b2748f832287e2c2ba7d0f4f63b222a7951d4f0adb8260bc53bf473` |
| E07 | Saved authorized copies | `apps/api/migrations/0052_paid_snapshot_capture_boundaries.sql` | `2d90d76771f5e85ca684ed0bfa6584c765362b03ee62703d7be315577bea53ae` |
| E08 | Browser draft persistence | `apps/web/src/matterDraftStorage.js` | `719cd0b50edcc39f54fc59e2d68696fa418b0653b44aaf90dc98e8b9571fd55a` |
| E09 | Client-encrypted recovery package | `apps/web/src/startHereCrypto.js` | `25d862807e149d7ac80fd3e6d86a0cd2ffadf35582d25a3df80a841db9fdf85e` |
| E10 | Native Keychain session | `apps/ios/Rillora/Core/Authentication/SessionTokenStore.swift` | `d2e03858c22081fbbb7cb09d1b09a0f0d1a6e646f8e180b8b5172b6134f04c99` |
| E11 | Earlier same-day AWS configuration readback | `output/qa/rillora-annual-brand-capacity-20260921/capacity-live.json` | `fd883b7823e15bb85d03d8c4f1f0886e2f7354319b276024acd220c558f363b7` |
| E12 | Earlier same-day cleanup/migration readback | `output/qa/rillora-annual-brand-capacity-20260921/capacity-final-check-logs.json` | `eaa180bd27d6a4dfb95d6427ec9af17f4da43691b09ac2cdb9c5d27ba6477b61` |
