# Start Here Export Contract

Role: Start Here preview, printable guide and client-encrypted package contract  
Authority scope: included fields, disclosure boundary, cryptographic format, file lifecycle, cross-platform semantics and evidence language  
Superseded by: a later reviewed decision recorded in `docs/decision-log.md`  
Do not use for: claiming legal authority, real recipient identity/acceptance/delivery, post-download revocation, production release or universal legal validity  
Status: AUDIENCE-BOUND GUIDES AND BACKUP READERS DEPLOYED/VALIDATED IN SYNTHETIC STAGING; REAL DELIVERY CLOSED
Last updated: 2026-10-05 (Asia/Hong_Kong)

## October5 actual empty-map import and Web reauthentication

The native2,291-byte synthetic backup was imported through deployed Web into the
explicitly verified isolated empty account: HTTP201,1matter/1person and no restored
sharing. New identifiers/draft states and preserved Notes/reference were read back;
the contact stayed Not invited. After natural recent-auth expiry, export returned403.
Same-account reauthentication retained the working page and required explicit retry;
that retry returned200and saved a2,309-byte complete map with1matter/1person/1role.

Owner retained the test account/data at the final deletion dialog. No purge occurred;
the test session ended and temporary access was removed. This does not remotely erase
any saved copy. [Actual record](real-core-acceptance-20261004.md).

## October4 actual cross-client exports and native reauthentication repair

The QQ empty backup (1,299bytes) and native populated backup (2,291bytes,
1matter/1person/1role) were saved through their actual system file dialogs and read
by the deployed Web reader. The native recipient plaintext guide (962bytes) and
native encrypted package (2,507bytes) also opened in Web with only minimum fields;
Notes/reference remain exclusive to the full private backup. The343-byte recovery
key was saved separately and stays outside ordinary QA/Git. Import was still pending
at that October4checkpoint; the October5result above closes that case.

Real native encrypted export exposed a generic alert competing with the shared
recent-auth prompt. The store now preserves preview/action state for the exact
403reauthentication_required response, leaving the shared prompt in control. It
never automatically retries or publishes an unfinalized package. Other failures
retain their normal alerts. Focused tests reproduced3failures then passed10of10;
the fixed Release simulator completed the actual sign-in/retry/file/decrypt flow.
An expired preview still requires refresh and review. No layout, crypto or server
permission change. New signed1.0(4)includes the fix, is uploaded/processed as Ready
to Submit, and has saved test notes with0groups; build3remains its prior checkpoint.
[Current actual evidence](real-core-acceptance-20261004.md).

## October3 strict-review implementation boundary

Recipient guides use the same live/saved/paused projection as recipient reads,
including permanent redaction and historical encrypted references. Free personal
exports retain current owner content. Maximum65536-byte encrypted ciphertext fits
the authenticated finalize transport; backup artifacts stay bounded at2MiB independent
of their request envelope. Oversized requests return413. Web downloads use compact
JSON so a valid artifact remains readable under that same byte limit.

Late file reads/unlocks cannot replace a newer selection or resurrect a closed reader;
private printable responses are rejected after an observed account change. Real Blob
round trips, HTTP/DB tests and actual React file-input races pass locally. These
repairs do not create new delivery or recipient-key capabilities. [Report](code-review-20261002.md).

## September30 recent authentication before producing a copy

The restricted production runtime requires authentication within ten minutes before
printable generation or encrypted-package preparation. Existing preview remains a
read-only planning step. Missing/old proof prompts sign-in without losing the selected
audience or editor; the user then explicitly retries. Map backup export/import follow
the same common requirement. No new export entitlement or price is introduced.
[Authentication boundary and evidence](release-engineering-20260930.md).


## September16 deployed scope/reader acceptance

P1 is now deployed to the existing synthetic staging environment: API23, migration17, checksums0043–0047, completed1/1 rollout; Web and the current native Debug build use the matching contract. Sites legal version4 and the Auth0 form/action are published and read back.36 HTTPS and25 legal checks pass. Authenticated cloud fixtures verify invitation scope, scoped plaintext/encrypted export, full backup/import, private archive restoration and provider-backed account deletion. These are deliberately synthetic sessions, not real signup/email/consent ceremonies. Sales remain closed. [September16 deployment acceptance](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).

