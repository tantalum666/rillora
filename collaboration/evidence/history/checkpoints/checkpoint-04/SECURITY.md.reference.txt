# Digital Legacy Repository Threat Model

Last updated: 2026-09-23 (staging content-key boundary; earlier evidence keeps its dates)

## September23 application content encryption boundary

The existing staging API now encrypts protected Matter/contact/review/shared-copy
bodies withAES-256-GCM before persistence. Per-planner data keys are wrapped by a
retained, rotatingAWS KMS key. Metadata and owner-requested plaintext exports stay
explicitly separate. A database-only reader cannot independently unwrap these
contents, while the authorized application runtime can; this isnotE2EE.

The SQL resolver must authorize the exact reference via current owner, recipient
field projection or legitimate paid snapshot. Cross-owner/field references,
post-cutoff content and revoked access must remain denied. Ciphertext-like user
text is encrypted as literal content and is not recursively resolved. Tampering
or missing key service fails closed, without plaintext fallback or sensitive logs.
Runtime DB credentials must never holdcontent-service migration membership.
The temporary migrationKMS grant must be withdrawn after backfill. Changes to
reference parsing, key context, snapshot capture, encrypted retention or the
resolver aresecurity-sensitive and require relevant positive/negative tests.

The exact scope and measured evidence are in[implementation](docs/security-hardening-20260921/implementation/envelope.md),
[operations](docs/security-hardening-20260921/implementation/operations.md) and
[QA](output/qa/rillora-content-encryption-20260922/README.md). The prior manual
snapshot retains the old representation underRDS storage encryption. Production
isolation, internalTLS, restore/delete replay and independent assessment remain
open; this checkpoint isnot a new full-repository scan or certification.

## September16 deployed import/deletion verification

The synthetic-staging authenticated acceptance found a missing INSERT grant on official_setup_checks. Migration0047 permits only the imported columns plus sequence usage, retaining forced tenant RLS. Cross-owner inserts remain denied, the runtime cannot assume continuity_account_service, and setting arbitrary provider-check public IDs is not granted. Recorded provider dates are normalized and existing target settings preserved. API148 and cloud acceptance pass; all temporary identity mappings and pending jobs are cleared. This is focused deployment evidence, not a new whole-repository security audit. [Deployment QA](output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).

## P1 export, local draft and self-service deletion — September16

Minimum exports use a server-owned accepted sharing connection and safe-field projection, with the audience/version in the preview commitment. Never disclose and unselected existence are omitted. Personal encrypted copies are recovery-only; selecting a recipient limits eligible device keys to that same person. A full owner backup is separate and deliberately plaintext. Local file parsing is bounded and never treats its data as executable content or restored access grants.

Browser matter drafts are plaintext session storage, account-scoped and limited to24hours; the UI offers them only after same-account verification and clears them on save/discard/sign-out. No account/provider credential or export recovery key is put into this store. Receipt files contain only random deletion-status capabilities, not login authority.

Migrations0043–0046 add scoped exports, import/create deduplication and narrow SECURITY DEFINER deletion functions. The no-login account service role is not granted to the API runtime. A deletion request binds to the verified planner, closes both directions of access, then a leased worker removes only its stored allowlisted Auth0 mappings. Missing identity-service configuration leaves real accounts unchanged; transient failure does not become completed status. Retained consent/payment records are separated from the deleted active map and follow the documented retention/production-operations gates.

The exact new disposable Auth0 identity and local private map were removed and independently checked. No new full security scan, production deletion, Apple upstream revocation, backup erasure or live paid lifecycle is claimed. [Repair contract](docs/p1-reliability-repair-20260915.md), [QA](output/qa/rillora-p1-repair-20260915/README.md).

## Category details and initial-session payload — September11

Public wallet addresses can still reveal financial associations; typed detail fields and free Notes belong to the private planner record. Recipient SQL enumerates them only for an accepted Details grant, with current owner/person/matter and Never-disclose/revocation checks. Unknown JSON keys cannot broaden that projection; the negative DB-key test passes. Required field validation also applies to merged updates and approved maintenance changes. The minimum export and aggregate event metadata do not gain the new contents.

