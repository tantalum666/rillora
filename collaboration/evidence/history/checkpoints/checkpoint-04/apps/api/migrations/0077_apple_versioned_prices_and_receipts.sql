-- Apple keeps a product ID while local prices and grandfathered terms vary.
-- Keep those signed-price bindings separate from the single current merchandising SKU.
-- No price, product, market or sale is activated here.
alter table app.commerce_prices add column purchase_channel text not null default 'web'
  check(purchase_channel in ('web','apple_app_store'));
alter table app.commerce_prices add constraint commerce_prices_channel_identity unique(id,purchase_channel);
grant select(purchase_channel) on app.commerce_prices to continuity_app,continuity_commerce;

create table app.commerce_apple_price_bindings (
  binding_code text primary key check(binding_code ~ '^[a-z][a-z0-9_]{1,79}$'),
  price_id bigint not null,
  purchase_channel text not null default 'apple_app_store' check(purchase_channel='apple_app_store'),
  product_reference text not null check(product_reference in ('com.rillora.family.annual','com.rillora.family.monthly')),
  storefront_country_code text not null check(storefront_country_code ~ '^[A-Z]{3}$'),
  effective_from timestamptz not null,
  effective_to timestamptz check(effective_to is null or effective_to>effective_from),
  status text not null default 'retired' check(status in ('active','retired')),
  created_at timestamptz not null default now(),
  foreign key(price_id,purchase_channel) references app.commerce_prices(id,purchase_channel)
);
revoke all on app.commerce_apple_price_bindings from public;
grant select on app.commerce_apple_price_bindings to continuity_commerce;

alter table app.commerce_subscriptions add constraint commerce_subscription_receipt_identity
  unique(id,planner_id,renewal_provider,provider_environment);
create table app.commerce_apple_transaction_receipts (
  id bigint generated always as identity primary key,
  planner_id bigint not null references app.planners(id) on delete cascade,
  subscription_id bigint not null,
  binding_code text not null references app.commerce_apple_price_bindings(binding_code),
  provider_environment text not null check(provider_environment='production'),
  renewal_provider text not null default 'storekit' check(renewal_provider='storekit'),
  original_transaction_reference text not null check(original_transaction_reference ~ '^[0-9]{1,40}$'),
  transaction_reference text not null check(transaction_reference ~ '^[0-9]{1,40}$'),
  price_milliunits bigint not null check(price_milliunits>0 and price_milliunits<=9007199254740991),
  currency_code text not null check(currency_code ~ '^[A-Z]{3}$'),
  purchased_at timestamptz not null,
  paid_through timestamptz not null check(paid_through>purchased_at),
  signed_at timestamptz not null,
  proof_sha256 bytea not null check(octet_length(proof_sha256)=32),
  recorded_at timestamptz not null default now(),
  unique(provider_environment,transaction_reference),
  foreign key(subscription_id,planner_id,renewal_provider,provider_environment)
    references app.commerce_subscriptions(id,planner_id,renewal_provider,provider_environment) on delete cascade
);
alter table app.commerce_apple_transaction_receipts enable row level security;
alter table app.commerce_apple_transaction_receipts force row level security;
create policy apple_transaction_receipts_owner on app.commerce_apple_transaction_receipts to continuity_commerce
  using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
revoke all on app.commerce_apple_transaction_receipts from public;
grant select,insert on app.commerce_apple_transaction_receipts to continuity_commerce;
grant usage on sequence app.commerce_apple_transaction_receipts_id_seq to continuity_commerce;
-- Preserve only receipt facts under the existing deletion/financial-record purpose.
grant select on app.commerce_apple_transaction_receipts to continuity_account_service;
create policy apple_receipts_deletion_retention on app.commerce_apple_transaction_receipts for select
  to continuity_account_service using(true);

grant create on schema app to continuity_account_service;
create or replace function app.finish_account_deletion(p_job uuid,p_lease uuid,p_succeeded boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare j app.account_deletions%rowtype; orders jsonb; attempts jsonb; settlements jsonb; refunds jsonb; apple_receipts jsonb;
begin
  select * into j from app.account_deletions where public_id=p_job and lease_token=p_lease and status='processing' for update;
  if not found then return false; end if;
  if not p_succeeded then
    update app.account_deletions set status='retrying',error_code='identity_cleanup_retry',lease_token=null,lease_until=null,
      next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,least(j.attempts,7))::integer)) where public_id=p_job;
    return false;
  end if;
  -- Keep bounded financial evidence, not the private map or identity profile.
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'-'commerce_account_id'),'[]'::jsonb) into orders from app.commerce_orders o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'),'[]'::jsonb) into attempts from app.commerce_payment_attempts o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'-'commerce_account_id'),'[]'::jsonb) into settlements from app.commerce_settlements o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'),'[]'::jsonb) into refunds from app.commerce_refunds o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(r)-'id'-'planner_id'-'subscription_id'),'[]'::jsonb) into apple_receipts
    from app.commerce_apple_transaction_receipts r where r.planner_id=j.planner_id;
  if jsonb_array_length(orders)>0 or jsonb_array_length(apple_receipts)>0 then
    insert into app.closed_account_payment_records(deletion_public_id,records)
      values(p_job,jsonb_build_object('orders',orders,'payments',attempts,'settlements',settlements,'refunds',refunds,'appleReceipts',apple_receipts)) on conflict do nothing;
  end if;
  -- Existing legal_acceptances use SET NULL and retain only their approved digest.
  delete from app.planners where id=j.planner_id and status='deletion_pending';
  if exists(select 1 from app.planners where id=j.planner_id) then
    raise exception 'account erasure not complete' using errcode='55000';
  end if;
  update app.account_deletions set status='completed',identities='[]'::jsonb,planner_id=null,
    completed_at=now(),lease_token=null,lease_until=null,error_code=null where public_id=p_job;
  return true;
end $$;

revoke create on schema app from continuity_account_service;
