# Infrastructure, Cost And Migration Roadmap

Role: staged hosting, domain, runtime, data, cost-control and migration contract  
Authority scope: zero-revenue public hosting, future production resources, cost triggers and provider migration  
Superseded by: later explicit Owner decision, stricter security／legal requirement or verified provider limit  
Do not use for: claiming production readiness, creating paid resources, storing real sensitive data or opening a market  
Status: PUBLIC LEGAL AND STAGING LIVE; PRODUCTION DATA FOUNDATION ACTIVE; SCOPED CLOUD RESTORE VERIFIED
Last updated: 2026-09-24 (production transport and current cost options)

## September24 runtime and pricing preparation

The optional closed production API/TLS implementation and live-template diff are
ready, with no database/key/journal replacement. It uses one regular ARM task,
private-address VPC Link HTTPS and public IPv4 only for outboundHTTPS, with
application ingress limited to the VPC Link security group. This implements the
later small-production BOM; it is not a claim that the task lives in a private
subnet. Certificate DNS validation and the original Auth0 administrator session
must be restored before cloud/provider acceptance. No deployment was started.
[Runtime contract](production-runtime-20260924.md).

Keep on-demand at current scale. Current RDS1-year no-upfront reservation would
save4.67USD/month on compute, with a whole-year commitment. The full live account
period reads26.55USD usage before credits; it is not a production monthly total.
No RI/Savings Plan or bundle was purchased. [Dated comparison](cloud-cost-options-20260924.md)
preserves current regional rates, flat-rate feature limits and budget boundaries.

## September23 production execution

Owner requested production/recovery work and a separate private source repository.
The first7-day RDS request was rejected by Free Plan. Owner explicitly requested
the Agent upgrade; direct API readback is nowPAID/ACTIVE and the production data
foundation is deployed with7-day retention. Schema0070/encryption/control journal
are initialized. Private GitHub/CI is verified. The scoped real cloud restore/replay and cleanup passed; production identity
and customer ingress remain separate unfinished gates. The data foundation is not a publicly available production application. Use the
[execution contract](production-recovery-20260923.md), [source guide](source-control.md)
and [handoff](handoff.md) for the current account-plan dependency and evidence.

## September21 actual capacity checkpoint

Current staging is0.25vCPU/512MiB regularFargate, pool5 anddb.t4g.micro/20GiB;
the24-hour API averages are1.64%CPU/12.17%memory andRDS4.43%CPU.100 synthetic
users and2,000matters exercised private HTTPS reads. The first300-request run
had298successes and2IP-limit429s; the per-IP limit is300/15minutes, distinct from
Gateway25rps/burst50. These figures do not establish100simultaneous-user capacity.
Auth0's actualFree quota is2/25,000MAU; template management ispaid-blocked and
no external email provider is configured. Avoid a headcount-based upgrade;
production isolation, email andbackup/restore remain separate required work.
[Current results and later bounded retest](annual-brand-capacity-20260921.md).


## September19 release preparation and real alert delivery

The public Operations schedule is enabled after the exact Owner-selected subscription, cloud probe, delivered ALARM/OK and actual missing-heartbeat/OK checks. A real missing SNS publisher permission was fixed with exact account/alarm constraints. The observed silent interval is75.4minutes, not a45-minute maximum guarantee. [Evidence](../output/qa/rillora-release-readiness-20260919/README.md). Production was uncreated at that checkpoint; the later sections above supersede that status. Preserve the small stage-based model; the old250–600/month HA baseline is not a universal early launch prerequisite. [Current release contract](release-readiness.md).

## September17 staging reliability checkpoint

A real Stripe sandbox refund coincided with AWS reclaiming the single Spot task. ECS reports SpotInterruption; Gateway returned four500 responses with No target endpoints found before the API could receive the events. Replays and deduplication succeeded. The existing0.25vCPU/0.5GB API has been moved to one regular Fargate task and actual provider/running/health/rollout state verified. This supersedes Spot as the interactive API baseline; it is not a highly available production design or a guarantee against every interruption.