The native first-screen payload is created only after the existing identity/legal/session transaction succeeds. Its planner must match before the client uses it, and the opaque token is persisted first. Guest invitation lookup remains bounded metadata; registration returns to explicit acceptance with verified invited-email/account binding. No email-based account merge, extra provider secret or authentication bypass was introduced. The focused tests are recorded in the [QA report](output/qa/rillora-account-matter-ux-20260911/README.md); this is not a new full repository security audit.

## Automated operations boundary — 2026-09-11

No-hiring operations do not authorize an AI to grant roles, merge identities by
email, interpret inactivity as death, disclose private data or override recovery.
Self-service mutations retain authentication, fresh authorization, CSRF where
applicable, optimistic concurrency and auditable outcomes. Queued work rechecks
revocation/expiry at execution time. Prompts, logs and metrics default to no
private plan content, credentials, invitation token or recipient address.

The new public metadata checker accepts only explicit HTTPS origins, rejects
private/reserved DNS and redirects, validates TLS, bounds duration/concurrency
and does not read/store response bodies. Its separate cloud role can write logs
and failed-delivery messages only; no private app, secret or repair access.
Unit tests and CDK synthesis are local evidence. No cloud monitor deployment,
delivered incident alert, continuous security scanning or production protection
is established this turn. Source changes/backup restore/incident remediation
need their own bounded identities and evidence per
[the operating contract](docs/solo-operations-and-portability.md).

## Overview

This repository implements a global digital-legacy and estate-continuity product. Its purpose is to let a living planner record the existence, location, intended outcome and authorised people for important digital matters without becoming a password vault or claiming to replace legal authority.

The primary product surfaces are:

- the React Web planner and future recipient portal under `apps/web`;
- the native SwiftUI client under `apps/ios`, with a verified Auth0 EU development Code + PKCE and typed local Bearer-session path for planning, official-setting self-reports, non-operative rehearsals, minimum-disclosure plaintext sharing, client-encrypted Start Here Owner recovery and a memory-only synthetic recipient decrypt rehearsal; this is not Release identity, real recipient identity/delivery or production-encryption evidence;
- the iOS interaction prototype under `apps/ios-prototype`, which remains design evidence rather than production evidence;
- the shared HTTP API and PostgreSQL persistence layer under `apps/api`;
- product, safety, design and release contracts under `docs/`, `AGENTS.md` and `DESIGN.md`.

The most important assets are planner identity and sessions, the existence and location of matters, contact identity, outcome and role assignments, invitation state, simulation and export records, privacy-filtered product events, audit history, provider-policy provenance, database credentials and content/data-wrapping keys. The product deliberately excludes bank passwords, full recovery codes, private keys, seed phrases and any other single secret that directly enables asset transfer.

The principal security objectives are confidentiality between planners, integrity of intent and role data, authentic and revocable invitations, explicit separation of simulation from real disclosure, availability and portability over a long service lifetime, and an audit trail that does not itself leak sensitive content.

## Threat Model, Trust Boundaries, and Assumptions

### Actors

- `Planner`: owns a plan and its matter map.
- `Trusted Contact`: may receive an invitation or participate in a future verification process, but is not automatically an executor, beneficiary or owner.
- `Executor` or `Recipient`: may receive narrowly scoped information only after the applicable authority and release gates are satisfied.
- `Operator`: runs support, incident response and future manual claim review under least privilege.
- `Developer` and `deployment system`: control source, migrations, dependencies and runtime configuration.
- `External provider`: identity, email, object storage, KMS/HSM, analytics, legal or official-platform service used under a separate contract.
- `Attacker`: may be an unauthenticated internet user, an authenticated malicious planner, a compromised contact, an account-takeover actor, a malicious insider, a compromised dependency or a person submitting a false death/incapacity/missing claim.

### Trust boundaries

