# Rillora transaction mail — Resend

Role: current sender configuration, operating contract and evidence boundary
Status: DOMAIN VERIFIED; AUTH0 PROVIDER ACTIVE; SIMULATOR TRANSPORT PASSED; REAL USER ACCEPTANCE OPEN
Last updated: 2026-10-02 (Asia/Shanghai)

## Owner decision and scope

Owner explicitly selected Resend after registering the account and installing its
plugin, then completed local CLI authentication. This supersedes the September28
SES-first direction. Auth0 continues to own identity, verification links and password
recovery. Resend supplies transactional delivery; GoDaddy remains authoritative DNS.
No Cognito migration, paid plan purchase, public customer activation or marketing
workflow is part of this change. The existing SES case is retained without another
message or application; SES approval is no longer a prerequisite for this sender.

The provider setting is tenant-wide on the retained `rillora-dev.eu.auth0.com`
tenant, so current Preview account mail also uses Resend. Production clients,
review restrictions and customer cutover remain governed by the
[identity contract](production-identity-mail-20260924.md). UI, prices, real records,
root Zoho mail and FanPass are unchanged.

## Applied configuration

| Setting | Read-back value |
| --- | --- |
| Resend domain | `notify.rillora.xyz`, verified |
| Domain ID | `e44b01df-6a2a-4dfb-bd74-a70ed851d2f3` |
| Sending region | Ireland, `eu-west-1` |
| Capabilities | Sending enabled; receiving disabled |
| TLS | Enforced; confirmed in the reloaded Configuration UI |
| Tracking | Open and click tracking both disabled |
| Current plan/limits | Free; 100 emails/day, 3,000/month; 3 domains; 10 API requests/second |
| Paid overage | Transactional pay-as-you-go off; control disabled on the current plan |
| Auth0 provider | Native `resend`, enabled |
| From | `Rillora <account@notify.rillora.xyz>` |
| Sender credential | `Rillora Auth0 notify sender`; `sending_access`; restricted to this domain |
| Operator credential | Existing `gpt` key retained only for operator CLI use |
| Auth0 support metadata | `support@rillora.xyz`; `https://www.rillora.xyz/support` |

The sender key is held in macOS Keychain under service `xyz.rillora.resend`, account
`auth0-notify`, and in Auth0's protected provider credential field. No token value
is in source, QA, command literals or Git. The sending permission is domain-bound;
it is not a provider-enforced restriction to one local-part such as `account`.

GoDaddy's existing official `gddy` 0.2.20 and the Rillora-only wrapper were reused.
An expired access token renewed automatically on an actual read. Four records,
each with TTL 600, were added after preview and a protected before-zone snapshot:

| Type | Relative name | Value |
| --- | --- | --- |
| TXT | `resend._domainkey.notify` | Exact public DKIM value from the authenticated Resend domain page; retained in the DNS receipt |
| MX | `send.notify` | `feedback-smtp.eu-west-1.amazonses.com`, priority 10 |
| TXT | `send.notify` | `v=spf1 include:amazonses.com ~all` |
| CNAME | `rsend.notify` | `send.forge.rmta.net` |

All prior 30 records remain unchanged; the zone now has 34 records. This preserves
root Zoho MX/SPF/DKIM, the existing strict `notify` DMARC, login/staging/web records
and the old SES foundation. It does not move the root inbox or enable Resend receiving.
Record values come from the actual domain configuration, not a generic DNS example.

## Actual verification

- All four records matched two authoritative servers and two public resolvers:
  16/16 checks. A separate DNS-over-HTTPS read matched 4/4 records.
- Resend's API and domain page both reported verified. The API confirmed sending
  enabled, receiving disabled, and tracking off. In this API version, domain GET
  omits `tls`; the saved, reloaded Configuration UI supplies that specific evidence.
- Auth0's original administrator CLI session had actually expired. Its normal
  device renewal reused the existing original administrator session with the same
  92 scopes; no new management permission was added. The provider was initially
  absent, then created once and read back with explicit public fields.
- A direct send with the restricted sender key reached Resend's official delivery
  simulator. Email `01a0f35d-364f-740b-be90-976acf970486` reported `delivered`.
- Auth0 generated a verification email for one uniquely tagged synthetic identity
  addressed to the official simulator. Job `job_BsnsZBI1skWhOGNA` completed;
  Resend email `01a0f369-5f2a-7250-af1c-79d454b183a6` reported `delivered` with the
  configured From. The verification link was not followed and `email_verified`
  stayed false. Only that new tagged identity was deleted, with absence confirmed.
  No Rillora API, real identity or private map was used.
- Nine email templates retain platform defaults; no custom bodies were installed.
  Missing tenant support fields were filled with the existing public contact and
  the verified HTTP 200 `/support` route. An initial `/help` candidate returned 404
  and was never saved to Auth0.

Three additional official simulations separately returned `bounced`, `complained`
and `suppressed`. Their API events are retained in the failure-state receipt; no
additional Auth0 identity was created.

