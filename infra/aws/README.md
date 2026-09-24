# Rillora AWS infrastructure

This directory defines synthetic staging, independent production and public operations
in AWS Frankfurt (`eu-central-1`). The deployed revision is evidence only for the
exact resources and checks recorded in `docs/handoff.md`; staging is not approved
for external private plans and production customer traffic remains closed.

## September24 closed runtime deployed

`productionRuntimeEnabled=true` now exists in the production stack, with
`productionRuntimeDesiredCount=1`. Keep both flags on continuation; omitting the
runtime flag would propose removing these resources. The service remains closed
to account/private-data routes. Actual task1 isHEALTHY/COMPLETED, certificate
ISSUED/ELIGIBLE and Gateway live/ready return200; account routes return503/no-store.
The[runtime contract](../../docs/production-runtime-20260924.md) preserves exact
image/schema, TLS/group checks and the localTCP-probe limitation. No DB rebuild or
migration rerun was needed. AWS and original Auth0 admin/CLI access are restored.

The existing Operations stack now monitors10public targets, including production
live/ready/closed-access. Only its target environment JSON changed; schedule remains
ENABLED and the old metric dimension is retained. Cloud invocation returnsok/failed0;
prior subscriber/delivery/silence evidence is preserved rather than called a new drill.
The Owner-confirmed[GoDaddy CLI](../../tools/godaddy/README.md) is installed with
keyring OAuth and actual temporaryTXT read/write/cleanup proof. Use its Rillora-only
entry for future DNS work, with snapshots/previews and exact readback.


## September23 closed production and recovery

`productionFoundationOnly=true` selects the separate production data stack;
`productionPreflightOnly=true` selects its read-only account/cost reader. These
modes cannot be combined with staging/operations selection. The preflight reader
is deployed. The first7-day request was refused byFree Plan; Owner then asked the
Agent to upgrade, and direct API/readback isPAID/ACTIVE. The separate production
data stack is nowUPDATE_COMPLETE with private7-day RDS, KMS and control journal.
Schema0070 and task revisions2 are initialized; real synthetic RDS/KMS restore,
restriction replay and temporary-resource cleanup passed. No customer service exists.
The imported bootstrap credential/log group remain managed; do not recreate them. See [execution and drill commands](../../docs/production-recovery-20260923.md).

Current infrastructure source has28 passing tests. Source/CI is in a separate
private Rillora repository; it has no AWS deployment credential. Code rollback,
RDS restore and deletion/authorization replay require separate evidence.

## September23 content encryption

The staging API now uses one retained, annually rotatingKMS key and application
AES-256-GCM. Numbered migrations0064–0067 add protected storage and preserve
sharing/cutoff semantics. The final application mode isencrypted; temporary
migrationKMS permission must beoff afterbackfill. Use the[rollout/runbook](../../docs/security-hardening-20260921/implementation/operations.md) and
[currentQA](../../output/qa/rillora-content-encryption-20260922/README.md) for exact
task, zero-plaintext, backup and permission evidence. Never roll back to an
unaware reader or remove encryption to work around a KMS failure.

## September19 active public monitoring and release preparation

The Operations schedule is now ENABLED every15minutes after subscription confirmation, actual cloud checks and delivered ALARM/OK plus real missing-heartbeat/OK. An SNS policy defect was found by the drill and fixed: only this account's exact four CloudWatch alarms may publish. The initial confirmation email was moved out of Spam; the four alarm/recovery messages arrived in Inbox. Keep raw confirmation/unsubscribe links and the recipient address out of QA logs.

The heartbeat alarm uses three15-minute periods, but CloudWatch's missing-data lookback made the measured first silent alarm arrive after75.4minutes. Do not promise a45-minute maximum. This is the public/staging monitor, not whole production or private-account security coverage. [Current QA](../../output/qa/rillora-release-readiness-20260919/README.md). Preserve activation on subsequent deployments with `-c operationsOnly=true -c operationsEnabled=true`; the source default remains safely off for a new environment. Parallel CDK operations must use separate output directories or wait for the current CLI to finish.

