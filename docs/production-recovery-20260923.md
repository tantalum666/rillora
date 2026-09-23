# Production foundation, recovery and source provenance

Role: current execution contract for the Owner's production/recovery request  
Status: IMPLEMENTATION IN PROGRESS; NO CUSTOMER TRAFFIC OR LIVE SALES  
Last updated: 2026-09-23 (Asia/Hong_Kong)

## Scope and current evidence

Owner requests starting production and recovery, asks aboutGitHub for rollback,
then explicitly requiresFanPass and every existing repository to be preserved.
Use a separate privateRillora repository. Do not delete, move or replaceFanPass,
the localWeb Git history or existing remotes. Source publication must follow the
prepared manifest and exact secret/privacy review; a repository is not a database
or key backup.

The existing staging remainsAPI37/0067 and is not promoted. Production starts
with a closed data foundation: separateVPC, isolatedPostgreSQL, independent
credentials/content key, recovery journal and bounded maintenance tasks. Public
Web/API identity, ingress/TLS and Release connections are later parts of the same
production gate; this foundation must not be marked as a public-ready service.

The renewed operator session is verified. A separately deployedMFA-gated role
can read the account plan/cost/database metadata and cannot upgrade the plan or
read application secrets. Fresh readback showsFree Plan ACTIVE,112.50USD credits
and2027-02-11 plan expiry; this is not an indefinitely free service. Only staging
currently exists as a database and has1-day backups. A prior statement treating
1day as a current maximum is not sufficient evidence; test the required7-day
configuration and report any actual provider refusal. Never downgrade retention
to make a production check pass.

## Foundation contract

- Frankfurt only, new10.43.0.0/16 network with no staging peering or copied users.
- Private encrypted PostgreSQL 16, Single-AZ db.t4g.micro/20GiB, with deletion protection.
  Credentials are retained. TLS/SCRAM and at least seven days of backups are required.
- One retained, annually rotating productionKMS key with namespace
  `rillora-production`, distinct fromstaging. Per-planner data keys remain wrapped.
- Separate migration and recovery security groups. Recovery probes cannot connect
  to the original database. Maintenance jobs have no incoming application listener;
  customerHTTP services are not created by this phase.
- The recovery journal is outside the database snapshot being restored. Its
  existence alone does not prove deletion or permission replay has been integrated.
- Only exact task definitions/roles and named recovery snapshots/instances are
  available to theMFA operator. Deletion rights apply only to tagged disposable
  recovery instances, never the production database.

The current price-list quote is13.87USD/month for730instance hours and2.74USD
for20GiBgp3. With illustrative1USD KMS/0.80USD two-secret charges, this closed
foundation is about18.41USD/month before requests,logs,journal/PITR,backup excess,
temporaryrestore runs and tax. Existingstaging and future publicAPI/edge costs
are additional. This is a planning subtotal, not an invoice or totallaunch cost.
The dated source and assumptions are in the[work evidence](../output/qa/rillora-production-recovery-20260923/).

## Restore acceptance

Use synthetic fixtures in the new closed production boundary. Preserve the source
while restoring to a new private target; never overwrite the live database or
restore private production data into syntheticstaging.

Acceptance must cover snapshot readiness, schema/migration hashes, encrypted
content decryption with the correctKMS context, counts/relationships, permissions,
post-snapshot deletion/revocation handling and oldsession rejection. Record actual
recovery point/time and clean up only the named disposable target. Keep the target
quarantined until replay and integrity checks finish. A snapshot existing, a local
JSON import or a manually seeded tombstone is not full application recovery proof.

Deletion/revocation information committed after the snapshot must survive outside
that snapshot or access must remain closed. The design must not blindly restore
old sessions, invitations or grants. It must also account for a legitimate
recipient whose planner is unavailable; globally revoking every contact is not
silently substituted for a complete recovery solution.

## GitHub and rollback contract

The source candidate includesWeb/iOS/API/infrastructure, versioned schema,
configuration templates, product/operations documentation and licensed assets.
Exclude credentials, live.env files, database dumps, personal tester accounts,
rawQA/browser logs and compiled/dependency caches. The first snapshot was reduced
from roughly5GiB with caches to43.2MiB of source/assets. Gitleaks8.30.1 found22
reviewed synthetic/public/validator matches; exact unchanged source-span hashes
are allowed, while new or changed findings block publication. This is a scoped
scan, not an absolute secret-free guarantee.

Keep existing nestedWeb Git metadata in place. A verified temporary-layout test
shows the parent repository can track the reviewedWeb files without moving or
deleting its child history. Root commits must explicitly use theRillora root.
Remote creation/push and resultingprivate visibility/commit/tree must be read back
separately before claimingGitHub setup complete. Neverforce-push another project.

Each release should bind sourcecommit, immutablecontainer digest, schema floor,
content format and deployment evidence. Code rollback deploys a compatible built
artifact. Database recovery restores an isolated copy and replays control state;
it is not `git revert`. In particular, encrypted data cannot be served by a
pre-encryptionAPI merely because its source can be checked out. KMS keys and
credentials stay in AWS, notGitHub. Cloud deployment fromCI needs its own exact
OIDC/role/branch/environment boundary; no blanketAWS administrator token goes into
repository secrets.

## Remaining boundaries

Production identity/mail, final customer ingress, real billing, merchant facts,
physical-device acceptance and public release stay under the existing release
gates. Full onlineE2EE remains deferred. Current execution status and the single
next action belong to[handoff](handoff.md), not this planning contract.
