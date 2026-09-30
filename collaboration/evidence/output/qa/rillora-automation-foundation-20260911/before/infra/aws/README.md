# Rillora AWS staging

This directory is the Infrastructure-as-Code source for the live synthetic-only staging environment
in AWS Frankfurt (`eu-central-1`). The deployed revision is evidence only for the exact resources and
checks recorded in `docs/handoff.md`; it is not approved for real sensitive planner or recipient data.

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
  deployed. Enabling it would create billable AWS Secrets Manager resources and requires a separate
  Owner money-impact confirmation.
- The one-off migration task applies checksum migrations with the administrator credential and
  then creates/rotates the non-inheriting runtime login. The API task receives only that runtime
  login and assumes the existing least-privilege database roles per transaction.
- The container verifies PostgreSQL with the pinned AWS RDS CA bundle and refuses production
  startup if verified TLS or real OIDC is absent.

This low-cost topology is intentionally bounded to synthetic staging. Before storing real sensitive
data, move the API tasks to private subnets with reviewed egress, complete the DPIA/security review,
and close the production gates in `docs/quality-gates.md`.

The zero-revenue public／legal hosting and future migration contract is
[`docs/infrastructure-roadmap.md`](../../docs/infrastructure-roadmap.md). Do not use this staging
stack for the current legal site merely because its CloudFront distribution already exists. The
legal-only artifact has no API／database／identity dependency and targets zero new fixed hosting
cost; formal publication must not overwrite synthetic staging assets or add an alias to this stack.

## Safe two-phase deployment

The default `serviceDesiredCount` is `0`. The first deployment creates the network, database,
secrets, image asset, migration task, and HTTPS edge without starting the API service. After the
migration task succeeds, deploy again with `-c serviceDesiredCount=1`. The synthetic API service
uses `FARGATE_SPOT`, so brief interruptions are expected and are not an availability claim.

Aurora Serverless v2 is intentionally deferred. AWS Free Plan accounts require Aurora Express
configuration, whose network and IAM-only authentication limits conflict with Rillora's private
database, checksum migration and separate runtime-login design. A paid-plan decision may revisit
Aurora later; staging does not weaken those controls to obtain an auto-pausing cluster.

No command in this file is authorization to create paid resources. Confirm the AWS account, current
Free Tier/credit eligibility, region, and monthly budget with the Owner before `cdk bootstrap` or
`cdk deploy`.

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

Run CDK with `--profile rillora-operator`, the MFA-backed human profile; CDK then assumes each
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
Family product identifiers. Synthesis is not deployment authorization; first creation of the three
Secrets Manager resources and any stack update remain a money-impact gate.

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
