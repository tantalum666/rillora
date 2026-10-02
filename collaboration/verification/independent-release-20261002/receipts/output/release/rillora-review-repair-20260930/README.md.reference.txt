# Rillora review repair candidates — September30

> October2 update: the newer internal TestFlight build and persisted six-image store draft are recorded in [the current contract](../../../docs/independent-release-closeout-20261002.md). The dated preparation facts below remain historical; they are not the current no-upload/no-reset status.

Status: LOCALLY VERIFIED CLOSED CANDIDATES; NOT DEPLOYED OR UPLOADED

- [iOS distribution IPA](ios/Rillora.ipa):1.0(1),CustomerAccessNO,strict signature valid,no debug entitlement or StoreKit fixture. SHA2565f98590d0034f4c8abffe7e154f699fa90cef037bbaa853ec34df1bc16d30ec7.
- `web-production-closed/`: rebuilt production client with account binding,complete matter pagination and draft recovery; public account access remains closed.
- `public-website/`: same selected WWW presentation with the corrected subscription-terms target.
- Each Web folder has an adjacent SHA256 manifest. API source/build is in the current project; schema0091is unchanged.

These supersede the earlier prepared binary for subsequent submission work. Earlier artifacts are retained as historical evidence. Restore the existing AWS session before applying changed cloud artifacts; this package does not authorize customer activation or establish provider/user acceptance.

[Repair and verification](../../qa/rillora-review-repair-20260930/README.md),[signature receipt](../../qa/rillora-review-repair-20260930/native-distribution-check.json).
