-- Preserve the isolated deletion worker's pre-existing journal access after
-- 0104 wraps the formatter. Old-format output is not a runtime entry point.
grant execute on function app.recovery_pending() to continuity_deletion_worker;
revoke execute on function app.recovery_pending_before_ai() from continuity_deletion_worker;