The release project now offers only88.80annual for new purchases, retaining historical monthly receipts. [Release plan](../../docs/release-readiness.md), [current price](../../docs/pricing-88-80-20260919.md). Existing synthetic staging is never silently promoted to production.

## September17 email-continuation rollout — verified

Source adds one dedicated `EmailVerificationClientSecret`, scoped operator put/describe access and an `emailVerificationEnabled` flag defaulting false. It is separate from deletion and Web OIDC credentials. The disabled resource was provisioned, its protected Auth0 `read:users` credential installed, additive0060 applied/checksummed, and the feature activated. Keep existing FARGATE1, account deletion, Stripe test and maintenance-preview flags; Apple Sandbox, dev auth and production sales remain off. Infra19 and42 final HTTP/asset checks pass. Owner renewed AWS once; the same session completed both rollout phases and the later Web-only update. API30 is HEALTHY/FARGATE1 with completed rollout; migration23 exited0. Actual Auth0/cloud proof and exact fixture cleanup are recorded. [Current QA](../../output/qa/rillora-real-invitation-20260917/README.md).

## September17 current-price acceptance and regular-capacity baseline

Stripe TEST68/7.99 payments, portal cancel/resume, provider-ended Free1/saved copies, full test refund and duplicate-event handling are verified on API28. A real Spot interruption caused four Gateway500 deliveries before the app; the service is now FARGATE, desired/running1, HEALTHY, rollout COMPLETED. A stable force-deployment nonce migrates existing Spot tasks without unrelated subsequent rollouts. Operator Gateway diagnostics permission is read-only and scoped to that log group.

Current infra tests18 and post-change HTTP/asset checks41 pass. The public-monitor stack remains deployed but schedule off pending alert destination/delivery. Its two empty retained failure artifacts were verified, deleted and confirmed absent; the temporary cleanup policy stack is removed. Earlier paragraphs saying those resources remain or that operations was not deployed are historical checkpoints. [Current QA](../../output/qa/rillora-stripe-acceptance-20260917/README.md).

## September16 deployment result

The dedicated deletion secret is now installed and accountDeletionEnabled is active in the exact staging stack. API revision23 runs1/1; migration revision17 applied0047 after0043–0046. The update preserves Stripe test=true, Family maintenance preview=true, Apple Sandbox=false and development auth=false. Readback verifies migration hashes and restricted database permissions;36 HTTPS and authenticated functional checks pass. The source helper resolves the secret through actual CloudFormation resource membership, not an assumed generated name. [Deployment QA](../../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).

## HISTORICAL — September16 account deletion service preparation

The stack adds one independent AccountDeletionClientSecret resource and write-only operator replacement permission. `accountDeletionEnabled` defaults false; the API receives its Auth0 client/domain/secret only after explicit activation. `Auth0DeletionClientId` is a dedicated M2M client with only delete:users, not the existing Web client. Its protected local value is never a CDK parameter or browser artifact.

Provision/update with the feature disabled, populate the exact secret ARN from stack outputs using the scoped operator, run checksum migrations0043–0046, then enable the service. Preserve existing masked parameters and the closed billing settings. Coordinate the new Privacy/Cookie/source digest and hosted-consent action with API/client rollout; do not deploy an app build containing a legal-only artifact. The current local16 tests and synth pass; AWS personal login expired and no P1 stack update occurred.

## Topology

- API Gateway HTTP API provides the first AWS-managed HTTPS endpoint.
- A private S3 bucket holds the built Web assets. CloudFront serves the SPA at
  `https://app.staging.rillora.xyz` and proxies only `/api/*` to API Gateway so browser session
  Cookies and CSRF remain same-origin. This is the only custom alias accepted by the stack and its
  issued `us-east-1` ACM certificate ARN must be supplied explicitly at deployment.
- A VPC Link reaches an ECS Fargate task through Cloud Map service discovery.
- The task has a public IPv4 address only to reach Auth0 without a NAT Gateway; its security group
  accepts application traffic only from the VPC Link.
- PostgreSQL runs in isolated subnets, is encrypted, has deletion protection, and accepts traffic
  only from the API/migration task security group.