The published Frankfurt ARM rates used at that checkpoint yield8.29USD/month for730hours of compute only, excluding database, public IPv4, egress, logs, tax and other services. No total-cost or margin claim follows. The independent public monitor was deployed with one cloud invocation passing7/7; its schedule was still disabled then. The September19 section above supersedes that monitoring status after actual alert delivery and activation. The initial failed deployment's empty retained resources and temporary cleanup permissions were removed. [September17 QA](../output/qa/rillora-stripe-acceptance-20260917/README.md), [dated cost inputs](../output/qa/rillora-stripe-acceptance-20260917/on-demand-cost-estimate.json), [AWS interruption behavior](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html).

## HISTORICAL — single-operator foundation, September11

Owner now selects68/year, no hiring, self-service and automation. The complete
feature/service scaling and exit contract is [solo operations](solo-operations-and-portability.md),
with [service inventory](../config/service-registry.json) and [job states](../config/automation-registry.json).
It extends the portable hosting/data principles here without pre-buying enterprise
tiers or splitting the API into microservices. Actual MAU/quotas, workload, restore
and cost trigger upgrades; payer count alone does not.

An independent `RilloraOperations` CDK stack and dependency-free public Node probe
are locally tested/synthesized. The stack has a15-minute schedule, bounded retries,
encrypted dead letters and failure/silence alarms, with no private data/repair
permissions. It is **not deployed** and no alert recipient is verified. The human AWS session was restored for the September11 app update; that does not activate the independent monitor. Mac fake-IP DNS is rejected; independent7-URL HTTP checks
pass the HTTP status/specified-header boundary only. [Runbook](../infra/aws/README.md).
Backup restoration, cost/quota checks, application outbox and CI security jobs
remain planned, not inferred from this public probe.

## Owner Objective — LOCKED

Before Rillora has real revenue, minimize new fixed infrastructure cost without weakening the evidence boundary or placing real sensitive planner data on an unsuitable free service. Prefer portable static artifacts, open protocols, explicit DNS records and reversible provider choices. Do not create a database, server, paid Website Builder plan, Route 53 hosted zone, NAT Gateway, new AWS production stack or third-party paid account merely to publish public legal text.

`$0 target` in this document means **zero new recurring infrastructure commitment for the current public-legal step**. It does not erase existing sunk or active costs such as the `rillora.xyz` registration, Zoho Mail subscription or the already deployed synthetic AWS staging stack. Credits, trials and free plans reduce cash outlay but never prove a permanent zero bill.

## Architecture Principles — LOCKED

1. **Static before servers.** Public information and legal documents have no runtime database, API, authentication, app-authored analytics or optional-cookie dependency. Managed hosting may still produce aggregate traffic counters and strictly necessary edge-security cookies, which must be measured and disclosed rather than called zero telemetry.
2. **Real sensitive data waits for a real production baseline.** If the Owner does not yet want the production cost, Rillora does not collect external users' private plans. Free infrastructure is not a reason to weaken isolation, backup, recovery or incident response.
3. **DNS is the migration switch.** GoDaddy remains registrar and authoritative DNS for now. Each live service uses an explicit A／AAAA／CNAME record and a bounded hostname. Do not use wildcard DNS as a shortcut.
4. **Host-only identity and sessions.** `login.rillora.xyz` remains the narrow Auth0 boundary. Browser cookies stay host-only and are never scoped to all of `.rillora.xyz`.
5. **Portable application contracts.** The API remains an OCI container; PostgreSQL remains the authoritative database; object storage is accessed through an adapter; infrastructure is defined as code; secrets never enter source or deployment archives.
6. **No in-place staging promotion.** Synthetic staging is evidence, not a cheap production environment. A future real-data production stack is separate and receives an explicit migration／cutover.
7. **Costs unlock by evidence.** New fixed spend begins only when a measurable stage trigger makes it proportionate, not because a provider dashboard offers an upgrade.

## Domain And Surface Map

