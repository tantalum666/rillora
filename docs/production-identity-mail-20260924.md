# Production identity and transaction mail

Role: focused release integration and evidence boundary

Status: MAIL DOMAIN VERIFIED; FREE AUTH0 WITH CONTROLLED PRELAUNCH CUTOVER SELECTED

Last updated: 2026-09-25 (Asia/Hong_Kong)

## Current scope and findings

Continue the existing production release workflow. The verified database, recovery
journal, closed HTTPS runtime, UI and annual-only offer remain unchanged. Existing
AWS, Auth0 and GoDaddy CLI access is recovered. The AWS session expired during
this workflow; Owner completed the requested login and the refreshed CLI identity
was verified on September25. Do not repeat that completed authentication.

Auth0's actual Team subscription is Free, with25,000MAU and1,000M2M tokens.
The authenticated Tenants page reports the one-tenant quota reached. Its current
B2C Essentials quote is35USD/month before tax,500MAU and3tenants. Higher MAU tiers
need a new quote; do not assume Free's25,000MAU persists at that paid price.
Owner asks to keep testing now and clean before launch. Keep Free; no subscription
upgrade is approved or purchased.25,000MAU counts active users, including relatives
who log in, not just paying households.100users do not require a MAU upgrade.

Production and staging must not share a tenant-wide identity-deletion credential.
Separate clients/audiences alone do not isolate user deletion, email, MFA and
tenant-wide configuration. The former recommendation to run two independent
tenants long-term is superseded for this stage. Retain this existing EU tenant,
prepare separate exact production clients/API audience, and retire staging's
live identity access before opening production. The tenant's old `rillora-dev`
name is immutable; changing its environment label would not clear any data.

Prelaunch cleanup is a reviewed cutover, not a blanket delete-users operation:
inventory exact synthetic/Owner test subjects and dependencies, decide any Owner
map preservation/export, revoke old sessions/invitations and test M2M grants,
disable the old Web/native connection bindings, and remove staging's credentials.
Require actual negative checks for old clients and tokens. Only then enable the
prepared production clients, reviewed email/provider settings and final artifacts.
Keep the separate production PostgreSQL/KMS/recovery baseline; do not promote the
staging database. Development continues with isolated local/synthetic identity
fixtures; simultaneous real-identity staging can justify a paid separate tenant
later. Current test records/logins are deliberately not deleted or disabled now.

Retirement also needs a token-expiry window: already issued Management API JWTs
cannot be revoked merely by rotating a client secret. The current Management API
lifetime readback is 86,400 seconds. Stop old issuers/grants/workers, then wait out
the applicable maximum issued lifetime plus clock tolerance before real customer
identities are admitted, and verify the old capability is rejected. Do not
misinterpret the deletion worker's one-hour local cache as token expiry.
Internal Auth0 Management API audiences are excluded from the advertised M2M
token quota; that quota is neither the MAU count nor a count of all app API calls.
[Management token lifecycle/quota](https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens).

