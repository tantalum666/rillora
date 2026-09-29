# Production foundation, recovery and source provenance

Role: current execution contract for the Owner's production/recovery request  
Status: PRIVATE SOURCE/CI, PRODUCTION DATA AND SCOPED CLOUD RESTORE VERIFIED
Last updated: 2026-09-30 (Asia/Hong_Kong)

## September30 current recovery operations

Bounded retention, independent hold reasons and the exact90day manual-snapshot
retirement worker are deployed; no manual snapshot has yet been deleted. Recovery
adds a guarded reconcile-commerce command for an isolated TLS clone with a freshly
frozen source and complete journal coverage. The source is never stopped implicitly.
Current provider reads preserve ownership and revocation/refund truth; unproven
markers cannot reopen traffic. Prior real RDS/KMS restore remains datedSeptember23;
new commerce cases are local controlled tests pending actual transaction evidence.
[Current operational contract](release-engineering-20260930.md).


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
read application secrets. The pre-upgrade readback showedFree Plan ACTIVE,112.50USD credits
and2027-02-11 plan expiry; this is not an indefinitely free service. Before the upgrade, only staging existed as a database and had1-day backups. A prior statement treating
1day as a current maximum is not sufficient evidence; test the required7-day
configuration and report any actual provider refusal. Never downgrade retention
to make a production check pass.

September23 execution first confirmed that RDS refused the required7-day retention
under the Free Plan. Owner then explicitly instructed the Agent to perform the
upgrade. The existing operator credential successfully called the official
UpgradeAccountPlan API; no extra IAM grant, Organizations or Control Tower was
created. Independent readback is PAID/ACTIVE, with111.95USD credit remaining at
that check. The billing-console access failure did not mean the upgrade API was
unavailable, so that earlier inferred blocker is superseded.

Production is now UPDATE_COMPLETE. The private/encrypted/deletion-protected
PostgreSQL16.13 instance is available with7-day backups. Its independent key,
control journal and maintenance roles/tasks exist. Task revision2 uses image
`sha256:19b9287d289397801f607f2a6550c9a336d8771c04738116f388db775863fa46`,
built from codecommit11a9efb. Migration through0070 completed, encrypted writes
and journal enforcement are enabled. Four synthetic accounts/ten protected values
were seeded with plaintext0/invalid references0; their actual RDS snapshot became
available for the drill. Cloud replay and exact cleanup then passed, and that
temporary snapshot is now absent; customer traffic remains closed.

An earlier creation hit the operator's2KiB inline-policy quota. The exact-role
managed-policy repair preserves scope/MFA, and two retained empty resources were
imported instead of orphaned. These failure records are historical evidence;
neither resource import nor account upgrade should be repeated on continuation.
The direct Paid upgrade retains eligible credits and meters usage beyond them;
it is not a fixed monthly subscription or a spending cap.
[AWS plan guide](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html),
[AWS Free Tier FAQ](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-FAQ.html).

## Foundation contract

- Frankfurt only, new10.43.0.0/16 network with no staging peering or copied users.
- Private encrypted PostgreSQL 16, Single-AZ db.t4g.micro/20GiB, with deletion protection.
  Credentials are retained. TLS/SCRAM and at least seven days of backups are required.
- One retained, annually rotating productionKMS key with namespace
  `rillora-production`, distinct fromstaging. Per-planner data keys remain wrapped.
- Separate migration and recovery security groups. Recovery probes cannot connect
  to the original database. Maintenance jobs have no incoming application listener;
  customerHTTP services are not created by this phase.
- The recovery journal is outside the database snapshot being restored. The
  [control/replay implementation](recovery-control-journal.md) has local test proof;
  actual cloud replay is validated separately from the table existing.
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

[recovery_drill.py](../tools/release/recovery_drill.py) resumes a named snapshot
and private clone with the scoped production role. Guards require the correct
account/source, encryption, deletion protection and7-day retention. Every
adopted/deleted resource must match the exact generated ID, Rillora/RecoveryDrill
run tags and isolated network. Restore IAM names the required parameter/subnet/
default option groups; it cannot restore to a public or production target.

After production deployment and the synthetic encrypted fixture are ready:

```sh
python3 tools/release/recovery_drill.py plan --state .local/recovery/first-drill.json
python3 tools/release/recovery_drill.py snapshot --state .local/recovery/first-drill.json
python3 tools/release/recovery_drill.py status --state .local/recovery/first-drill.json
# Continue only when the snapshot is available.
python3 tools/release/recovery_drill.py restore --state .local/recovery/first-drill.json
python3 tools/release/recovery_drill.py status --state .local/recovery/first-drill.json
```

The clone remains quarantined. The driver always leaves `acceptancePassed=false`;
creating resources cannot manufacture a data-recovery pass. After evidence
capture or an abandoned attempt, `cleanup` removes only the named owned clone,
then its snapshot after clone removal. Repeat to observe asynchronous removal.
It never deletes the source, changes traffic or activates restored sessions.

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

That baseline is now pushed and read back in the private
[Rillora repository](https://github.com/tantalum666/rillora). Initial commit is
`f7b797d`; later CI/recovery changes use ordinary new commits. FanPass remains
private and separate. Current CI results and runtime boundaries are inhandoff/QA.

Each release should bind sourcecommit, immutablecontainer digest, schema floor,
content format and deployment evidence. Code rollback deploys a compatible built
artifact. Database recovery restores an isolated copy and replays control state;
it is not `git revert`. In particular, encrypted data cannot be served by a
pre-encryptionAPI merely because its source can be checked out. KMS keys and
credentials stay in AWS, notGitHub. Cloud deployment fromCI needs its own exact
OIDC/role/branch/environment boundary; no blanketAWS administrator token goes into
repository secrets.

## Code and data rollback floor

Once recovery enforcement is enabled, use a journal-aware image at or after
codecommit11a9efb, with0070 and the same content/control formats. Do not deploy a
pre-encryption or pre-journal API as a shortcut. The current maintenance image
and exact source/schema hashes form an unreleased engineering checkpoint, not a
public application version. No CI deployment or customer failover is enabled.

## Remaining boundaries

Production identity/mail, final customer ingress, real billing, merchant facts,
physical-device acceptance and public release stay under the existing release
gates. Full onlineE2EE remains deferred. Current execution status and the single
next action belong to[handoff](handoff.md), not this planning contract.

## Final bounded result

The actual RDS clone passed production KMS decryption, B/C permission separation,
post-snapshot D deletion/key removal, old-session invalidation, schema checks and
idempotent replay. Source fixture rows/content/keys are0; temporary DB and drill
snapshot are absent. Live recovery-role negative checks confirm original-network
isolation, denied key generation and denied journal writes. Original production
RDS remains available/private/encrypted/protected with7-day backups; key rotation
is enabled for365days. Existing staging readiness still returnsready.

This completes the closed data-foundation and bounded restore rehearsal. It does
not complete public API/Web/iOS production connections, identity/mail, real
commerce, final App Store submission or unrestricted automatic disaster failover.
The [control contract](recovery-control-journal.md) names conservative replay and
provider-reconciliation limits; source/image/schema references and raw task logs
are in the [QA record](../output/qa/rillora-production-recovery-20260923/README.md).

The next transport increment is tracked in the[September24 runtime contract](production-runtime-20260924.md).
Its local code/test preparation does not change the deployed data result above.