- A private Single-AZ `db.t4g.micro` RDS PostgreSQL instance uses encrypted 20 GB GP3 storage.
  It retains automated backups for one day, which is the
  current account-plan limit. This is not a production-grade recovery window; raise it only after
  an explicit paid-plan and production-readiness decision.
- Secrets Manager generates separate RDS administrator and runtime credentials. It also holds the
  Rillora Stripe test restricted API key and endpoint signing secret as two independent scalar
  secrets, so neither value has to be read back and merged. The staging operator may describe and
  replace only those exact Stripe secrets but cannot read them; the ECS execution role may read
  them only when `stripeTestIntegrationEnabled=true`. Synthetic-staging secrets are destroyed with
  a failed or explicitly removed stack so rollback does not leave unreferenced billable
  credentials; no real data is permitted in this environment.
- The optional `appleStoreKitSandboxEnabled=true` synthesis adds exactly three independent scalar
  secrets for the App Store In-App Purchase key ID, issuer ID and PKCS#8 private key. The staging
  operator may put／describe but cannot read those exact values; the ECS execution role receives
  them only in the enabled task definition. This path is locally synthesized and tested but is not
  deployed. Enabling it would create billable AWS Secrets Manager resources; follow current
  AGENTS authorization and actual configuration/readiness, not historical repeated confirmation.
- The one-off migration task applies checksum migrations with the administrator credential and
  then creates/rotates the non-inheriting runtime login. The API task receives only that runtime
  login and assumes the existing least-privilege database roles per transaction.
- The container verifies PostgreSQL with the pinned AWS RDS CA bundle and refuses production
  startup if verified TLS or real OIDC is absent.

This existing deployment remains synthetic staging. The separate production
design now follows the later small-production cost contract: public IPv4 only for
outbound HTTPS, no public application ingress, verified private-hopTLS and a
private database. This replaces the earlier mandatory-NAT/private-task-subnet
assumption without calling public-address tasks private. Actual network/TLS,
identity and release gates still require their own evidence before customer use.

The zero-revenue public／legal hosting and future migration contract is
[`docs/infrastructure-roadmap.md`](../../docs/infrastructure-roadmap.md). Do not use this staging
stack for the current legal site merely because its CloudFront distribution already exists. The
legal-only artifact has no API／database／identity dependency and targets zero new fixed hosting
cost; formal publication must not overwrite synthetic staging assets or add an alias to this stack.

## Safe two-phase deployment

The default `serviceDesiredCount` is `0`. The first deployment creates the network, database,
secrets, image asset, migration task, and HTTPS edge without starting the API service. After the
migration task succeeds, deploy again with `-c serviceDesiredCount=1`. The synthetic API service uses regular `FARGATE` capacity after theSeptember17
Spot interruption. Staging still does not establish a production availabilitySLA.

Aurora Serverless v2 is intentionally deferred. AWS Free Plan accounts require Aurora Express
configuration, whose network and IAM-only authentication limits conflict with Rillora's private
database, checksum migration and separate runtime-login design. A paid-plan decision may revisit
Aurora later; staging does not weaken those controls to obtain an auto-pausing cluster.

Read the current AWS account, credit eligibility, region, resource diff and budget before
`cdk bootstrap` or `cdk deploy`. Necessary project work follows the Owner's blanket authorization
in AGENTS. This runbook does not itself prove resources or grant a broader project scope.

The standalone Free Plan account must not enable an AWS Organizations-backed IAM Identity Center
instance. The account-level Identity Center instance cannot provide AWS account access, while
creating an Organization would invalidate the current Free Plan/credits. Human deployment instead
uses `bootstrap/standalone-account-identity.yml`: an IAM operator with no access key or direct
resource permissions may assume an MFA-gated one-hour bootstrap role. After `cdk bootstrap`, update
that stack with `BootstrapAdministratorEnabled=false`; subsequent CDK runs use only the generated
`cdk-hnb659fds-*` roles. The application stack creates a separate MFA-gated
`rillora-staging-operator` role whose policy can run only the migration task, inspect its tasks and
logs, replace only the staging Web OIDC secret, the two exact Stripe test secrets and—only when the
Apple path exists—the three exact Apple IAP secrets, and inspect
the staging database. It cannot read Stripe secret values, create arbitrary resources or
administer IAM. The IAM console password and MFA device are configured by the Owner and are
never placed in CloudFormation, shell history, Git, screenshots, or chat.

