alter table app.commerce_provider_event_inbox
  add column account_binding_reference uuid;

comment on column app.commerce_provider_event_inbox.account_binding_reference is
  'Provider-supplied account binding such as StoreKit appAccountToken; not a commerce account ID.';

alter table app.commerce_provider_event_inbox
  drop constraint commerce_provider_inbox_processing;

alter table app.commerce_provider_event_inbox
  add constraint commerce_provider_inbox_processing check (
    processing_status in (
      'received', 'processing', 'needs_mapping', 'needs_authoritative_snapshot',
      'applied', 'ignored', 'failed'
    )
  );

drop index app.commerce_provider_inbox_pending_idx;
create index commerce_provider_inbox_pending_idx
  on app.commerce_provider_event_inbox (processing_status, received_at, id)
  where processing_status in (
    'received', 'needs_mapping', 'needs_authoritative_snapshot', 'failed'
  );

alter table app.commerce_provider_object_links
  drop constraint commerce_provider_object_links_type;

alter table app.commerce_provider_object_links
  add constraint commerce_provider_object_links_type check (
    provider_object_type in (
      'checkout_session', 'customer', 'subscription', 'original_transaction',
      'transaction', 'invoice', 'charge', 'refund', 'dispute'
    )
  );