1. **Browser or iOS client to API**: every header, cookie, route parameter, query, body and uploaded artifact is attacker-controlled. Frontend validation is usability only.
2. **External identity to application session and tenant context**: OIDC authorization responses, issuer metadata and claims are untrusted until protocol verification succeeds. A verified provider `issuer + subject` maps to exactly one server-owned planner, after which only the application's opaque session establishes tenant context. Client-supplied planner or role identifiers never establish authority.
3. **Application to PostgreSQL**: parameterised queries, least-privilege roles, transactions and row-level security must preserve tenant isolation even when an application query is incomplete.
4. **Planner to invited person**: invitation tokens, delivery channels, acceptance and revocation cross from one identity to another and must not imply legal authority.
5. **Simulation to future claim/release operations**: simulations must be incapable of sending real notifications, changing provider settings or disclosing real data. Future death, incapacity and missing-person workflows remain separate state machines.
6. **Application to external services**: identity, email, storage, KMS, analytics and provider links receive only purpose-limited data. External responses and URLs are untrusted.
7. **Runtime to operators and observability**: logs, traces, metrics, backups and support tooling must exclude session values, contact details, matter contents and disclosure instructions unless a narrowly authorised operational purpose requires them.
8. **Source and migration supply chain to production**: dependencies, CI, database migrations and deployment configuration can change the security posture and require review, reproducible installs and separated credentials.
9. **Off-chain product to any future public proof system**: no personal data, identifiers, ciphertext, document digest, invitation, claim, wallet address or key is placed on a blockchain in the MVP. Any future integrity anchor is a separate reviewed subsystem.
10. **Public hosting to authenticated product**: Vercel may host only public content or synthetic-data previews. It must not host the production API, proxy authenticated planner responses, receive Rillora session cookies or become an unreviewed analytics path into the authenticated product. The authenticated Web/API/data plane is assigned to AWS Frankfurt, but that assignment alone does not prove regional compliance.

### Invariants

- A planner can read or mutate only rows belonging to that planner; this holds in both application queries and database policy.
- Authentication, role assignment, invitation state and legal authority are separate facts.
- A URL, account hint or record of existence cannot be treated as permission to log in, transfer, delete or inherit.
- No absence signal, failed login, subscription event, single contact statement or external link can trigger release.
- Real claim and release capabilities remain disabled until the gates in `docs/trust-safety-legal.md` and `docs/quality-gates.md` are met.
- Simulation records are visibly and technically non-operative.
- Dedicated high-risk-secret fields and known secret-shaped request keys are rejected by the API contract; product copy, review and later content controls must also discourage users from hiding secrets inside otherwise permitted free text.
- State changes are authenticated, authorised, schema-validated, rate-limited where abuse is plausible, and recorded with a non-sensitive audit event.
- Invitations and sessions are random, time-bounded, stored only as one-way token hashes, revocable and never exposed in URLs or logs beyond the unavoidable one-time delivery link.
- Export generation is explicit, scoped, short-lived and auditable; an export is not proof of legal validity or third-party acceptance.
- Client-encrypted Start Here finalization is bound to the full reviewed safe snapshot and exact eligible recipient-device key set. The server must never receive plaintext, an unwrapped data key or an offline recovery private key.
- Synthetic recipient rehearsal capabilities and sessions are random, short-lived, stored only as hashes, kept out of URLs and accepted only by the isolated rehearsal route/role. A synthetic key or package must never become eligible for the ordinary planner export or any future real release path.
- Disclosure-policy rehearsal rows are planner-owned, forced-RLS, event-prefixed and permanently non-operative. Database checks and every client require simulation-only responses with identity, document, multi-party satisfaction, notification and release flags false; role previews use exact field allowlists rather than broad Matter serialization.
- Planner-authored role records remain metadata, not authority. Recipients are matter-only; invitation-backed evidence cannot be rewritten; person/matter lifecycle changes revoke related roles and invitations; any policy change makes older disclosure snapshots stale.
- Product progress events are server-generated after successful mutations, use exact event/property allowlists, carry only coarse client provenance and remain insert-only to the application role. A 90-day expiry marker is not proof of automatic deletion.
- Deletion, correction, retention and data-region requirements remain implementable; core product data is not made immutable through blockchain storage.