Sources: [Auth0 environments](https://auth0.com/docs/get-started/auth0-overview/create-tenants/create-multiple-tenants),
[limits of separation within one tenant](https://support.auth0.com/center/s/article/Using-Auth0-Tenant-for-Production-and-Development).

## Transaction mail foundation

The existing tenant has no external email provider. AWS SES Frankfurt is currently
in the sandbox:200messages/day,1/second and verified recipients/simulator only.
No pre-existing SES identities/configuration sets were found in that region.

Use a separate `notify.rillora.xyz` sending identity, `account@notify.rillora.xyz`
for account messages, and `bounce.notify.rillora.xyz` as the envelope domain.
Keep root Zoho MX/SPF/DKIM, support/privacy/security mailboxes and all existing
login/staging/ACM/FanPass records. The planned DNS addition is three Easy DKIM
CNAMEs, bounce MX/SPF and a sending-subdomain DMARC record, not root MX replacement.

`RilloraMail` is an independent opt-in CDK stack.2048-bit Easy DKIM, required
delivery TLS and reject-on-MAIL-FROM-MX-failure are explicit. SES suppresses
bounces/complaints. CloudWatch receives aggregate send/delivery/failure counters;
opens/clicks, message bodies, recipient logs and paid deliverability extras are
not enabled. Existing Operations gains exact configuration-set alarms using its
existing confirmed subscriber. Missing mail events mean idle, not a failure.

The foundation creates no sender credential and does not switch Auth0 away from
its current development provider. After the underlying evidence existed, a limited
transactional production-access request was submitted as recorded below. Domain
verification is not email delivery. The request describes the actual website,
recipient source and bounce handling. No marketing or unsolicited invitation email
is introduced.

Sources: [Auth0 Amazon SES](https://auth0.com/docs/customize/email/smtp-email-providers/configure-amazon-ses-as-external-smtp-email-provider),
[SES sandbox and production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html).

## Apply and verify

Run infrastructure typecheck and focused mail/Operations tests. Synthesize and
inspect the separate mail template, then deploy with `mailOnly=true` and the
existing `rillora-cdk-session` profile. Read the actual DKIM outputs before using
the Rillora DNS guard. Preserve a before-zone snapshot and compare every unrelated
record after writes. Require SES DKIM/identity/MAIL-FROM success and independent
authoritative/public DNS readback. Deploy the separately reviewed Operations diff.

Only a dedicated sender credential scoped to this identity/from address may later
be installed during the reviewed Auth0 production cutover. Its exact grant, protected
storage, real verification/reset/invitation continuation and failure behavior need
separate acceptance. Native Release values must not be filled with staging IDs to
make the preflight green. Public accounts, commerce and App Store release stay closed.

Current live results, tests and pending work belong in
[QA](../output/qa/rillora-production-identity-20260924/) and[handoff](handoff.md).

## Preparing clients without activating them

`tools/auth0/prepare-production-clients.py` previews by default and only creates
the two exact named production clients and `urn:rillora:production:api` audience
when passed `--apply`. Web callbacks/origins are only `app.rillora.xyz`; native
uses the existing reviewed custom-domain callback. Code flow, RS256 and900second
tokens are explicit. There is no implicit/password/offline grant. Every connection
stays disabled for the new clients; all old client bindings are compared unchanged.
The Web credential is retained only in an ignored mode0600file. No new M2M
permission or paid plan is created. This preparation is not successful customer login.

Actual preparation/readback is complete: both new clients are disabled on every
connection and the old bindings match. The API audience is distinct from staging.
The official pricing page and authenticated subscription were checked again after
Owner questioned the apparently inverted quotas: Free includes25,000MAU;35USD is
only the500MAU paid starting tier, not an upgrade retaining25,000MAU.
[Official pricing](https://auth0.com/pricing).

## Live mail and Google result

RilloraMail is CREATE_COMPLETE. SES reports identity/DKIM/MAIL-FROM SUCCESS;
configuration readback requires TLS, suppresses BOUNCE/COMPLAINT and disables
open/click engagement metrics. Six DNS additions match two authoritative and two
public resolvers, preserving all prior20records. The real mailbox simulator yielded
Send3/Delivery2/Bounce1/Complaint1 without an explicit configuration-set override,
proving the identity default. Bounce/complaint alarms executed their SNS actions.
This does not prove a person's inbox/spam placement or real-address suppression;
AWS deliberately excludes simulator addresses from reputation/suppression effects.

The truthful prelaunch transaction-mail production-access request has been submitted
to AWS with the live public website and low-volume planning assumptions. Actual
first readback was PENDING; the later API readback is DENIED (case179022088800001),
with `ProductionAccessEnabled=false`.200/day and1/second remain. After Owner login,
the actual Support Console message was read: AWS asks for frequency, recipient
sources/list maintenance, bounce/complaint/unsubscribe handling and mail examples.
It invites a reply for further review and does not state a terminal refusal or a
specific registration, DNS or reputation defect. Keep the API status and the
case wording separate. The Support API requires Premium Support, but the ordinary
console is accessible; no support-plan upgrade is needed or purchased.
Auth0 still has no external provider and no SES sender credential was created.
Existing SES Essentials pricing is metered, currently0.16USD/1,000outbound messages,
not Auth0's35USD subscription; no SES Pro or fixed commitment was bought.
[SES pricing](https://aws.amazon.com/ses/pricing/),
[simulator boundaries](https://docs.aws.amazon.com/ses/latest/dg/send-an-email-from-console.html).

Google project `rillora-production-identity` is created separately from the old
Testing project. Owner confirmed the current Google API User Data Policy before
its brand initialization was submitted. Rillora's03Logo, actualwww homepage,
current legal URLs and authorized root domain have been saved and reopened.
The project remains Testing; no production-publication or ordinary Google login
is inferred. The separately approved OAuth client and minimal scopes are now saved
as recorded below. Domain/brand verification and controlled Auth0 connection
replacement remain distinct from this configuration result.


## September25 final preparation checkpoint

Owner separately approved creating and securely saving the exact Google hosted
Web client. Creation is confirmed in the client list; its downloaded JSON matches
the expected project, singlelogin origin and callback. It is stored mode0600 in
the ignored protected directory and removed from Downloads. Only openid,
userinfo.email and userinfo.profile are saved; sensitive/restricted scope tables
remain empty. Actual Auth0 Google connection readback still points to the original
test client. The new Google key has not been installed there or used for a login.

SES production approval remains an external gate; do not silently switch providers,
weaken verification or claim real delivery. A concrete follow-up with the limited
transactional use case and two proposed message examples is prepared and filled
in the case reply form. Submission awaits Owner's explicit authorization to send
that message to AWS, not another engineering permission or login. The old test
flows remain available. Protected Google/Web secrets remain outside source and QA.