Local validation does not require an AWS account. CDK parameters belong to `deploy`/`diff`, not
`synth`; synth emits unresolved CloudFormation parameters:

```text
npm ci
npm run typecheck
npm test
npm run synth
```

Run CDK with `--profile rillora-cdk-session`, the credential-process bridge to the MFA-backed human login; CDK then assumes each
existing image-publishing, file-publishing and deployment role. Do not run CDK itself with the
already-assumed `rillora-cdk-deploy` profile: that deployment role cannot publish ECR/S3 assets or
assume the sibling publishing roles. The latter profile remains suitable for CloudFormation
readback; use `rillora-staging-operator` for the exact migration task and its logs. This routing
does not require any permission expansion. The confidential Auth0 Web secret is copied
to Secrets Manager through a non-logging FIFO flow; it must never appear in shell arguments, Git,
screenshots or chat. Use CloudFormation outputs to resolve the exact migration task, cluster,
subnets and security group rather than copying stale physical IDs from documentation. Always deploy
with the exact existing Auth0 issuer/client/audience, HTTPS callback and Web origin parameters.
For an existing stack, preserve masked `NoEcho` parameters with CDK's
`--previous-parameters true`; never submit the literal `****` readback as a value. Pass the
remaining public parameters from the current stack readback explicitly.
Custom-domain deployments must also pass `WebCertificateArn`; CloudFront certificates must be
issued in `us-east-1`, while the application stack remains in Frankfurt.

Commerce Phase 1C uses `-c stripeTestIntegrationEnabled=true` only after both dedicated secrets
have current values. The enabled task is hard-bound to the exact Rillora test Account／Product／Price
references and staging origin. Restricted-key permissions are `Checkout Sessions: Write`,
`Customer Portal: Write`, `Subscriptions: Read`, `Charges and Refunds: Read`, `Invoices: Read` and
`Payment Disputes: Read`;
the current Stripe `Core: Read` option is not used because it inherits broad Balance／Customer
reads. Customers, Payment Intents, Prices／Products and Payouts remain `None`. The Web static asset key must not change
during an API-only deployment unless Web publication is separately intended and reviewed.

The Apple Sandbox Server API path uses `-c appleStoreKitSandboxEnabled=true` only after the three
dedicated secrets contain the exact App Store Connect values. The enabled container is bound to
`/app/certificates/apple`, Sandbox mode, bundle `com.rillora.ios`, group `22325627` and the two
Family product identifiers. Synthesis is not deployed evidence; actual resource changes follow
the current authorized scope and exact credential/configuration readiness.

After a deploy, verify stack `UPDATE_COMPLETE`, ECS desired/running `1/1`, `/health/live`,
`/health/ready`, Web `/`, Web `/account`, `/api/auth/session-status`, unauthenticated `/api/v1/session`,
Auth0 redirect URI, CSP/HSTS, no-store and redacted proxy headers. Do not treat these synthetic
checks as production readiness.


## Family maintenance preview — 2026-09-10

The optional `familyMaintenancePreviewEnabled=true` context sets the API's explicit
preview flag without creating a paid subscription, new secret or new service.
Default is false; the production runtime restricts this flag to the exact existing
staging Web origin and Frankfurt plane. The September 10 two-phase update applied
migrations through 0039 with migration revision 14 exit 0, restored API revision
19 to 1/1, and passed 27 HTTPS/asset checks. Stripe test stays enabled, Apple
Sandbox and development auth stay disabled. Readback/evidence is in
[the Family QA](../../output/qa/rillora-family-maintenance-20260910/README.md).
Use the operator profile for CDK, the existing deployment profile for CFN resource
lookup, and the staging operator for exact ECS/log reads. Its deliberate lack of
ListServices/DescribeTaskDefinition does not call for permission expansion.

