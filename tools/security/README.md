# Rillora operator credential protection

Status: SOURCE / SYNTHETIC AND HARDWARE DENIAL CHECKS PASSED; REAL MIGRATION NOT RUN
Last updated: 2026-10-11 (Asia/Hong_Kong)

This tool protects the named Auth0 and Apple operational files used by the updated repository helpers.
It does not move cloud secrets, revoke keys, provision Apple resources, replace a password manager,
or migrate the collaboration age identity. The current work is code/tests only.

## Storage and trust

`CredentialVault.swift` uses a nonpersistent Secure Enclave P-256 key with
`privateKeyUsage` and `userPresence`, ephemeral ECDH, HKDF-SHA256 and AES-GCM.
The version2 local reference contains a UUID and encrypted envelope; the private key
is a device-bound opaque representation. Account UUID is authenticated context.
Normal reads require a fresh system authentication context with no Touch ID reuse window.
The helper refuses to return credentials to an interactive terminal. The Python caller
requires the existing Rillora team signature and the exact helper identifier, verifies
owner/private file permissions and rejects symlinks or malformed references.

The original bare-CLI Data Protection Keychain prototype was replaced after checking
[Apple's Keychain guidance](https://developer.apple.com/documentation/technotes/tn3137-on-mac-keychains)
and the [CLI provisioning limitation](https://developer.apple.com/forums/thread/836816).
The implemented cryptography follows the [Secure Enclave API](https://developer.apple.com/documentation/cryptokit/secureenclave/p256/keyagreement/privatekey).
It is device-bound: copying the reference to a different Mac is not recovery. Preserve
the provider's independent recovery process and an authorized backup policy before a real migration.

## Future installation and migration

Use an existing Rillora signing identity with `build_credential_vault.py --identity ...`.
The script compiles to a temporary directory, signs and verifies the helper, then installs
`.local/bin/rillora-credential-vault`. It creates no provider credential and requests no
new entitlement/profile. The first nonsecret `ensure_ready()` probe requires user presence.
Run this preparation before creating any new provider credential; failed preparation must not
lead to repeated provider creations or plaintext fallback.

`migrate_local_credential.py <existing-path>` only reports metadata by default. The explicit
`--apply` path verifies a protected roundtrip before replacing the original path atomically.
Cancellation, mismatch, unsupported path or changed source keeps the original. An interrupted
pending envelope is retained for recovery; do not delete it or create a duplicate automatically.
After migration, readers require the encrypted representation. Existing legacy plaintext is
deliberately rejected until that file has been explicitly migrated.

The supported paths are the exact Auth0 service/reviewer/Web-client JSONs, the StoreKit private
P8, and `apple/AuthKey_<10-character-key-id>.p8` listed in the migration module. Public key IDs
and issuer IDs remain ordinary owner-only configuration. Other provider files and the age
archive identity are outside this migration. No batch filesystem sweep reads secret contents.

Provider uploads use `run_with_private_json`: a separate inherited anonymous pipe, closed
stdin and captured output. Secrets do not enter command arguments or temporary JSON files.
Do not print the returned credential or a raw provider response. Publication redaction still
collects known legacy secret values under its prior policy, but does not unlock these envelopes.

## Verification and limits

Seven Python tests cover encrypted references, no fallback, failed readback preserving legacy
files, bounded transfer and migration scope. The current Swift source compiles, and the fixed
`test-unattended` operation reports successful nonsecret hardware roundtrip plus denied
unattended access, tampering and wrong-account access. This operation accepts no caller payload
or downgrade switch. The successful control uses an unprotected synthetic hardware key so no
human authentication is invented; the protected negative control uses the real access flags.

The formally signed helper installation and a real user-confirmed credential migration have
not run. The design contains unattended file theft; it does not defeat a fully controlled OS
during an authorized use, prove old disk blocks/backups erased, or establish provider rotation.
[Task evidence and remaining gates](../../docs/security-remaining-five-20261011.md).
