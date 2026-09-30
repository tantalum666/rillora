# Rillora Resend CLI

Status: AUTHENTICATED PROFILE; VERIFIED DOMAIN; AUTH0 NATIVE PROVIDER ACTIVE
Last updated: 2026-10-01 (Asia/Shanghai)

Use official `resend-cli` 2.23.0, installed globally from its official npm package.
Owner has already run `resend login --profile rillora` with the existing `gpt` key.
Do not repeat login unless an actual authenticated command fails for credentials.
The plugin contributes the operating skill; its installation alone does not supply
CLI credentials. No custom SDK, mail service or extra wrapper is required here.

## Read-only checks

```sh
resend domains get e44b01df-6a2a-4dfb-bd74-a70ed851d2f3 --profile rillora --quiet
auth0 api get 'emails/provider?fields=name,enabled,default_from_address&include_fields=true' --tenant rillora-dev.eu.auth0.com --no-input
rillora-dns list
```

The Resend domain must remain `notify.rillora.xyz`, sending enabled, receiving
disabled and open/click tracking false. Domain GET currently omits TLS; use the
saved Configuration UI evidence or inspect that setting when an actual change
requires it. Auth0's default provider GET omits the From field; request the explicit
projection above. Never request or print the provider credential field.

The Auth0 CLI's typed provider-create enum does not yet list Resend, while the
current official Management API does. The already-installed native provider was
created through `auth0 api post emails/provider` using a structured stdin payload.
Do not create a duplicate provider or replace it with a custom SMTP workaround.

## Credential separation

- Operator profile `rillora` uses the Owner's existing `gpt` key for administration.
- Auth0 uses `Rillora Auth0 notify sender`, `sending_access`, limited to the verified
  domain. Its ID is recorded in the configuration receipt; IDs are not credentials.
- The sender token is stored in macOS Keychain service `xyz.rillora.resend`, account
  `auth0-notify`. Retrieve only into captured process memory when a necessary change
  requires it. Send secrets through stdin or a child-only environment; never output
  them, add them to shell arguments, put them in QA or commit them to Git.
- A new machine authenticates independently. Git restores evidence and instructions,
  not operator credentials. Do not export a keychain merely for Dot collaboration.

## Send boundary

The October1 direct sender and Auth0-generated verification tests already passed
with official `delivered+…@resend.dev` simulator recipients. Preserve their receipts;
do not resend as a routine health check. The verification link was not visited and
the exact temporary Auth0 identity is confirmed absent.

Current Free limits are100/day and3,000/month, with pay-as-you-go off. Separate
official bounced/complained/suppressed simulations also passed; inspect their saved
email IDs with `resend emails get <id> --profile rillora --quiet`, without resending.
Keep suppressed recipients blocked while investigating the underlying cause.
Actual recipient/login acceptance and external alarm delivery remain separate in the [current contract](../../docs/transaction-mail-resend-20261001.md).
Resend mail does not use the project's old SES-only readiness checker or inherit
its CloudWatch delivery/complaint alarms.

[Official CLI documentation](https://resend.com/docs/cli) ·
[Auth0 integration](https://auth0.com/docs/customize/email/smtp-email-providers/resend)