### Assumptions and current limits

- The current Web API client and native SwiftUI planning/rehearsal client are local implementation evidence; the separate iOS prototype remains interaction/design evidence. Contact mutations prove only Rillora record semantics; official checks are planner self-reports; count simulations and role-policy state machines are non-operative snapshots. The latter now prove distinct death/incapacity/missing transitions and exact planner-visible role projections, but do not verify evidence, run a timer, notify a person or disclose data. Start Here creates a 15-minute no-file preview bound to the complete safe snapshot. After separate literal acknowledgements, clients can request a minimum-disclosure plaintext response or locally encrypt the same safe payload with AES-256-GCM and RFC 9180 HPKE key wrapping. The plaintext path retains no file copy. The encrypted path stores only bounded ciphertext, public material and wrapped keys; recovery and synthetic recipient private keys stay client-side. Saved, shared or printed copies cannot be revoked by Rillora. A production-forbidden local rehearsal proves one-time synthetic acceptance, public-key enrollment/revocation and recipient-side decrypt behavior, but binds no external identity and sends nothing. This proves local protocol, policy projection and client-encryption behavior, not real recipient identity/consent/delivery, production end-to-end encryption, provider configuration, legal authority, real recovery rights, complete native parity, legal validity or market validation.
- The native Debug client now uses Auth0.swift Code + PKCE by default. It persists only the Rillora opaque session in Keychain with `AfterFirstUnlockThisDeviceOnly`; the Auth0 provider access token is used once for server exchange and discarded. Release still has no reviewed production endpoint/domain configuration and fails closed. Web Passkey is verified only with an isolated virtual WebAuthn authenticator; native Apple Passkey and complete recovery remain unverified.
- The local backend may use a development-only identity adapter for fixtures. It is rejected in production and does not prove external identity assurance.
- Web and iOS have completed real development-tenant Auth0 EU exchanges with disposable synthetic identities. Browser Cookie sessions require CSRF, native Bearer sessions are credential-typed, and neither credential kind is accepted in the other's channel. Web also completed virtual Passkey enrollment/login and same-planner bulk Rillora-session revocation. Recovery email delivery/link use, Auth0 provider-session revocation, native Apple Passkey, encrypted attachment storage, KMS/HSM, demonstrated data residency and independent security review are not yet complete.
- AWS/Auth0/Vercel platform roles are selected and the Auth0 EU Free development tenant is live. Owner acquired `rillora.xyz`; `login.rillora.xyz` has public DNS, managed TLS and successful synthetic Web/native Debug OIDC evidence. A synthetic-only AWS Frankfurt staging plane now exists at `https://app.staging.rillora.xyz`: private encrypted Single-AZ RDS, generated Secrets Manager credentials, Fargate Spot behind API Gateway/VPC Link, and private S3 behind CloudFront with a same-origin `/api/*` path. DNS, managed EC TLS, live health/readiness, CORS, unauthenticated 401, Auth0 redirect, CSP/HSTS and redacted forwarded-header logs were checked. This is deployment evidence for that exact staging revision, not production security, real-data approval, redundancy, KMS/attachments, independent review or regional legal compliance. Release identity remains unverified.
- Registrar and DNS credentials are operational secrets, not application runtime configuration. The GoDaddy PAT is stored in macOS Keychain and must be rotated from its temporary broad scope to only domain read and DNS update after setup. GoDaddy's legacy domain-detail response can include the EPP transfer authorisation code; full responses must never be logged, persisted or printed. One code was accidentally emitted during this development workflow and its temporary file was removed. The domain remains registry-locked, privacy-enabled and ineligible for transfer until 2026-10-08, but the code must still be regenerated in the GoDaddy account or through official support before any future unlock or transfer eligibility.
- PostgreSQL is the authoritative mutable store. Backups, replicas and object storage must later follow the same retention and deletion policy.
- The MVP contains no real death claim or release endpoint.
- A compromised end-user device or mailbox can defeat some client-side protections; phishing-resistant authentication, recovery notifications and contact verification are required before production use.
- Denial of all public infrastructure, compromise of the operating system beneath trusted runtime controls, and malicious changes by multiple colluding production administrators are outside the first implementation boundary, but deployment design must reduce their likelihood and blast radius.