| Host／path | Current or future responsibility | Current decision |
| --- | --- | --- |
| `rillora.xyz` | Brand home and public product explanation | Keep current GoDaddy Coming Soon page during the zero-cost legal step; later migrate to a portable public-site host |
| `legal.rillora.xyz` | Current independent legal publication host | Live on Sites with explicit GoDaddy CNAME, two validation TXT records and active managed TLS |
| `legal.rillora.xyz/terms` and six sibling paths | Terms, Privacy, Subscription, Refund, Acceptable Use, Cookie and Legal Notice | One static artifact and one host; never one subdomain per document |
| `app.rillora.xyz` | Future production Web app | Reserved; not created／published until production data and identity gates pass |
| `app.staging.rillora.xyz` | Existing synthetic-only Web／API evidence | Preserve; do not alias or reuse for formal publication or real users |
| `login.rillora.xyz` | Auth0 Universal Login | Existing narrow identity hostname; keep separate from public and application hosting |
| `docs.rillora.xyz` | Future help and provider guidance | Add only when content volume justifies a separate surface |
| `status.rillora.xyz` | Future public status page | Add before a paid／real-user launch with actual incident ownership |
| `/api` on the app host | Preferred Web API route | Keep same-origin for cookies／CSRF; create `api.rillora.xyz` only if a measured client or routing need outweighs extra CORS／cookie complexity |

GoDaddy treats subdomains as DNS records, not new registered domains. Standard DNS supports up to 500 total records, which is far above Rillora's foreseeable explicit-host set. Keep GoDaddy DNS to avoid a Route 53 hosted-zone charge during the no-revenue phase. A later DNS migration is optional, not architectural debt.

## Phase Plan And Spending Triggers

Latest Owner correction: do not price the first10–100 customers as a staffed,
multi-service mature company. [Current economics](unit-economics.md) uses public
Frankfurt on-demand ARM/RDS rates and a small-production reference ofUS$43.55/month
including explicit security/logging budgets.45/month is a working budget for a
bounded initial production, then75/120 at measured stages, not a deployment,
availability or security claim. Existing synthetic staging remains a separate
40/month estimate. Actual usage/invoices are unknown; no resources were changed.

The zero-payer row in that model is synthetic development. A real private-data
alpha needs the separate production baseline even if no one has paid yet; allow
roughly another45/month plus actual metered use before any first sale. Requirements
and recovered-data evidence take precedence over these budgets. Necessary work
uses the current blanket authorization; old confirmation wording below is not a
new request for permission.

### Phase 0 — Public facts, no external private plans

**Trigger:** now.  
**Target new fixed infrastructure cost:** `$0/month`.  
**Allowed data:** public product copy, public legal fields and purpose-limited test evidence only.

Resources:

- GoDaddy registration and existing authoritative DNS;
- current root Coming Soon page;
- Sites static legal artifact live at `legal.rillora.xyz`;
- existing Auth0／Zoho configuration, without public account promotion;
- local development and existing synthetic AWS staging only;
- no app-authored analytics, advertising, D1／R2, database, API, form submission, payment or optional storage on the legal host; Sites automatically exposes aggregate unique-visitor／page-view metrics and Cloudflare sets a strictly necessary host-only bot-protection cookie.

Exit criteria:

- all seven legal routes return 200 on a public HTTPS hostname;
- root redirects only within the legal host to `/terms`;
- `/account`, `/api`, unknown routes and writes return 404;
- CSP has `connect-src 'none'`, `form-action 'none'` and `frame-ancestors 'none'`;
- no consent banner is needed for the current necessary-only host behavior: the application writes no cookie or local storage, while the observed `__cf_bm` edge-security cookie is host-only, HttpOnly／Secure and covered by the request-protection disclosure;
- DNS, managed TLS and public URLs are read back independently;
- Google／Auth0 links are not updated before that readback.

### Phase 1 — Owner and synthetic product validation

**Trigger:** public legal host is stable, but there is no approved real-user private-data cohort.  
**Target incremental cost:** use existing credits／resources; no new production commitment.  
**Allowed data:** synthetic data and narrowly documented Owner-controlled early-use data only under the existing staging boundary.

Resources:

- local PostgreSQL and API for automated tests;
- existing Frankfurt synthetic staging only when a live integration check is needed;
- `serviceDesiredCount=0` is the source default; any future dormant-mode deployment must be separately read back because RDS and other fixed resources still incur cost;
- no new attachment bucket, KMS key, Apple AWS secrets, production database or public signup campaign.

Cost action:

- obtain a fresh AWS billing readback before changing the existing stack;
- distinguish credit coverage from actual service usage;
- if credits no longer cover staging and it is not being actively used, prepare a snapshot／restore／decommission proposal rather than silently carrying `$30–40/month` planning cost;
- deletion, snapshot replacement or loss of live evidence remains a separate destructive decision.

