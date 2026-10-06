# Device configuration and simplified purchase page — October7

Source: `08afb3821fad6f26141fea74911cad9f2a98fd50`; CI63 passed.
Current work: `codex/device-config-20261006`.

First real TestFlight Sandbox receipt is HKG/HKD888.00 with applied notification/client
receipt and active Family access. Build8 removes the extra checkbox/test controls,
shows benefits/full currency/year price/one Subscribe button, and checks a fresh Apple
quote before purchase.39focused passes/1retained platform skip,11static checks, bilingual
rendered checks and13distribution checks pass. Build8 is processed/distributed to the
existing1-person internal group, and selected in the unsubmitted manual-release draft.
Build7 is preserved but not distributed. Phone8 update/post-purchase Restore remains
unverified while the Owner is using the phone; no second purchase was performed.

Apple base119.99 and local review catalogs, same-image API14 reloads, Stripe Live
merchant and inactive billing preparation/RAK protection are separately evidenced.
Normal customer sales stay closed; no tax fact, App Review or real charge is inferred.

Archive20 preserves3,102eligible paths/677unique objects in141,191,492encrypted bytes.
Signed6/7/8 artifacts, superseded wrap-fix archive, tests/preview products, scripts,
provider receipts and failed attempts are retained. The first preservation attempt
encountered a binary plist; it is preserved raw encrypted instead of decoded as text.
Previous19archives are immutable. Actual secrets/authentication, private onboarding,
raw device logs and reproducible caches remain excluded under the existing contract.

- [Snapshot and exclusions](snapshot.json)
- [Path catalog](catalog.json)
- [Local decryption verification](archive-verification.json)
- [Changed-document link check](markdown-links.json)
- [Source CI63](receipts/ci63-source.json)
- [Build8 checks/distribution](receipts/distribution-build8.json)
- [Physical receipt readback](receipts/apple-purchase-readback-result.json)

[Fresh remote readback](remote-readback.json) confirms artifact3e46e5130:141,191,492bytes downloaded into independent LFS storage,677objects/3,102paths decrypted and verified against metadata read from GitHub. Previous archives were not downloaded again.

Readable scan passes with0unreviewed findings. Six source-SHA256 values resembling
credentials were independently matched to sourcee229c4668, then represented as named
path/sha256 rows in the readable copy. Encrypted originals are unchanged; no scanner
exception was added. Final preservation/publication receipts are directly versioned.

Source CI63 is verified. The artifact commit contains evidence/docs only; its separate
CI result was not observed after the browser connection stopped and CLI reported missing
Checks/Actions read permission. No extra authentication was requested. The task simulator
was shut down; the Owner original simulator remains booted. Phone update/Restore pending.