## Attack Surface, Mitigations, and Attacker Stories

### Authentication, sessions and recovery

An attacker may steal, fixate, replay or mint a session, substitute an authorization response, abuse recovery, or try credentials at scale. The Web login uses OIDC Authorization Code + PKCE with one-time state, nonce and transaction-cookie verification; external return paths are restricted to same-origin relative paths. Native exchange verifies Auth0 JWKS, fixed issuer/audience/RS256, expiry, `azp` and scope before issuing its own `native_bearer` session. The identity mapping retains provider `issuer + subject`; provider access and refresh tokens are not persisted. Browser sessions live in `HttpOnly`, `Secure` production cookies; native local sessions live in device-only Keychain; their server-side identifiers are hashed, idle and absolutely expire, and are bounded per planner. Credential-kind checks prevent a stolen Cookie from being replayed as Bearer to skip CSRF. Any authenticated local credential can revoke every active Rillora session for its server-derived planner; the endpoint never accepts a client-selected planner and explicitly does not claim Auth0-provider revocation. Virtual-WebAuthn evidence establishes a phishing-resistant Web option, but recovery still needs real delivery, backup factors, visible notifications, provider-session control and high-risk recovery protections. Trusted contacts never become recovery authorities by default. The API fails closed when production OIDC configuration is absent; a development identity header is acceptable only behind an explicit non-production guard.

### Tenant isolation and object access

An authenticated planner may replace a public object identifier, omit a filter or exploit a bulk endpoint to read another plan. Every query must bind the server-derived planner ID, public IDs must not be treated as secrets, foreign keys must preserve same-tenant ownership, and PostgreSQL row-level security must be enabled and forced for tenant tables. Cross-tenant tests are a release gate.

### Input, query and content handling

Attackers control JSON bodies, query parameters, labels, notes, institution names and future file metadata. Routes require strict schemas, conservative body limits, rejection of unknown fields and parameterised SQL. The frontend relies on React escaping and must not render raw HTML. Future provider or document URLs require scheme and host allowlists; arbitrary server-side fetching is prohibited unless separately threat-modelled for SSRF.

### Invitations and role confusion

A malicious planner or intercepted recipient capability may attempt to bind the wrong identity, reuse an expired token, enroll an attacker key or convert a trusted-contact invitation into executor authority. The local rehearsal exchanges a one-time hashed acceptance capability in a request body for a different hashed short-lived session; neither value enters a URL, Cookie, Web Storage, Keychain or logs. Its least-privilege database role is scoped by forced RLS to one rehearsal, and only public P-256 keys are accepted. Recursive secret-field rejection, unique active keys, exact key-set finalization and revocation limit further abuse. The flow deliberately has no real identity proof or delivery, so its acceptance is labelled synthetic and cannot establish legal authority or release eligibility. A production invitation must later add purpose-limited delivery, identity binding, explicit consent, audit, recovery and abuse handling under an independently reviewed contract.

### False claims and unsafe disclosure

A relative, attacker or insider may falsely report death, incapacity or absence, suppress the planner's response, or try to bypass a cooling-off period. The MVP exposes simulation only. Its three local rehearsal state machines, role allowlists, multi-party/cooling checkpoints, cancellation and appeal states test policy shape while database and client validators force every real-operation flag off; no evidence is accepted and no timer runs. Future real flows still require independently reviewed identity/document verification, multi-party review, planner cancellation, independent notifications, appeals, legally appropriate cooling-off and staged least-privilege release. No smart contract or unattended timer may decide death or disclosure.