### Phase 2 — Purpose-limited real-user alpha

**Trigger:** a defined small cohort is ready to provide real private planning data, and the Owner accepts the minimum security／operations spend even if revenue is still zero.  
**Planning size:** approximately 5–25 invited users.  
**Cost gate:** same-day BOM, production isolation, identity and actual backup/restore evidence. Existing staging must not be promoted in place; a budget is not this evidence.

Minimum resources:

- separate AWS production account／stack or equivalently isolated production boundary;
- CloudFront＋private S3 for Web assets;
- same-origin API edge;
- an on-demand stateless API task for a bounded small alpha without an enterprise high-availability promise; add at least two across Availability Zones when the availability objective or measured load requires it;
- private encrypted PostgreSQL with at least7-day reviewed backup retention, actual restore acceptance and production RLS roles;
- Secrets Manager, regional KMS, bounded logs, alert delivery and incident ownership;
- Auth0 production configuration, recovery baseline and Release callbacks;
- no attachment upload until private S3／KMS and deletion lifecycle pass.

If the Owner does not approve this cost, the correct product decision is to keep the alpha synthetic／Owner-only, not to move private estate data to a free general-purpose database.

### Phase 3 — Paid beta and production baseline

**Trigger:** purchase/refund contracts pass, a ready market exists, self-service/AI support has an accountable exception owner and actual purchase consent is available.  
**Planning size:** a bounded first paid cohort with measured support and retention; test refunds do not imply a general refund guarantee.  
**Planning envelope:** begin from the verified public-rate small-production BOM and45/month hypothesis; allow75/120 as measured load/availability grows. The older250–600/month envelope is a heavier deployment sensitivity, not the automatic cost of10 payers. Legal/tax/security obligations are not postponed merely because the cohort is small.

Add or verify:

- Multi-AZ database or an explicitly reviewed equivalent recovery target;
- backup retention, point-in-time recovery and quarterly restore evidence;
- WAF／rate controls, vulnerability response and incident notification;
- private object storage, KMS, lifecycle and export／deletion operations;
- transaction, subscription, settlement, refund and support reconciliation;
- availability, latency, error, queue and database saturation alarms;
- a public status page only when there is an operational process behind it.

### Phase 4 — Scale or company transition

**Trigger:** stable full-price demand, material support／security exposure, B2B requirements, staff／cofounder／investment or another company-formation trigger.  
**Decision:** optimize only from measured load. Add queues, caching, read replicas, multi-region recovery or a second data plane only when evidence shows the need.

## Current Legal Static Artifact — IMPLEMENTED

The Web project now has a dedicated `build:legal` path. It reuses the exact approved `LegalDocumentPage.jsx` source and fail-closed six-field validator but has its own HTML／React entry and Sites worker.

The artifact deliberately contains:

- the seven formal English legal pages;
- Latin-only local font files;
- no Account page, product workspace, API client, authentication action, application cookie banner, application analytics or external connector;
- root `308` to `/terms`;
- explicit allowlist for seven legal routes;
- `404` for `/account`, `/api`, unknown routes and non-GET／HEAD methods;
- immutable caching for fingerprinted assets and five-minute revalidation for legal HTML;
- HSTS, CSP, no-referrer, no-sniff, frame denial and a restrictive Permissions Policy;
- `connect-src 'none'` and `form-action 'none'`, making outbound runtime requests and submissions fail closed even if future source accidentally introduces them.

Current build evidence:

- release-field validation passes without echoing values;
- Web and legal worker tests pass;
- full-product／Account／API strings are absent from the legal JS artifact;
- the JS artifact is approximately 245 KB uncompressed／77 KB gzip before normal HTTP compression;
- the final Latin-only build replaces the earlier all-subset font output;
- the original 2026-08-29 project is orphaned outside the current Owner account and remains non-deployable evidence only;
- the accessible 2026-09-03 project is verified in the Owner Sites list; version 3 embeds the HTML shell in the Worker and is the deployed public baseline at `legal.rillora.xyz`;
- full Web／publication tests pass `48 / 48`, all seven public paths return anonymous 200 and the root redirects 308 to Terms;
- `/account`, `/api`, unknown paths, the former internal HTML template path and write methods return 404;
- Sites records aggregate traffic metrics automatically; Cloudflare currently sets one `__cf_bm` cookie for bot protection. No Rillora application cookie or optional analytics code is present.

