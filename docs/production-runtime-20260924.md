# Closed production runtime and TLS

Role: production transport implementation and acceptance contract

Status: CLOSED PRODUCTION HTTPS DEPLOYED; RUNTIME AND MONITOR ACCEPTANCE VERIFIED

Last updated: 2026-09-24 (Asia/Hong_Kong)

## Current scope

Owner asks to continue the next release step and compare usage pricing with
packages. Preserve the verified production data foundation and recovery result.
This increment adds an optional API runtime without opening customer accounts,
ordinary purchases, invitations or private data. Auth0 production clients/email,
Web/iOS Release connections and ordinary commerce remain separate acceptance.

September24 result: the Owner restored the original Auth0 email/password/MFA
administrator identity; dashboard and CLI both return the existing EU
`rillora-dev` and its original applications. The previous Google sign-in selected
a different Dashboard identity despite the same email. No new tenant was created.
AWS CLI was renewed and STS verified; GoDaddy domain access was restored.

Owner confirmed the exact ACM verification CNAME at action time. It is saved and
matches both authoritative servers and two public resolvers. Certificate
`8435fada-00ca-4c0e-880b-ff26e0fb6191` isISSUED, export-enabled andELIGIBLE for
renewal after the running task exported it. Its current expiry isApril10,2027.
The two-phase desired0→1 update iscomplete; one regular Fargate task isHEALTHY
with rolloutCOMPLETED. API task revision1 uses immutable image
`sha256:8426279e5de8cd394c9ebae8c35549d0a01703a84a3398dda5cb82c476cfad6b`,
matching the prepared local artifact/code4215c25. Schema0070 and the private,
encrypted, protected seven-day database are preserved; no SQL rerun was needed.

The actual API Gateway live/ready routes return200 and six representative account,
private-data/invitation/provider routes return503/no-store without session cookies.
AWS readback confirms VPC_LINK with the exact TLS server name and only port8443
from its own VPC Link group, no public IPv4/IPv6 CIDRs. Direct public-IP TLS to the
correct hostname times out. A bare local TCP probe reported connections on three
ports despite no TLS response; preserve that inconclusive result and do not claim
raw TCP timeout or a diagnosed proxy cause. This is bounded transport/application
acceptance, not an exhaustive network penetration test or customer release.

Operations now contains10public checks, including production live/ready and the
closed-account gate. Its update iscomplete; real cloud invocation returnsok/failed0.
The existing15-minute schedule, subscriber, alarm resources and legacy metric
Environment value stay unchanged, retaining the previous delivery/heartbeat proof.
The legacy label `synthetic-staging` is a metric-continuity identifier; target IDs
explicitly distinguish the new production checks. No private data enters monitoring.

