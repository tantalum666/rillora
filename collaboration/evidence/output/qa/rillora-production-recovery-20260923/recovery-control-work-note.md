# Recovery control journal implementation note

Status: planned implementation, not a recovery pass. September23 continuation.

Production paid plan is ACTIVE,111.95USD credits at readback. RDS accepted7-day/private/encrypted/deletion-protected settings and is creating; stack attempt4 is still active.

Next implementation: an external DynamoDB control journal before committing restrictive changes, with a deferred SQL guard preventing unjournaled commits when enforcement is enabled. Record opaque entity IDs/revisions and permission ceilings, never private bodies/identity credentials. Restore invalidates old sessions/invitations, replays only post-checkpoint restrictions, preserves unaffected accepted recipients, and remains quarantined for unsupported post-snapshot control changes (including unreconciled billing). Terminal deletions must not resurrect keys/bodies. Publish failures roll back the original transaction; ambiguous pre-commit intents fail closed on restore and remain explicitly distinguished from successful user operations.

Use source SQL checkpoint revisions, not wall-clock comparison with the snapshot. Restored counters must advance above external journal revisions. Journal coverage metadata and a maximum eligible backup age must be verified; TTL cannot silently authorize old snapshots after tombstones expire. No clone may write to the live journal. A basic encrypted clone restore is separate from complete deletion/authorization acceptance.

This note is design reasoning and work preservation only. No new SQL/journal publisher/replay code has been created at this checkpoint.