The two successful sends target only `delivered+…@resend.dev`; the three failure
cases target Resend's documented simulator addresses. Resend documents these as
simulated deliveries which count toward quota. They prove transport and integration,
not a person's inbox placement, spam filtering, successful verification or recovery.
[Official simulator documentation](https://resend.com/docs/dashboard/emails/send-test-emails).
Do not repeat these five sends or recreate the temporary identity when resuming this work.

## Data processing and operating boundaries

Resend receives necessary account/security email data: recipient, transactional
subject/body, Auth0 verification or recovery link, and delivery metadata. It receives
no private-map contents through this integration. Open/click tracking and receiving
remain disabled. Auth0 still validates the links and owns account-state transitions.

Resend's published processing information places email content, logs and account
data in the US; Ireland is the sending region, not an EU-only storage guarantee.
Its published default retention for Free/Pro/Scale email and log data is 30 days,
with backup deletion lag described separately. Its DPA applies through the account
terms; this is a provider statement, not a Rillora compliance certification.
[Resend processing information](https://resend.com/security/gdpr).

The current Rillora Privacy Policy already describes necessary account/security
processing, a non-exhaustive service-provider list and limited processing outside
the EEA. This document adds the actual Resend entry to the internal processing
record; it does not claim the public legal text was changed or legally reapproved.
The published legal versions/bundle digest are unchanged. Final public-launch
notice and market review remain within the existing legal release gate.

The authenticated Usage page confirms Free limits of 100 emails/day and
3,000/month, three domains and a shared 10-request/second API limit. Transactional
pay-as-you-go is off and its control is disabled; no billing setting was changed.
The daily limit resets at midnight UTC. These are current limits, not a promise of
unlimited delivery. Quota exhaustion was not induced by flooding the account.
[Official limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits).

The bounced/complained/suppressed simulator events can be inspected using
`resend emails get <recorded-id> --profile rillora --quiet` and the Emails dashboard.
Resend documents automatic suppression after real hard bounces or spam complaints;
the simulations validate event visibility, not a real address's suppression history.
Keep suppression intact and diagnose the recipient/cause instead of retrying blindly
or falling back to an unapproved SES sender. No retry worker was introduced.
[Suppression behaviour](https://resend.com/docs/knowledge-base/why-are-my-emails-landing-on-the-suppression-list).
Existing SES CloudWatch alarms do not monitor Resend. No delivered external Resend
alarm or Auth0 end-user failure ceremony is claimed from these provider results.

## Remaining release acceptance

Real-user verification, password reset and invitation continuation still need the
appropriate actual recipient/login ceremony. Test identities must not be marked
verified manually to bypass it. Retain current Preview capabilities until reviewed
cutover; retire old test grants/workers and wait their measured 86,400-second token
lifetime plus clock tolerance before admitting general customers.

After this sender setup, the repaired runtime/Web/WWW were deployed in the
[October1–2 acceptance workflow](release-123-20261001.md). One operator-assisted
invitation handoff went to the Owner-confirmed QQ mailbox. Resend recorded delivered
and the dashboard exposes `250 OK: queued as.`, and Owner later confirmed arrival in spam or another classification.
Primary-inbox placement remains unproven; direct-link acceptance alone was not used
as mailbox evidence. No blind
resend, password change, verification-flag manipulation or automatic invite-mail
feature was added. Real reset/native/Apple purchase and final publication remain open.

## Evidence and continuation

- [Git-readable receipts](../collaboration/verification/resend-20261001/README.md)
- [CLI operating guide](../tools/resend/README.md)
- [GoDaddy guard](../tools/godaddy/README.md)
- [Current handoff](handoff.md), the single active next step
- [Native Auth0 Resend integration](https://auth0.com/docs/customize/email/smtp-email-providers/resend)
- [Official Resend CLI](https://resend.com/docs/cli)

The local originals are under `output/qa/rillora-resend-20261001/`. Credential
stores and protected DNS snapshots remain outside Git. Cache/help copies of vendor
documentation are reproducible third-party material, explicitly listed as excluded
in the evidence coverage receipt.

## October2 actual account completion follow-up

Owner confirmed finding the QQ email in spam or another classification. Real arrival
is now confirmed; primary-inbox placement is not. Owner also completed the native
Account terms. The Release simulator callback loaded the same one synthetic matter
created on Web and showed the synthetic recipient Connected. Actual native sign-in
and this cross-platform read are verified; password reset, detailed shared-field/
revocation boundaries and real Apple purchase/restore remain separate unfinished work.
[Current receipt](../collaboration/verification/release-123-20261002/real-account-progress-20261002.json).

October2's normal Auth0 QQ password-reset email is also accepted and provider-delivered.
The agent did not set or retrieve the password. Personal reset/relogin remains pending;
the supplied new-password field is a required human handoff. Earlier direct CLI TLS
failures produced no observed new message and were reconciled before one successful
request through the already configured local system proxy. No app/provider/TLS setting
was weakened to fix the local transport.
