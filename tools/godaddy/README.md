# Rillora DNS command line

Status: OFFICIAL CLI REUSED; RESEND DNS VERIFIED; LEGACY WWW LIMITATION RETAINED

Last updated: 2026-10-03 (Asia/Shanghai)

The Owner explicitly requested GoDaddy CLI setup. The official `gddy`0.2.20
Apple Silicon binary is installed at `~/.local/bin/gddy` from the public
GoDaddy release installer with its SHA-256 verification. Existing PATH already
includes that directory; no shell profile was changed.

Owner confirmed the exact OAuth scopes and terms at the official consent page:
`domains.domain:read`, `domains.dns:update`, `offline_access`, and the CLI's
default `apps.app-registry:read`. Authentication is refreshable and uses explicit
macOS keyring storage, with no PAT in environment variables or repository.
The browser callback later showed connection-refused after the local listener
ended, but CLI status and actual API calls independently prove authentication
succeeded. Do not repeatedly log in because of that spent callback page.

## October3 strict-review implementation boundary

DNS readback now verifies requested MX priority and CAA flag/tag in addition to
value/TTL. An add may retain an older same-value record with different attributes,
but must find the exact requested new record; a misleading same-value readback fails.
All10guard tests pass with the CLI intercepted. No DNS write or fresh OAuth login
was performed in this review. [Evidence](../../docs/code-review-20261002.md).

## October1 Resend configuration

The existing installation was reused; no reinstall or new GoDaddy login was needed.
Although the access token had expired, the valid refresh grant renewed on an actual
`rillora-dns list`. Four exact Resend DKIM/SPF/MX/CNAME records were previewed and
added, taking 30 records to 34 with every prior record unchanged. Two authoritative
and two public resolvers pass 16/16 checks, plus a separate 4/4 DNS-over-HTTPS read.
The Resend domain is verified. Root Zoho mail, strict notify DMARC, old SES records,
login/staging/web and FanPass remain intact. The historical WWW limitation below
has not been reclassified or retested.
[Current sender contract](../../docs/transaction-mail-resend-20261001.md) ·
[Current receipts](../../collaboration/verification/resend-20261001/README.md).

## Use the project entry

`~/.local/bin/rillora-dns` links to[rillora_dns.py](rillora_dns.py). It always
addresses `rillora.xyz` in `prod`, uses keyring credentials, and exposes only
list/add/set. There is no domain argument, billing, purchase, transfer, nameserver
or domain-deletion command. Raw `gddy` is still account-wide: the vendor does not
offer single-domain restriction on this OAuth page. The project wrapper is an
operational guard, not a provider-enforced security boundary for the credential.
Keep FanPass in its separate workflow and never use this task to change it.

From any directory on this Mac:

```sh
gddy auth status --env prod --credential-store keyring
rillora-dns list
rillora-dns list --type CNAME
rillora-dns list --type CNAME --name app.staging
```

For an intended record change, `add`/`set` preview by default; `--apply` performs
the explicit change after a fresh inventory comparison and owner-only snapshot
under `.local/dns-backups/`. Values are structured process arguments, never shell
code. An application confirms requested values/TTL and unchanged unrelated records
through an API readback. If the provider reports failure, preserve the snapshot
and inspect the current records instead of blindly repeating a write.

`set` replaces a type/name record set using the provider's non-atomic per-record
API. Do not treat a preview, snapshot or exit code alone as a completed change.
The wrapper does not expose automatic replacement of conflicting record types.
Snapshots and credentials are excluded from Git.

September24 exposed a CNAME-specific problem: gddy0.2.20's ordinary replacement
tries to create the new value before deleting the old one, which the provider
rejects as conflicting CNAME data. The guard now handles exactly one existing
and one replacement CNAME: snapshot/recheck, remove only that name, add the new
value, and attempt restoration of the prior value/TTL on failure. Concurrent
changes stop the operation; a matching value/TTL is a no-op. The public command
still exposes no general delete operation. This remains non-atomic and can have
a short lookup gap; never describe it as a provider transaction.

Eight local checks and an actual temporary CNAME create/replace/read/cleanup pass,
returning the full zone to its prior digest. The old pre-existing `www` record
still failed through that CLI path and kept its prior value; its underlying legacy
record limitation is not fully diagnosed. The normal GoDaddy edit UI successfully
changed only `www`, then CLI/four DNS resolvers/HTTPS confirmed the desired result.
Do not confuse this record-specific limitation with expired OAuth credentials;
actual keyring renewal worked. See[the new QA](../../output/qa/rillora-production-identity-20260924/cname-guard-live-acceptance.json).

## Actual acceptance

- CLI read all20Rillora records, including the exact production ACM CNAME.
- A generated `_rillora-cli-check-…` TXT preview caused no mutation.
- Actual creation/readback passed; unrelated records were unchanged.
- Cleanup removed only that new TXT after checking its exact value/TTL.
  Records returned20→21→20 and the full original zone digest matched.
- Four local guard tests cover another-domain/billing rejection, safe argument
  values, unrelated-record change detection and relative names. They also run inCI.

No FanPass record, billing setting, domain registration, owner/contact detail or
authoritative nameserver was changed. [Evidence](../../output/qa/rillora-production-runtime-20260924/godaddy-cli/cli-write-acceptance.json).

## Credential renewal and portability

Use `gddy auth status` before assuming a session is valid. OAuth can refresh while
its grant remains valid; revocation/provider requirements can still require a new
human login. Do not export the keychain token, place it in arguments or create an
extra PAT just to avoid a standard renewal. A future headless service needs its
own minimally scoped credential and operational acceptance.

The alias points to this checkout. If the repository moves, recreate that symlink;
the Python wrapper resolves its own real location. On another machine, install
official `gddy`, authenticate that machine, and use the tracked wrapper. Credentials
are deliberately not restored from Git.

Official references: [CLI setup](https://developer.godaddy.com/en/docs/api-users/cli/set-up),
[CLI workflows](https://developer.godaddy.com/en/docs/api-users/cli/reference),
[authentication/scopes](https://developer.godaddy.com/en/docs/api-users/auth).
