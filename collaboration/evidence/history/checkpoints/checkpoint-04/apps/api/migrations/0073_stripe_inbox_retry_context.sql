-- Keep only verified routing references; never retain webhook bodies or customer fields.
alter table app.commerce_provider_event_inbox
  add column order_reference uuid,
  add column payment_attempt_reference uuid,
  add column last_attempt_at timestamptz not null default now();
create index commerce_stripe_inbox_retry on app.commerce_provider_event_inbox(last_attempt_at,id)
  where provider_code='stripe' and provider_environment='production'
    and processing_status in ('received','processing','needs_mapping','failed');
grant update(last_attempt_at) on app.commerce_provider_event_inbox to continuity_commerce;