Owner also requested the official GoDaddy CLI. `gddy`0.2.20 is installed,
keyring-authenticated andrefreshable after exact scope/terms confirmation.
The Rillora-only project entry and real TXT create/read/cleanup check are described
in[the CLI runbook](../tools/godaddy/README.md). No FanPass DNS or repository changed.
Production Auth0 clients/email, ordinary commerce and final Web/iOS connections
remain separate work; the external Auth0 email provider is currentlynot configured.
[Auth0 identity explanation](https://support.auth0.com/center/s/article/Change-login-provider-login-method-for-Dashboard-users-tenant-members).

## Transport and cost choice

- One regular ARM64 Fargate task, 0.25vCPU/512MiB, planned pool5. No Spot API.
- Private PostgreSQL retains seven-day backups, encryption, deletion protection,
  runtime login, content KMS context and independent recovery journal.
- API Gateway reaches the task's private address through a VPC Link and Cloud Map
  with `TlsConfig.ServerNameToVerify=origin.production.rillora.xyz`.
- The task's only application ingress is TCP8443 from that exact VPC Link group.
  It has public IPv4 for outbound HTTPS, not a public inbound application route.
  PostgreSQL ingress is only the runtime group and existing migration group;
  the separate recovery network still cannot connect to it.
- This follows the later small-production BOM in [unit economics](unit-economics.md)
  and supersedes the older blanket private-subnet/NAT assumption in the staging
  runbook. A public task address with denied public ingress is not a private
  subnet and must not be described as one. Do not weaken this group boundary or
  treat code assertions as the required real network test.
- Do not add NAT, a load balancer or a private CA solely to encrypt this hop.
  AWS supports HTTPS for this Cloud Map integration. A single exportable ACM
  public certificate costs US$7 per issuance/renewal at this check; no wildcard
  or CA monthly subscription is needed. The separate cost comparison is
  [here](cloud-cost-options-20260924.md).

Sources: [API Gateway private HTTPS](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-private.html),
[ACM price](https://aws.amazon.com/certificate-manager/pricing/),
[renewal eligibility](https://docs.aws.amazon.com/acm/latest/userguide/managed-renewal.html).

## Certificate lifecycle

ACM owns issuance and DNS-based renewal. The DNS validation CNAME must persist.
The source uses one exact Frankfurt certificate ARN and one exact hostname.
The runtime role can describe/export only this certificate. A random ephemeral
passphrase protects the export; key material stays in process memory, not Git,
container layers, a local file, environment variables or a log.

Startup requires an issued Amazon certificate, matching hostname/private key and
more than24hours remaining. There is no HTTP fallback. The runtime checks its
serial every15minutes and exports/reloads only a changed certificate. Existing
valid TLS survives a transient refresh error; readiness becomes false before
expiry. After every successful issuance/renewal, export is required for ACM's
next automatic renewal eligibility. A dormant desired-count0 deployment must
not be assumed to maintain an exported certificate forever.

The container probe verifies the normal public trust chain and exact server name
over HTTPS to loopback. It does not set `rejectUnauthorized=false`. The production
service is read-only at the container filesystem, drops Linux capabilities and
uses only the runtime database credential; it does not receive the administrator
credential. Task roles have production-context KMS and exact-table journal access.

## Closed boundary and logs

`PRODUCTION_RUNTIME_MODE=closed` requires encrypted content, production key
namespace/journal, verified regional TLS and disabled testing/billing flags.
Only `/health/live` and `/health/ready` are mounted. Every other route returns503
with no-store, without issuing cookies, creating consent or querying private data.
There is deliberately no accepted `open` mode in this increment. Existing staging
keeps its original OIDC requirement and is not deployed by this work.

An additional release finding was fixed: request-header redaction did not cover
OAuth codes in query strings, invitation IDs in paths or raw database error text.
Runtime logs now retain generated request ID, method, status and timing only;
request/response metadata and unexpected error contents are omitted. Gateway
logs likewise omit paths, queries, addresses, headers and bodies. Historical logs
are not claimed erased, and this change is not yet running in staging/production.

## Validation and deployment order

Local API212 tests pass, including a real local TLS handshake, wrong-name/key/
expiry rejection, two certificates signed by a local test CA, actual peer-serial
change on renewal, closed-route rejection and captured-log privacy checks.
Infrastructure29 tests and type checks pass. The first TLS test fixture used two
same-subject self-signed leaves, which produced an ambiguous trust selection;
it was corrected to a common test CA rather than disabling verification.

The reviewed live-template diff was applied. It added runtime resources and new
maintenance image definitions without deleting/replacing the database, VPC, KMS
key, recovery table or secret resources. The independent monitor changed only
its public target configuration.

The following two-phase procedure is now completed; retain it as the runbook,
not a request to repeat setup:

1. Deploy only `RilloraProduction` with `productionFoundationOnly=true`,
   `productionRuntimeEnabled=true`, `productionRuntimeDesiredCount=0`, profile
   `rillora-cdk-session`, and a dedicated CDK output directory.
2. Read the exact ACM validation record from the certificate/stack event. Add only
   that CNAME at GoDaddy; preserve root, MX, SPF/DKIM/DMARC, login and staging.
3. Require certificate ISSUED and stack completion. Recheck actual ARN, groups,
   TLS integration and database identity/retention.
4. Deploy desired-count1. Verify image digest, healthy task and the real Gateway
   live/ready endpoints. Verify closed auth/private/webhook routes and absence of
   issued sessions; probe rejection through the task's public address.
5. Add the actual health target to the already delivered Operations monitor,
   then continue the distinct production identity/email configuration as the next gate. Do not
   claim customer login, email delivery or release connections before acceptance.

The runtime adds no SQL migration; schema0070 is retained. Do not repeat the
completed snapshot/restore ceremony merely because a new image was built. Source
and local container evidence cannot stand in for cloud TLS/network evidence.
See [QA](../output/qa/rillora-production-runtime-20260924/README.md) and the
[current handoff](handoff.md) for the single resume step.