## Independent public operations stack — setup runbook and historical pre-activation evidence

The September11 no-hiring plan adds `RilloraOperations`, independently selected
with `operationsOnly=true`. It does not instantiate/update `RilloraStaging` or touch
database credentials, app tasks, DNS, provider prices or private users. It schedules
the same portable Node checker every15minutes with15-second timeout, shared account concurrency,
bounded delivery retries, encrypted retained dead letters,30-day retained logs,
four CloudWatch alarms and one SNS topic. Schedule defaults to **disabled**. There is deliberately **no assumed alert
subscriber**. Lambda emits only aggregate dimensions and public-check metadata.

From this directory, validate without credentials:

```sh
npm run typecheck
npm test
npm run synth -- -c operationsOnly=true
```

From the repository root, run the local-only public probe:

```sh
node --test tools/ops/health-check.test.mjs
node tools/ops/run-checks.mjs
```

`config/operations-targets.json` lists all approved public URLs. The CLI overwrites
only the redacted `output/ops/last-health.json`. It stores no cookies, tokens,
response bodies or private URLs. A local proxy that returns198.18/15 fake DNS makes
the guarded probe fail with `PRIVATE_ADDRESS_BLOCKED`; do not allow reserved IPs
or disable TLS to turn the indicator green. Check in the real cloud egress runtime.

After the human AWS session is available, read the standalone diff, then deploy
only this stack with the operator profile:

```sh
npx cdk diff RilloraOperations -c operationsOnly=true --profile rillora-operator
npx cdk deploy RilloraOperations -c operationsOnly=true --profile rillora-operator --require-approval never
```

Activation requires CloudFormation completion, actual Lambda invocation and TLS/
headers results, a verified Owner-controlled SNS subscriber, a delivered test alarm
and recovery, and a temporarily paused schedule proving the missing-heartbeat alarm
then restored schedule. Activate through a second reviewed deploy with `-c operationsEnabled=true` after the initial invocation/subscriber checks; use false for the silence drill and restore true afterwards. SNS/monitoring fees belong in the actual ops bill; local
synthesis is not a free-service or delivered-alert claim. Do not add an unverified
address or publish to third parties. Keep the schedule enabled only when this
operating evidence and incident destination exist.

Current result: local6 probe tests and15 infra tests pass; standalone synth passes.
AWS read-only STS returned expired session. No resources or subscription were
created; no cloud probe/alert drill ran. Independent curl verifies the expected
HTTP statuses and specified security headers for7 endpoints, while the Mac DNS-guarded probe remains blocked.
See [QA](../../output/qa/rillora-automation-foundation-20260911/README.md) and
[feature/service roadmap](../../docs/solo-operations-and-portability.md).

## September11 account/matter deployment

Staging update is complete: migration task15 exited0, API task20 is1/1 with rollout COMPLETED, CloudFormation UPDATE_COMPLETE, and30 HTTPS/asset checks pass. A separate read-only task confirms0040/0041/0042 cloud checksums exactly match source. Development auth stays off, Stripe test and existing maintenance preview on, Apple Sandbox and ordinary sales closed; the operations stack was not deployed. The human login completed despite a reported Chrome loopback error; check the CLI result and STS before requesting reauthentication. The native first-screen and category-details contracts are in [QA](../../output/qa/rillora-account-matter-ux-20260911/README.md).

## September17 public-monitor deployment evidence

The independent stack completed after removing a per-function concurrency reservation rejected by the account quota. A narrow OperationsRunbook policy on the existing operator permits only this public checker's invocation, logs, alarms and topic. Source tests17 pass; actual Lambda invocation returns200, no function error, seven checks pass, failed0. Schedule is configured disabled, with no assumed subscriber. Alarm/recovery delivery and silence drill are pending the Owner's alert destination. The initial failed stack was deleted; retained unused log/DLQ resource IDs remain in the QA recovery record. See [current QA](../../output/qa/rillora-launch-completion-20260916/README.md). This supersedes the earlier expired-session/not-deployed paragraph; it does not claim active continuous monitoring.
