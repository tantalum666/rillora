# Rillora Current Handoff

Status: RESEND AND AUTH0 TRANSPORT VERIFIED; REVIEW FIXES AWAIT AWS LOGIN; RELEASE INCOMPLETE
Last updated: 2026-10-01 (Asia/Shanghai)

## Current Owner task — configuration complete

Owner selected Resend, registered the account, installed its plugin and completed
`resend login --profile rillora`. GoDaddy CLI was already installed and renewed its
existing credentials automatically. The native Auth0 provider is now enabled with
`Rillora <account@notify.rillora.xyz>`, using a dedicated domain-restricted send key.
The verified Resend domain has enforced TLS, no open/click tracking and no receiving.
[Current configuration and operations](transaction-mail-resend-20261001.md).

This replaces the old SES-first direction; retain the existing SES case without
another application/message. Its approval no longer blocks this sender. Auth0 still
owns identity and recovery; the setting is tenant-wide, including current Preview
mail. Current UI/full03 brand, Free1/Family5, Web US$88.99 annual-only, conditional
Apple prices, real data and FanPass are preserved.

## Completed and verified

- Four DNS additions preserve all prior30 records. Public/authoritative checks pass
  16/16 and DNS-over-HTTPS 4/4; Resend reports domain verified.
- Auth0 and Resend settings are read back. Operator `gpt` stays in the CLI; Auth0 uses
  the domain-restricted send credential, protected in Keychain and provider storage.
  No key value is in Git or receipts. Auth0 renewal retained the same92 scopes.
- Current Free limits are100/day and3,000/month, with pay-as-you-go off. Three official
  failure simulations returned bounced/complained/suppressed and are readable by API.
- Direct sender and Auth0-generated verification mail each reached the official
  Resend delivery simulator. The uniquely tagged new Auth0 identity was deleted and
  absence verified; no real identity, private map or Rillora API was used.
- Missing public Auth0 support fields now point to the existing support mailbox and
  verified `/support` page. Templates, hosted UI and client bindings were unchanged.
- [Current receipts](../collaboration/verification/resend-20261001/README.md) retain
  actual provider results and the limits of this check. No product tests, deploys,
  Apple uploads or provider applications were repeated.

The previous complete Git preservation remains verified:46,768 work paths,
8,876 readable evidence copies and7 encrypted/LFS archives, all20,108 objects
read back from a fresh remote clone. [CI42](https://github.com/tantalum666/rillora/actions/runs/36737542600)
passed for source `4befe456763d38e7f3385e52a5165bfe698e6b0a`; this mail change has
no runtime source modification. [Preservation receipts](../collaboration/verification/README.md)
and [Dot guide](../collaboration/README.md) remain the source of that dated proof.
Reuse the165-file/29,003-line full body-reading ledger and the focused continuation
reads; a chat restart does not authorize repeating completed work.

## Evidence boundaries and blockers

Simulated `delivered` proves transport, not real inbox placement, completed email
verification, password reset or invitation continuation. Real suppression history,
external alarm delivery and legal/market acceptance remain separate. Resend stores message/log
data in the US despite the Ireland sending region; internal processing facts are
recorded, not described as a new public legal approval.

All13 Dot findings are locally repaired. Retained checks:API349,Web112,infra47,
native181 pass/1 existing StoreKit skip, and final passing outcomes for28 targeted
native UI cases. Closed repaired API/Web/router/WWW candidates, signed IPA and
4iPhone/2iPad store designs are preserved; no new upload or deployment occurred.

October1 actual read-only STS attempts confirm `rillora-operator`,
`rillora-cdk-session` and `rillora-production-operator` all expired. Last observed
production remains API7/schema0091 with customer access closed. Owner login/legal
acceptance, review enrollment, real Apple Sandbox purchase/restore/notifications,
usable TestFlight/App Review, SBP fee and final Apple price remain open. Merchant
and physical-device facts remain Owner-deferred.

## October1 remaining-work review

Owner asked what still prevents launch. The [seven work packages](release-readiness.md#october1-remaining-work-inventory)
reconcile the existing gate register without inventing new completion or retesting.
This status check corrected stale SES wording in the earlier engineering and Dot
entry documents. No provider portal/session was rechecked, no application repeated,
and no new decision or change to the release scope occurred. The next step is unchanged.

## Single next step

Restore the actually expired existing AWS operator session with the Owner's required
login/MFA, then deploy the already prepared repaired API, closed Web/invitation
router and WWW artifacts and read back their exact versions. Preserve schema0091
and reuse unchanged acceptance evidence. Do not ask for Resend/GoDaddy/Auth0 login
again unless a later real request shows expiry. The
[previous handoff](handoff-history-20261001-before-resend.md) is historical.
