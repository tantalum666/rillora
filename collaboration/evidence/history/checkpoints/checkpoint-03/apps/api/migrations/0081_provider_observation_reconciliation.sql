-- A provider delivery is immutable, but an explicit restore can fetch fresh
-- authoritative state for that same delivery. Preserve each observation instead
-- of overwriting its earlier audit decision. Legacy delivery-only uniqueness stays.
alter table app.commerce_reconciliation_runs add column provider_observed_at timestamptz;
alter table app.commerce_reconciliation_runs drop constraint commerce_reconciliation_event_unique;
create unique index commerce_reconciliation_event_unique on app.commerce_reconciliation_runs(provider_event_id)
  where provider_observed_at is null;
create unique index commerce_reconciliation_observation_unique on app.commerce_reconciliation_runs(provider_event_id,provider_observed_at)
  where provider_observed_at is not null;
