# Rillora restricted internal TestFlight build — October2

Status: UPLOADED AND PROCESSED; MISSING EXPORT COMPLIANCE; NOT INSTALLED OR RELEASED

- Version1.0, build2; source009ddba5a0992da0ef5ca702999c80578e92e6d1.
- [Local distribution IPA](ios/Rillora.ipa) is strictly signed and non-debuggable.
  SHA25614a766690eb5dbbfdce2b0c36495a5ad96dec9499177b2bfdcb3560bc8d776fe.
- [Archive](Rillora-Review.xcarchive) was uploaded using Xcode's existing account,
  with testFlightInternalTestingOnly=true. Apple received it at19:40+08 and lists
  build2 as Internal / Missing Compliance. No tester invitation or installation.
- Source code/UI are unchanged. The recorded build-only overrides are build2 and
  account entryYES. Server access is still the same exact allowlist, expiring
  2026-10-06T17:08:57Z. Live billing/public customer access remain disabled.
- Do not use this internal-only Apple build for App Review or public release.
  A later externally distributable submission must use a new build number and the
  actual final release configuration after its gates pass.
- Four iPhone/two iPad [existing designed images](../rillora-store-design-20260930/v1/README.md)
  are now saved in the unsubmitted App Store1.0 draft. TestFlight basics are saved.
- [Artifact check](../../qa/rillora-independent-closeout-20261002/distribution-check.json),
  [preflight](../../qa/rillora-independent-closeout-20261002/release-preflight.json),
  [current contract](../../../docs/independent-release-closeout-20261002.md).

The archive/local export are preserved encrypted in Git LFS; ordinary Git readers
use the redacted receipts/catalog. Credentials and personal authentication state
remain outside this package. Export compliance, other final declarations, device
and transaction acceptance are not established by upload success.