## Performance Budgets

### Public legal host

- initial compressed JS: `<= 100 KB`;
- initial compressed CSS: `<= 20 KB`;
- no blocking network call after static assets;
- immutable one-year asset cache;
- legal HTML cache no longer than five minutes before revalidation;
- no third-party font, script, image, analytics SDK or consent-manager request; hosting-edge traffic statistics and necessary bot protection remain provider behavior outside the application bundle;
- public route availability target is not stated externally until monitoring exists.

### Future application

- public／signed-out LCP target: `<= 2.5 s` at the 75th percentile on representative mobile conditions;
- authenticated API p95 target: `<= 500 ms` for ordinary CRUD before scale work;
- background work that can exceed an interactive timeout must become a durable job rather than extending request timeouts;
- add cache, queue, Redis or read replica only after traces／metrics identify a measured bottleneck.

## Security And Privacy Boundaries

- Public legal hosting processes ordinary HTTP request metadata at Sites／Cloudflare and exposes aggregate unique-visitor／page-view statistics. It receives no Rillora session, form data or planner content.
- `legal.rillora.xyz` must not receive cookies scoped from another Rillora host. Production cookies remain host-only.
- The legal build contains public operator fields by design; the ignored source configuration and temporary archives remain private and are removed after use.
- A static host must not receive Auth0 client secrets, API keys, private keys or database URLs.
- Optional analytics and advertising remain absent. The managed host's aggregate request analytics are not a Rillora behavioural SDK. If optional measurement is later proposed, it requires a new privacy／consent decision and must not silently enter the legal artifact.
- The observed Cloudflare `__cf_bm` cookie is independently generated per site for bot protection, uses the `legal.rillora.xyz` host boundary and expires after about 30 minutes of inactivity. It is necessary host infrastructure, not a Rillora account identifier or cross-site advertising cookie.
- Explicit DNS records reduce accidental subdomain takeover risk. Removed providers require immediate DNS cleanup and public readback.

## Portability And Migration Contracts

### Static host migration

1. Build `apps/web/dist` through the provider-neutral legal command.
2. Validate route allowlist, security headers and absence of API／Account code.
3. Upload the same immutable artifact to the new host.
4. Add the destination hostname before DNS cutover and validate its TLS certificate.
5. Reduce the explicit DNS record TTL before a planned migration; do not lower the entire zone unnecessarily.
6. Change only the `legal` CNAME／A record.
7. Read back all seven paths, headers and certificate from independent DNS／network resolvers.
8. Keep the old host available through the rollback window, then remove its access and DNS validation records.

No application database migration is involved in this path.

### DNS provider migration

GoDaddy can remain registrar even if authoritative DNS later moves. Export and inventory every current record, create and compare the destination zone, preserve MX／SPF／DKIM／DMARC and Auth0 records, then change nameservers only after exact dual-zone comparison. Route 53 is optional; its current published first-25-zone price is `$0.50/hosted-zone/month` plus applicable queries, so no-revenue Rillora does not add it without an operational reason.

### Application runtime migration

- build and publish the Express API as an OCI image;
- use environment configuration and documented health endpoints;
- keep provider adapters behind typed interfaces;
- never use an infrastructure URL as a durable customer identifier;
- cut traffic through DNS／edge aliases only after shadow health and database compatibility checks.

### PostgreSQL migration

- keep versioned checksum migrations and ordinary PostgreSQL types as the portability baseline;
- inventory extensions and prohibit undocumented provider-only SQL;
- rehearse `pg_dump`／restore or logical replication according to downtime target;
- compare row counts, constraints, RLS policies and migration checksums;
- place the old database read-only during final cutover and retain a bounded rollback snapshot;
- never copy real data into synthetic staging for rehearsal.

### Object storage migration

- store provider-neutral object keys and metadata, not permanent provider URLs;
- keep bucket access private and serve only through authorized application paths;
- verify object count, size, checksums, encryption state and lifecycle rules before DNS／application cutover;
- delete the old copy only after the retention and rollback window closes.

### Identity migration