## September16 P1 repair checkpoint

[The current repair contract](p1-reliability-repair-20260915.md) supersedes the audit's whole-map guide and absent-reader gaps. Both clients choose an audience, the API projects the selected person's permissions, Never disclose stays out of minimum guides, and complete private backups/readers are separate. Exact field preview and scope-version rejection are implemented. Local Web/native synthetic acceptance and crypto interoperability pass; P1 deployment and synthetic-staging acceptance are complete; see the September16 deployed checkpoint above. UX18's broader guide navigation remains open.

## September11 category-detail boundary

New typed Matter details and Notes are deliberately absent from the minimum Start Here contents. They remain available only in the owner record and explicitly granted Details-level direct sharing. A changed matter still advances its source version and invalidates stale previews under the existing commitment rules. The current API test confirms that the wallet address and wallet-specific fields do not enter the minimum export or aggregate audit metadata; no cryptographic format or acknowledgement changes were made.

## Product Boundary

Start Here is a map for the next person, not a password vault, transfer instrument or legal document. Both current outputs use the same reviewed, minimum-disclosure Start Here snapshot. A personal guide contains directions and active contact labels; a recipient guide contains only that person’s authorized projected directions, not passwords, PINs, recovery codes, seed phrases, private keys or direct-transfer secrets.

The printable output is deliberately UTF-8 plaintext. Before generation, both clients must state that plainly and require the planner to confirm:

1. the included directions were reviewed and the file is plaintext;
2. a saved, shared or printed copy cannot be revoked by Rillora.

The encrypted output is a separate JSON artifact. Before encryption, both clients must require the planner to confirm:

1. loss of the offline recovery key can make a recovery-only package permanently unreadable;
2. anyone who obtains both the recovery key and matching package can decrypt it, and external copies cannot be remotely revoked.

No interface may call the printable guide secure or encrypted. No interface may call the encrypted package delivered, released after death, legally effective or recoverable by Rillora. A package with no eligible accepted recipient device key is usable only with the separately saved Owner recovery key. A synthetic recipient rehearsal proves only that the local acceptance, device-key and decryption protocol can complete with generated data; it is not a real invitation, verified identity, delivery or release.

## Shared Preview Contract

`POST /v1/exports/start-here/preview`:

- creates metadata and an `export.previewed` audit event;
- expires after 15 minutes;
- stores a 32-byte SHA-256 commitment to the complete safe-field Start Here snapshot returned for review, not the plaintext snapshot itself;
- returns `directionsNotPasswords: true`, `legalAuthorityNotGranted: true` and `encryptedPackageCreated: false`;
- requires an explicit UI audience; accepts the corresponding recipient connection ID, or null for a personal guide;
- includes only the chosen safe-field projection; excludes Never disclose, ungranted matters and other people from a recipient guide;
- sends `Cache-Control: no-store` and creates no downloadable file.

The commitment includes the selected audience and projected content. Personal-copy state includes locale/timezone; recipient copies use fixed neutral values and no ungranted plan readiness metadata. Printable generation and encrypted preparation both recompute it and fail closed when the plan changed after review.

## Printable Guide

`POST /v1/exports/start-here/printable`:

- requires an unexpired preview owned by the authenticated planner;
- requires both plaintext and no-revocation acknowledgements to be literal `true`;
- rejects a stale or changed preview using constant-time commitment comparison;
- returns `text/plain; charset=utf-8` with a bounded ASCII filename and random export public ID;
- returns `x-rillora-server-copy-retained: false`;
- builds the guide in memory and stores only export metadata plus an `export.generated` audit event.

`ready` means only that the inline response was generated. It does not prove that a browser or operating system saved, printed, transmitted or opened the guide.

## Locked Client-Encrypted Model

Owner approved the hybrid recipient-public-key direction with an offline Owner recovery key. The implemented local contract has two authenticated stages:

1. `POST /v1/exports/start-here/encrypted/prepare` revalidates the fresh preview, creates a 15-minute pending package, returns the snapshot commitment and at most 20 eligible device public keys belonging to real, accepted, non-simulation invitations;
2. Web or iOS creates and locally verifies the ciphertext and key envelopes, then `POST /v1/exports/start-here/encrypted/:publicId/finalize` accepts the result only if the full snapshot and exact eligible-recipient key set are unchanged.

