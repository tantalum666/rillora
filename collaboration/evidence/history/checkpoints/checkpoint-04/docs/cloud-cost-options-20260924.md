# AWS usage pricing and commitment options

Role: dated service-cost comparison for Rillora's launch architecture

Status: RESEARCHED; KEEP ON-DEMAND; NO COMMITMENTS PURCHASED

Last updated: 2026-09-24 (Asia/Hong_Kong)

## Recommendation

Keep RDS/Fargate on demand while production architecture and baseline use settle.
Review a one-year, no-upfront RDS reservation after30–60days of stable production
use and a credible12-month requirement. Buy only the enduring baseline, not
temporary recovery or a test environment likely to be stopped. This is an Agent
recommendation; no RI/Savings Plan, support subscription or hosting bundle was
purchased in this work.

AWS Paid Plan is already PAID/ACTIVE, not a monthly package or spending cap.
Readback still shows111.95USD eligible credit at this check. Cost Explorer for
September1 inclusive to24 exclusive records26.5502794732USD usage and approximately
matching credits across the whole account. This is estimated/lagging and includes
staging, not a complete production month or final invoice.

“Usage” includes running-instance hours. A quiet database running24hours is still
billed for those hours; it is not charged only when a customer opens the app.
Storage, backup, keys, logs and other retained resources have their own meters.

## The actual small database

Frankfurt PostgreSQL db.t4g.micro, Single-AZ;730hours/month. Rates were fetched from
the official regional catalog, publication2026-09-22. The table is compute only.

| Option | Commitment/payment | Monthly equivalent | Saving versus on demand |
| --- | --- | ---: | ---: |
| On demand | Stop/change when needed; no term | US$13.87 | — |
| One-year RI, no upfront | Whole-year commitment, monthly charges | US$9.20 | US$4.67/month |
| One-year RI, all upfront | US$104 paid upfront | US$8.67 | US$5.20/month |
| Three-year RI, all upfront | US$215 paid upfront | US$5.97 | US$7.90/month |

The one-year all-upfront option saves only aboutUS$6.38 more per year than the
one-year no-upfront option. Storage20GiBgp3 remains aboutUS$2.74/month; keys,
secrets, extra backups, traffic, CPU credits and tax are not discounted by this
instance comparison. A reservation is a billing discount, not a larger server or
a separate capacity/resilience upgrade. Eligible credit treatment is not assumed
to make upfront commitment free.

[Official regional price catalog](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/eu-central-1/index.json),
[RDS reservation rules](https://aws.amazon.com/rds/reserved-instances/).

## Other package types

- **Compute Savings Plans:** cover eligible EC2/Fargate/Lambda usage with an hourly
  spending commitment. Current regular ARM Fargate0.25vCPU/0.5GB is onlyUS$8.291
  per730hours before IPv4 and other costs. Do not apply an advertised maximum
  discount to the whole bill. No exact Fargate commitment quote is claimed here.
- **Database Savings Plans:** now exist, but the official FAQ limits provisioned
  instance coverage to generation7and newer. Our db.t4g.micro is outside that
  stated generation scope, so do not assume the advertised “up to35%” applies.
  Its on-demand DynamoDB control journal may be eligible, but current tiny traffic
  is not a reason to commit to a spending floor.
- **CloudFront flat-rate plans:** FreeUS$0 and ProUS$15/month can be useful for
  compatible sites; they cover the CDN package, not RDS/Fargate. They do not need
  an annual commitment. Lower tiers restrict custom cache/origin/header policies,
  so validate authenticated no-cache, cookie/CSRF forwarding and CSP before
  selecting one. Do not buy BusinessUS$200 merely to preserve a custom policy
  that pay-as-you-go handles for a small workload. A pricing plan is not an
  account-wide backend bill cap.
- **Lightsail:** its low advertised VM price is not our whole architecture. The
  official multi-tier example isUS$7 container＋US$15 database＋US$18 load balancer
  =US$40/month, and that database example explicitly lacks data encryption.
  A self-managed VM/database also moves patching, isolation and recovery work onto
  the operator. Do not discard verified production controls to compare only a
  headlineUS$5 server against a complete managed system.

[Savings Plans FAQ](https://aws.amazon.com/savingsplans/faqs/),
[Database pricing](https://aws.amazon.com/savingsplans/database-pricing/),
[CloudFront plan capabilities](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html),
[CloudFront prices](https://aws.amazon.com/cloudfront/pricing/),
[Lightsail example](https://aws.amazon.com/lightsail/pricing/).

## Production budget boundary

The proposed core includes13.87database compute＋2.74storage＋8.291Fargate＋3.65one
IPv4＋1KMS key＋0.80two existing secrets＋0.50Cloud Map private zone＋2certificate
reserve =aboutUS$32.85/month. The certificate reserve is a budgeting allowance,
not an ACM monthly fee: actual issuance/renewal isUS$7per standard hostname.

Allow roughlyUS$40–50/month for the bounded initial production architecture after
small logs/monitoring/journal/identity-secret and request budgets. This remains a
planning envelope, not a delivered complete runtime, quoted email/Auth0 plan,
capacity certification or total company expense. Existingstaging, exceptional
traffic, extra backup/restore runs, taxes, merchant/payment costs, human exception
handling and final identity-service plan changes are separate.

Higher-impact early savings are avoiding unused infrastructure and unnecessary
paid service tiers, then reviewing staging's lifetime after production acceptance.
No staging was stopped/deleted here. Headcount alone does not select server size
or a paid Auth0 tier; current plan/features and measured load must be checked.

Preserve the current annual-only88.80Family offer. This cost comparison is not a
new gross-margin or profit claim and does not rewrite the historical financial
workbooks. Source rates, exact arithmetic, account readback and exclusions are in
[QA](../output/qa/rillora-production-runtime-20260924/cost-comparison.json).