### Exports and attachments

An export can concentrate otherwise separated sensitive data and may be cached, shared or downloaded on the wrong device. Both paths require a short-lived no-store preview, a SHA-256 commitment to the complete safe snapshot, literal path-specific acknowledgements, constant-time freshness comparison, field minimisation and audit. Any relevant change after preview forces a new review. The plaintext response is built in memory without a retained server file, but external copies are inherently non-revocable.

For the encrypted path, the Web Cryptography API or CryptoKit generates a fresh AES-256-GCM data key and nonce. RFC 9180 HPKE Base P-256/HKDF-SHA256/AES-256-GCM wraps that data key independently for a fresh offline Owner recovery public key and every eligible accepted recipient device. Package ID, preview ID and source commitment are authenticated associated data. Clients locally recover and decrypt before submitting. The server validates canonical encodings, bounded sizes, valid P-256 points, ciphertext digest, unchanged snapshot and the exact recipient-key set; database constraints enforce envelope shape and uniqueness. It stores no recovery or recipient private key, plaintext or unwrapped data key. A recovery key plus matching external package is sufficient to decrypt and cannot be remotely revoked.

The local synthetic recipient path uses a separate package foreign key, routes, credential scheme and RLS role. It exposes only the matching ciphertext and active recipient envelope, never the recovery envelope; device revocation stops later API retrieval but cannot erase an already decrypted or copied artifact. Production refuses to start while the rehearsal flag is enabled. There is still no real recipient identity binding, invitation delivery, durable device-key recovery, post-death release, production object storage or KMS path, so the product must not describe the rehearsal as delivered or production end-to-end encryption. Active uploaded content must not be served inline.

### Audit, logs and operator access

An attacker or insider may erase evidence, hide abusive actions or use logs as a secondary database. Application audit events are append-only to the runtime role and contain action metadata rather than sensitive content. Operational logs redact cookies, authorization data, request bodies and contact details. Operator access requires named roles, step-up authentication, reason capture and separate review before real claims exist.

### Database, migrations and availability

SQL injection, excessive privileges, missing indexes, long transactions or connection exhaustion could cause disclosure or outage. The backend uses parameterised queries, connection pooling, bounded pool size, short transactions, indexed foreign keys and tenant filters, least-privilege database roles, explicit migrations and readiness checks. Migrations and destructive retention jobs require backups, review and scoped credentials.

### Frontend and supply chain

Stored matter labels or API responses could become XSS if raw HTML sinks are introduced; a compromised package could access every visible record. The clients avoid `dangerouslySetInnerHTML`, persistent auth tokens and uncontrolled third-party scripts. Lockfiles, reproducible installs, dependency review, CSP/security headers and production source-map policy are required before deployment.

### Blockchain and integrity proofs

Putting plans, contacts, claims, ciphertext, hashes or identifiers on a public ledger would create permanent metadata, key-lifetime and deletion problems without solving the off-chain oracle question of whether a person died or who has authority. The MVP therefore stays off-chain and uses conventional database audit controls. A future proof-of-existence feature may only evaluate batched, non-linkable commitments after necessity analysis, DPIA, legal review, cryptographic review and a complete deletion/linkability assessment.

### Less relevant or currently out-of-scope stories

- Direct theft of a seed phrase from this product is out of scope because the schema forbids storing one; acceptance of such a field would make the story in scope and severe.
- Smart-contract reentrancy and wallet-signature phishing are out of scope while the product has no blockchain or wallet integration.
- Real release bypass is not reachable in the MVP because there is no release endpoint; accidentally adding an operative side effect to simulation would immediately make it critical.
- Malicious uploaded HTML is not yet reachable because attachments are not accepted; it becomes in scope when attachment upload or preview is added.

## Severity Calibration (Critical, High, Medium, Low)

### Critical

