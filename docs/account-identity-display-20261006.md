# Current account identity display

Status: REVIEWED AND MERGED; AFFECTED LOCAL/CI VALIDATION PASSED; NOT DEPLOYED
Last updated: 2026-10-06 (UTC)

The Owner asks both Web and native iOS to identify the currently signed-in account.
This additive read does not change authentication, grants, consent, prices or account
linking. No schema migration or provider setting is required.

## October7 local integration follow-up

The subsequent Owner request authorizes review, direct fixes and merge. [PR1](https://github.com/tantalum666/rillora/pull/1)
now integrates both clients/shared API into the current release branch. Actual Xcode
Debug/Release,272unit passes/1known platform skip, six affected English/Chinese UI
scenarios,174Web/17APIchecks and integration CI73/20browser scenarios pass. Two native
compile failures and two UI-test visibility assumptions were repaired, not hidden.
This does not repeat the wider previous device matrix or deploy the new source.
[Exact review and current boundaries](dot-integration-20261007.md).

Earlier cloud/build5 observations below retain their original dated scope.

## API contract

`GET /v1/account/identity` (also under the existing `/api` prefix) uses the same
authentication, workspace-identity precondition and no-store middleware as the rest
of the private API. It returns:

```json
{
  "account": {
    "publicId": "11111111-1111-4111-8111-111111111111",
    "displayName": "Synthetic account",
    "verifiedEmail": "owner@example.test"
  },
  "emailStatus": "available"
}
```

The account name/ID come from the authenticated planner. Email is read transiently
using the existing configured Auth0 exact-subject verifier; it requires the exact
server-selected user ID and boolean verified-email proof. It is not inferred from
authentication methods, a browser hint, another account or an email digest. Raw
provider subject, issuer, tokens and hashes are never returned. There is no email
cache, database write, new scope or new secret. Development fixtures have no email.

`verifiedEmail` is nullable. `emailStatus` is `not_provided` when the configured
provider returns no verified email, and `unavailable` when no verifier is configured
or a provider lookup fails. The account name and full public ID remain available.
Revocation or identity remapping during lookup discards the response with401.

Clients must bind `account.publicId` to their current session, clear identity on
logout/account change and discard canceled/stale responses. Display name is a label,
not proof of a legal identity. Old servers may404; clients can use the existing
account profile name/ID and an honest email-unavailable state. Existing `/session`,
`/overview`, native issuance and `/account/profile` contracts remain unchanged.

## Verification boundary

Cloud API typecheck and build pass. The new identity unit cases plus existing
email-verification/identity-proof cases pass17/17. Integration cases cover Cookie
and Bearer, anonymous/mismatched-account rejection, no-store, provider fallback,
revocation and no email persistence. Local PostgreSQL is unavailable, so these
database-backed cases were then verified by [CI62](https://github.com/tantalum666/rillora/actions/runs/37495149572) for8cc5e10042d5c9f3688b1093306b2e4377a92c82. This is not
deployment, production identity acceptance or a claim that the full UI review is done.
