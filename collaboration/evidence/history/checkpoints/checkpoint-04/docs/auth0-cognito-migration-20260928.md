# Auth0 to Amazon Cognito: migration and operating cost

Role: focused research and migration planning, not an implementation decision
Status: NO MIGRATION APPROVED OR STARTED; RETAIN AUTH0 FOR CURRENT RELEASE
Last updated: 2026-09-28 (Asia/Hong_Kong)

## Recommendation and scope

Owner asks whether a future move from Auth0 to AWS would be complex or expensive.
Amazon Cognito is the relevant AWS identity service. Keep the existing Auth0
implementation for the current launch; obtain SES reconsideration separately.
At the anticipated100–1,000 MAUs, the published Auth0 Free and Cognito Essentials
identity fees are both zero, subject to eligibility and feature requirements.
Migration therefore does not currently save an identity subscription fee.

This is a moderately sized identity migration before a large customer population,
and a more demanding continuity project after launch. It is not a business-data
rewrite. No date estimate or seamless-password/passkey claim is established by
this static review; a chosen transition strategy and isolated rehearsal come first.

## Current architecture inspected

- `app.identity_accounts` binds an exact issuer/subject pair to a Rillora planner
  ID. Business data, sharing permissions and commerce reference Rillora identities.
  PostgreSQL/KMS are already on AWS. Preserve every business UUID and relationship.
- `IdentityProvider` and Web code use standard OIDC discovery and Code+PKCE.
  This is a useful substitution boundary, not proof of Cognito compatibility.
- Native verification currently expects Auth0-shaped `azp`, audience and scopes;
  iOS uses Auth0.swift. Cognito requires its own exact issuer/JWKS, token type,
  client and scope validation. Do not remove checks to make a new token pass.
- Account deletion and fresh verified-email checks use Auth0 management services.
  Hosted legal acceptance, recovery/invitation return, provider logout and credential
  lifecycle also need replacement or explicit compatibility tests.

Source pointers: [identity provider](../apps/api/src/identity.ts),
[own sessions](../apps/api/src/auth.ts),
[identity mapping](../apps/api/migrations/0005_oidc_identity_sessions.sql),
[native service](../apps/ios/Rillora/Core/Authentication/NativeAuthenticationService.swift),
[account deletion](../apps/api/src/account-deletion.ts).
[Cognito token verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html).

## The difficult part: retaining account ownership

1. Inventory the actual login methods and exact bindings; keep a reversible map
   from each proved old identity to the same Rillora business UUID. A matching email
   is not sufficient proof for linking accounts or revealing shared information.
2. Configure direct Google/Apple connections, domain/callbacks and verified account
   return. Do not assume a new provider subject equals the old Auth0 subject.
3. Select the password strategy. Auth0 Free does not provide password-hash export;
   ordinary Management API exports exclude password hashes. Eligible paid export
   requires a support process without a guaranteed completion time. Plan a secure
   password reset or separately reviewed lazy migration if hashes are unavailable.
4. Current Cognito documentation does support CSV import with compatible password
   hashes; do not repeat the obsolete general claim that Cognito cannot import
   them. Without hashes, CSV-created password users require a reset. Lambda-based
   migration can verify a password against an old directory but changes credential
   handling and is not approved or enabled by this planning exercise.
5. Rehearse MFA/passkey handling and offer re-enrolment if required; do not claim
   credentials are portable merely because the hostname is preserved. Invalidate
   old sessions deliberately and prove recovery, invitations and deletion still work.
6. Cut over a small verified cohort, test denied cases and rollback, then retire
   the old issuer/management capabilities after their actual token lifetimes.

[Auth0 export limits](https://auth0.com/docs/troubleshoot/customer-support/manage-subscriptions/export-data),
[Cognito CSV/password-hash import](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-using-import-tool.html),
[Cognito lazy migration](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-import-using-lambda.html).

## Current price comparison

Checked September28 against public pricing. USD per month, identity charges only,
before tax; not a saved quote or actual bill. Assume direct password/social login,
no other pool consuming this account/organisation's free allocation and no paid
extras. MAU counts active people, including relatives, rather than paid households.

| Monthly active users | Auth0 Free | Cognito Essentials | Cognito Plus |
| --- | ---: | ---: | ---: |
| 100 | 0 | 0 | 2 |
| 1,000 | 0 | 0 | 20 |
| 10,000 | 0 | 0 | 200 |
| 25,000 | 0 | 225 | 500 |

Auth0 Free advertises25,000 MAUs. Its B2C Essentials entry quote is35USD/month for
500 MAUs, with paid feature/usage tiers separate; do not apply35USD to25,000MAUs.

Cognito Essentials supports managed login and passkeys, includes10,000 eligible
MAUs/month, then charges0.015USD/MAU. Thus25,000 is
`(25,000 - 10,000) * 0.015 = 225`. Plus includes added threat protection and has
no MAU free allocation:0.020USD/MAU. These columns are not feature-equivalence
claims; verify rate limits, abuse controls, support and actual required protections.
Lite has a different feature set and is not used to underprice the required
passkey/managed-login comparison. Older50,000-MAU grandfathering is not assumed.

SES mail, SMS, WAF/Lambda/logs, M2M and replication extras are excluded. Identity
pool pricing for AWS credentials is not user-pool login pricing. If Auth0 is kept
upstream as a custom OIDC provider, the50-MAU federation allocation differs from
the10,000 direct/social allocation; do not use the above calculation for that bridge.

[Auth0 pricing](https://auth0.com/pricing),
[Cognito pricing and features](https://aws.amazon.com/cognito/pricing/).

## When to revisit

Compare again if required Auth0 features force a paid tier, real usage approaches
the existing thresholds, or demonstrated operating savings outweigh migration
and acceptance work. Provider concentration can simplify administration, but it
does not remove SES review, user recovery, monitoring or the final release gates.
Keep the existing [portability contract](solo-operations-and-portability.md) and
[identity/mail release gate](production-identity-mail-20260924.md).