- Unauthenticated or cross-tenant bulk access to plans, contacts, outcomes or encrypted exports.
- An authentication/session flaw that permits arbitrary planner impersonation.
- SQL or command injection with access to the production database, KMS or release operations.
- Any path that converts a simulation, timer or single false claim into real sensitive disclosure or irreversible third-party action.
- Exposure of unwrapped data keys, bulk compromise of wrapping-key use, or a design that stores direct-transfer secrets for many users.

### High

- Account takeover or invitation-token abuse affecting one planner with meaningful private data exposure.
- IDOR that exposes or changes another planner's matter, recipient or outcome assignment.
- An export or backup access-control failure that discloses a complete plan.
- Persistent XSS on an authenticated product surface or a malicious operator path that bypasses required review.
- Irrecoverable loss or corruption of intent, role or audit data without a verified restoration path.

### Medium

- CSRF against a state-changing cookie-authenticated route where impact is reversible and no export/release occurs.
- Rate-limit, pagination or expensive-query weaknesses that cause bounded denial of service.
- Logging of masked account hints, internal IDs or low-sensitivity metadata without session tokens or full plan content.
- Failure to record a non-critical audit event, stale provider-policy metadata, or an overly broad but non-sensitive analytics event.

### Low

- Framework fingerprinting, minor security-header gaps on a local-only prototype or verbose validation details that reveal no secret.
- UI-only role confusion with no server-side authorisation impact.
- Dependency or configuration hygiene issues confined to development tooling with no credible production path.
- Availability or visual defects that do not expose, corrupt or falsely release user data.

Historical security-scan repository identifier (predates the native iOS work and does not attest current files): `local-workspace:sha256:9721d678e93b8a089e38c02020eb9e3f981df3aac14796d3b76533df41f23dde`  
Historical security-snapshot identifier: `codex-security-snapshot/v1:sha256:1954287164d07cb5c568a71cfbe96b9a8a2b3d383344fe6cab221091ddfee2c2`

## Directed sharing checkpoint — 2026-09-10

The Owner now explicitly authorizes implementation of planner-directed, read-only
sharing. Its identity-bound invitations are separate from synthetic rehearsal and
future event-conditioned release. The implementation requires current typed local
sessions/legal acceptance, verified-email target matching and explicit acceptance.
Owner/matter/person ownership, exact levels, revocation and version preconditions
are enforced server-side; recipients never receive unselected titles or counts.

The invitation fragment is stripped before HTTP work; digests and per-invitation
HttpOnly handoffs support authentication return without Web Storage or OAuth URL
capabilities. SHA-256 email digests remain personal data. The non-login SQL function
owner is not granted to runtime roles; only bounded projections are executable.
New grant/connection tables preserve same-owner foreign keys and forced RLS.
Changing to Never disclose or archiving removes grants, so reversing the setting
does not automatically restore access. Previously viewed/copied information cannot
be remotely erased.

Local negative tests cover wrong/unverified accounts, CSRF, replay/concurrency,
expiry, link replacement, B/C isolation, field over-disclosure, stale writes,
revocation and RLS. This is not an independent security audit or real recipient/
production release proof. Cloud rollout completed on 2026-09-10: migration exit 0,
CloudFormation UPDATE_COMPLETE, API 1/1 and 18 HTTPS/asset checks. This closes the
staging deployment checkpoint, not real-provider recipient acceptance or an
independent audit. See [sharing evidence](output/qa/rillora-trusted-sharing-20260909/README.md).


## Family review extension — 2026-09-10

The review service adds a bounded suggestion surface for already accepted,
Directions/Details-scoped recipients. One owner-selected contributor may suggest
provider/location corrections; owner approval updates the Matter with optimistic
versions and records its before/after. Recipient responses cannot change wishes,
credentials, scope or other users' data. The nologin projection service remains
unavailable as a runtime role membership. Per-round ordering prevents a late
suggestion after completion; current ownership/capability controls remain server
checks. Account removal detaches a contributor while preserving only the owner's
approved directions/history and cadence. Owner deletion still cascades.
Fourteen local integration scenarios plus client validation cover these boundaries;
this is not an independent security audit. [Contract and evidence](docs/family-maintenance.md).