Each client:

- generates a fresh random 256-bit data-encryption key and 96-bit nonce;
- encrypts the reviewed JSON payload with AES-256-GCM;
- generates a fresh P-256 offline recovery key pair;
- wraps the same data key separately for the recovery key and every eligible recipient device using RFC 9180 HPKE Base mode with DHKEM(P-256, HKDF-SHA256), HKDF-SHA256 and AES-256-GCM;
- binds package ID, preview ID and full source commitment as authenticated associated data, and binds a versioned package-specific key-wrap context;
- decrypts the completed package with the recovery key locally before any ciphertext is submitted;
- clears the temporary data-key byte buffer after use where the platform API permits.

The server validates canonical base64url, exact nonce/key/envelope sizes, valid uncompressed P-256 points, ciphertext SHA-256, package ownership, pending expiry, unchanged snapshot and exact recipient-key membership. It stores ciphertext, nonce, digest, public recovery key, public recipient-key references, HPKE encapsulated keys and wrapped data keys. It never receives or stores the recovery private key, plaintext payload or unwrapped data key.

The cryptographic suite follows [RFC 9180](https://www.rfc-editor.org/rfc/rfc9180) and is implemented with pinned `@hpke/core` `1.9.0` on Web and Apple CryptoKit HPKE on iOS. The stored format identifier is `encrypted_start_here_v1`; the versioned client contract is `rillora-hpke-v1`.

The current local MVP keeps each bounded ciphertext inline in PostgreSQL and rejects ciphertext outside 17–65,536 bytes. This is not a production object-storage, KMS, retention, residency or backup decision. The ordinary planner export remains an Owner recovery package unless independently eligible real recipient-device keys exist; the local synthetic rehearsal uses a separate package and authorisation path that can never make a simulated invitation eligible for that ordinary route.

## Synthetic Recipient Rehearsal

The local-only rehearsal validates the missing recipient half of the cryptographic contract without contacting another person or opening a release path:

1. an authenticated planner selects an existing active trusted-contact record and creates a 30-minute simulation invitation plus rehearsal;
2. the API returns a random one-time acceptance capability in the JSON response; only its SHA-256 digest is stored, and the capability is never placed in a URL;
3. acceptance consumes that capability and returns a separate short-lived `Rillora-Rehearsal` session. It is not a planner Cookie, native Bearer session, Auth0 identity or legal consent;
4. the Web or iOS recipient side generates a P-256 device key in memory and sends only the uncompressed public key. The private key is not serialised, persisted, logged or accepted by the API;
5. a rehearsal-specific prepare/finalize pair binds the package to that rehearsal, the unchanged Start Here snapshot and its exact active device-key set. Ordinary encrypted-package endpoints exclude simulation invitations and rehearsal packages;
6. the rehearsal session can retrieve only the matching ciphertext and its own active recipient envelope. It never receives the Owner recovery envelope or another recipient's envelope;
7. revoking the device key prevents later retrieval through that rehearsal session and clears the session/private key from client memory. It cannot erase plaintext or ciphertext copies already obtained outside Rillora.

The routes exist only when `ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL=true`. Production startup fails closed if that flag is enabled. They send no email or SMS, bind no external identity, validate no death/incapacity/missing evidence and perform no release. Person, role, invitation, rehearsal, device and package states remain separate records rather than one overloaded acceptance flag.

## Minimum-Disclosure Fields

Both current outputs derive from the same safe snapshot:

- planner display name, locale and time zone; plan status;
- matter public ID, title, category, institution/provider when present, safe location hint when present, desired outcome and Rillora status;
- active trusted-contact display name and relationship label;
- permanent map-not-password and no-legal-authority boundaries.

They exclude dedicated `accountHint`, `valueBand`, `currencyCode`, passwords, PINs, recovery codes, seed phrases, private keys and direct-transfer secrets. Printable user strings additionally remove line breaks, control characters and bidirectional override/isolation characters. These controls do not prove a user never placed a secret in an otherwise permitted title or location field; product copy, review and later content controls must continue discouraging that misuse.

## Platform Behavior

- Web keeps the recovery key in React memory, never Web Storage. After successful local recovery verification and server finalization, it offers two explicit downloads: the encrypted package and its separate recovery-key JSON. Nothing downloads automatically; Blob URLs are short-lived and revoked.
- iOS keeps the recovery key and package data in store memory, with cryptography isolated in an injected service. After local verification and finalization, separate `ShareLink` items expose in-memory recovery and package JSON; Rillora does not claim which system action the planner selects.
- Web and iOS both expose the same synthetic rehearsal sequence: create, one-time accept, generate an in-memory device key, enroll only its public key, encrypt a rehearsal-bound package, retrieve it through the recipient session and decrypt locally. Neither client writes the acceptance/session capability or recipient private key to Web Storage, Keychain, disk, URLs or analytics.
- Both clients fail closed on invalid boundary flags, format/version mismatches, malformed cryptographic material, digest mismatch, stale snapshot or changed recipient-key membership.
- Neither client sends a real invitation, verifies a real recipient, delivers an external package or opens a post-death release flow.

## Evidence

Current local synthetic-data evidence:

- API 38/38 tests cover prior behavior plus one-time acceptance, token-digest storage, rehearsal-role RLS isolation, recursive private-key-field rejection, exact synthetic recipient key binding, standard-route exclusion, recipient-only artifact retrieval, post-revocation denial and current role-policy lifecycle boundaries;
- Web API-client 11/11, product-truth 3/3, encrypted-crypto 4/4 and Sites 4/4 pass; the production build passes;
- Web crypto tests prove recovery round-trip, independent wrapping, recipient-session decryption and tamper/wrong-key rejection; API-client tests prove rehearsal capabilities stay out of URLs and the public rehearsal calls send neither planner credentials nor cookies;
- iOS 67/67 tests pass on iPhone 17e Simulator with iOS 26.5; tests cover local recovery, recipient decrypt, wrong-key rejection, memory-only private-key behavior, public-request credential separation and rehearsal store state;
- a fixed encrypted artifact created by Web `@hpke/core` is decrypted by iOS CryptoKit, proving the selected suite and byte contract interoperate in that direction;
- the prior real local browser completed the Owner recovery flow with zero eligible recipient keys. The new synthetic recipient path is currently supported by API integration, Web unit/client/build and native unit/simulator evidence; no new browser or manually driven simulator end-to-end rehearsal is claimed;
- the exact synthetic encrypted package, its source preview, one recovery envelope and related audit records were permanently deleted after validation, and exact-match checks returned zero.

This does not prove real recipient identity, consent, invitation delivery, external package delivery, physical-device key persistence/recovery, external file handling, TestFlight, production storage, production end-to-end encryption, post-death release, legal validity, independent security review or market validation.

## Next Safe Expansion

The role-scoped disclosure rehearsal, planner-authored role editor and stale-snapshot invalidation are now implemented without changing this export contract. The next meaningful expansion is no longer another local export simulation: real invitation delivery with identity-bound acceptance, durable recipient key lifecycle, production storage or claims operations each requires a separate Owner authorisation and reviewed infrastructure. Any actual release remains closed.

## Presentation and recovery-key exit — 2026-09-09

Web and iOS now use Review -> Format -> Save. The initial preview and format
selection create no downloadable file or recovery key. The same minimum-field
preview, cryptographic format, APIs and acknowledgement meanings remain in force.
Details, expiry and encryption explanations are user-expanded; acknowledgements
appear at the relevant Save action. iOS uses whole-row checkbox controls.

Creating an encrypted copy shows separate recovery-key and package actions. A
manual “I kept the recovery key separately” acknowledgement is distinct from
opening a share sheet or starting a download. Until it is checked, leaving or
replacing the preview is guarded. Choosing to keep editing preserves the in-memory
key. Explicitly leaving is allowed and never asserts the key was saved. Web also
protects document unload while an unkept key is present.

Synthetic recipient diagnostics require explicit local flags:
`RILLORA_RECIPIENT_REHEARSAL_TESTING=1` on iOS and
`VITE_RILLORA_RECIPIENT_REHEARSAL_TESTING=1` in a development Web build. They no
longer appear solely because the app is a Debug/development build. This changes
presentation only; it does not enable real recipient delivery or release.
