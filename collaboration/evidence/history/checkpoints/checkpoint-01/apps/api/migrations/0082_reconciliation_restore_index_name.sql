-- Do not reuse the old constraint-owned index's name for a partial index:
-- pg_restore --clean must also work against an older isolated restore target.
alter index app.commerce_reconciliation_event_unique rename to commerce_reconciliation_delivery_only_unique;
