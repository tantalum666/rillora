# Cloudflare eligibility and regional-controls inquiry — prepared, not sent

Status: DRAFT / NO MESSAGE SENT / NO PLAN CHANGE AUTHORIZED
Last updated: 2026-11-03 (Asia/Hong_Kong)

Recipient: startups@cloudflare.com
Purpose: obtain an accurate eligibility answer and a quote/credit-coverage answer before treating the CF＋Neon candidate as a production budget.
Suggested reply address: hello@rillora.xyz, the existing monitored brand alias.

## Message draft

Subject: Rillora — individual-founder eligibility and regional/private-networking costs

Hello Cloudflare for Startups team,

I operate Rillora, a digital-legacy planning product at https://www.rillora.xyz. It is a self-funded individual project, started in 2026, with no incorporated company and no previous Cloudflare Startup Program award. Your Tier 3 page welcomes bootstrapped projects, while the general eligibility section mentions incorporation. Can an unincorporated individual project apply, and how should that status be entered accurately?

We have completed a small, synthetic-only Workers Free and Hyperdrive/Neon runtime validation. Before planning a production move, we need to preserve our current protected database, independent encryption-key and recovery controls, and the regional boundary of our authenticated application processing. We are evaluating a Frankfurt PostgreSQL database reached through private connectivity; we are not asking to expose the database publicly.

Please clarify which supported Cloudflare configuration can constrain authenticated HTTP processing and related metadata to the required European region, and how scheduled/queue work differs. Placement Hints appear to be performance hints, so we have not counted them as a residency guarantee. Please provide the recurring price or pricing basis for the necessary Regional Services/Data Localization features, whether Tier 3 can cover them, and the charges after the one-year credits end. Please also confirm current Workers VPC eligibility and whether post-beta pricing is available.

We would appreciate eligibility confirmation and an itemized quote before any plan change. Our existing account is on Workers Free. The product-domain contact is hello@rillora.xyz; we can provide account details through your authenticated support channel if needed.

Thank you,
Rillora

## Boundaries

The draft contains no passwords, keys, user records, private network addresses or payment details. It does not assert incorporation, funding, successful grants or a purchase commitment. Sending to a third party requires an explicit send instruction under the current conversation's tool rules. The application form is only partially prepared; account linking, a payment method and any new agreement are separate platform steps, not automatically accepted by this draft.

## Neon private-network configuration question — prepared, not sent

Destination: [Neon's official contact form](https://neon.com/contact-sales), which explicitly accepts technical, pricing and migration questions. No current support email address was verified, so do not guess one. This is a technical boundary question, not a plan purchase or a vulnerability allegation. The form separately requires contact-name fields and acceptance of its linked Terms of Use; those steps have not been completed.

Subject: PrivateLink configuration for a single Frankfurt project

Hello Neon team,

We are evaluating Neon for Rillora, https://www.rillora.xyz, using synthetic data only. Our current production database is private, and we intend to preserve that boundary and seven-day point-in-time recovery.

The current Private Networking guide lists eight eu-central-1 endpoint services and says to add all services for a region, while later expansions are described as optional. For one PostgreSQL project, is it supported to connect only the endpoint service associated with that project's proxy, or are all eight required? Please clarify the effects on compute resume, failover, maintenance and future proxy changes, and whether the project can keep all public connections blocked throughout.

We are considering Cloudflare Hyperdrive through a narrowly scoped Workers VPC service and a connector in the same AWS region. Please identify any supported lower-complexity private path or security constraint we should account for. We will calculate AWS endpoint charges separately and would like to avoid treating an unsupported subset as a cost-saving design.

Please point us to the appropriate technical team if another contact is better suited. Our product contact is hello@rillora.xyz. We are requesting configuration guidance before any plan change or migration.

Thank you,
Rillora
