# Start Here Export Contract

Role: Start Here preview, printable guide and client-encrypted package contract  
Authority scope: included fields, disclosure boundary, cryptographic format, file lifecycle, cross-platform semantics and evidence language  
Superseded by: a later reviewed decision recorded in `docs/decision-log.md`  
Do not use for: claiming legal authority, real recipient identity/acceptance/delivery, post-download revocation, production release or universal legal validity  
Status: PLAINTEXT GUIDE, OWNER RECOVERY AND SYNTHETIC RECIPIENT REHEARSAL IMPLEMENTED; REAL DELIVERY AND RELEASE CLOSED  
Last updated: 2026-08-10

## Product Boundary

Start Here is a map for the next person, not a password vault, transfer instrument or legal document. Both current outputs use the same reviewed, minimum-disclosure Start Here snapshot. It contains directions and active contact labels, not passwords, PINs, recovery codes, seed phrases, private keys or direct-transfer secrets.

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
- includes only the fields used by the two current outputs, active matters and non-revoked trusted-contact roles;
- sends `Cache-Control: no-store` and creates no downloadable file.

The full-snapshot commitment includes otherwise non-printed snapshot state such as locale and time zone. Printable generation and encrypted preparation both recompute it and fail closed when the plan changed after review.

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