- Rillora's durable mapping remains OIDC `issuer + subject`;
- maintain verified-domain control and explicit callback inventories;
- do not expand passkey RP ID to `.rillora.xyz` merely for convenience;
- provider or tenant migration requires an account-linking and recovery plan, not an email-address join.

## Cost Controls

- Keep GoDaddy DNS; do not create Route 53 solely for subdomains.
- Use one legal host with seven paths, not seven hosts.
- Use managed non-exportable ACM public certificates with CloudFront later; AWS lists them at no additional certificate cost for integrated services. The September24 containerTLS design has a specific need for one exportable hostname certificate, priced separately; no wildcard or privateCA is planned.
- S3 and pay-as-you-go CloudFront are usage-priced and therefore not guaranteed zero. The CloudFront `$0/month` flat-rate plan exists, but current AWS documentation says Free Tier accounts cannot use flat-rate plans; verify account eligibility before relying on it.
- Do not add NAT Gateway, Multi-AZ production database, WAF, extra secrets or log pipelines before their stage trigger. Conversely, once real sensitive data is accepted, do not omit them merely to hit a cost target.
- Tag every future resource by environment, owner, data class and cost center; create a delivered budget notification, not only a threshold object.
- Review monthly actual cost by service, credit consumption and forecast. The current AWS CLI session was unavailable on 2026-08-29, so no new live-cost claim is recorded here.

## Historical Legal-Host Execution Order — completed, not the current handoff

1. Finish and validate the legal-only artifact. **Complete.**
2. Confirm the old project is absent from the current Owner account, create one accessible replacement and immediately verify Owner／list visibility. **Complete.**
3. Push exact source, save version 3, deploy Owner-only, switch to public only after deployment success, and keep erroneous versions non-public. **Complete.**
4. Correct Sites clean-URL interference by embedding the HTML shell in the Worker and removing every client HTML object. **Complete.**
5. Add `legal.rillora.xyz`, write only the returned CNAME／verification TXT records through the GoDaddy v3 API, and preserve all unrelated DNS. **Complete.**
6. Verify GoDaddy API, authoritative／public DNS, Sites domain state, managed TLS, anonymous HTTP behavior, security headers and rendered page facts. **Complete.**
7. Save Google OAuth homepage／Privacy／Terms against the live custom URLs, reload Branding, and prove Audience remains External／Testing. **Complete.**
8. After a fresh client-secret creation-time mapping and separate action-time confirmation, deactivate and delete only the older unused Google client secret; preserve the later Auth0 credential and require an exact one-enabled-secret readback. **Complete.**
9. The legal-host work is complete. Resume only the latest task in [handoff.md](handoff.md); the native Account intermediary was removed September 6 and synthetic sharing staging was updated September 10. Do not restart either from this historical sequence. Owner-deferred physical-device/StoreKit work remains a separate evidence boundary.
10. Do not change root hosting, AWS staging, Google publication, Auth0, production identity, market rows or billing without their existing gates.

## Primary Pricing And Platform Anchors

- [GoDaddy: add a subdomain](https://www.godaddy.com/en-uk/help/add-a-subdomain-4080)
- [GoDaddy: subdomain and DNS-record limits](https://help-center.dc-aws.godaddy.com/help/what-is-a-subdomain-296)
- [AWS Route 53 pricing](https://aws.amazon.com/route53/pricing/)
- [AWS S3 pricing](https://aws.amazon.com/s3/pricing/)
- [AWS CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/)
- [AWS CloudFront flat-rate plan eligibility](https://docs.aws.amazon.com/PricingPlanManager/latest/UserGuide/plans.html)
- [AWS Certificate Manager pricing](https://aws.amazon.com/certificate-manager/pricing/)
- [AWS Certificate Manager wildcard and CloudFront-region behavior](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)

## Evidence Boundary

This roadmap is a current implementation and planning contract, not a cloud quote, uptime claim, security certification or product-production approval. The legal static site and custom domain are publicly deployed, but that proves only the seven public documents and their stated routing／header behavior. It does not open accounts, private planner data, a market or billing. Synthetic staging remains unsuitable for public real-user private plans. Use current provider readback and recorded budgets; necessary work within the Owner's scope follows AGENTS blanket authorization. Personal authentication and missing production/merchant evidence remain real gates, not renewed permission requests.
