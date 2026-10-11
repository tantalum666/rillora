-- A public planner UUID is an identity, not first-purchase authorization.
alter table app.commerce_apple_purchase_sessions
 add column app_account_token uuid not null default gen_random_uuid(),
 add column original_transaction_reference text,
 add column legacy_planner_token boolean not null default false,
 add column started_at timestamptz;
-- Only intents that actually existed at the cutover retain the former token.
-- Newly prepared intents cannot opt into this compatibility path.
update app.commerce_apple_purchase_sessions set legacy_planner_token=true,
 started_at=case when state in ('started','pending') then created_at else null end
 where state in ('prepared','started','pending');
alter table app.commerce_apple_transaction_receipts add column app_account_token uuid;
create index apple_receipt_owner_token on app.commerce_apple_transaction_receipts
 (provider_environment,original_transaction_reference,app_account_token) where app_account_token is not null;
-- This correlation is needed by an active account and a quarantined restore,
-- not by the seven-year financial archive after account erasure.
create function app.minimize_closed_apple_receipts() returns trigger
language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(new.records->'appleReceipts')='array' then
  new.records:=jsonb_set(new.records,'{appleReceipts}',coalesce((
   select jsonb_agg(value-'app_account_token') from jsonb_array_elements(new.records->'appleReceipts')
  ),'[]'::jsonb));
 end if;
 return new;
end $$;
revoke all on function app.minimize_closed_apple_receipts() from public;
create trigger minimize_closed_apple_receipts before insert on app.closed_account_payment_records
 for each row execute function app.minimize_closed_apple_receipts();
create unique index apple_purchase_account_token on app.commerce_apple_purchase_sessions(app_account_token);
create index apple_purchase_original_claim on app.commerce_apple_purchase_sessions(original_transaction_reference)
 where original_transaction_reference is not null;

-- Legacy restores are permitted only through an existing immutable provider
-- link. Unknown originals must consume an exact server-created purchase intent.
create function app.resolve_apple_purchase_owner(p_token uuid,p_environment text,p_original text,p_receipt jsonb)
 returns table(planner_id bigint,commerce_account_reference uuid)
 language plpgsql security definer set search_path='' as $$
declare existing record; candidate record;
begin
 if p_environment not in ('production','sandbox') or p_original is null or p_original !~ '^[0-9]{1,40}$' then return; end if;
 perform pg_advisory_xact_lock(hashtextextended('apple-owner:'||p_environment||':'||p_original,0));
 select p.id,p.public_id,a.public_id as account into existing
 from app.commerce_provider_object_links l join app.commerce_accounts a on a.public_id=l.commerce_account_reference
 join app.planners p on p.id=a.planner_id
 where l.provider_code='storekit' and l.provider_environment=p_environment and l.provider_object_type='original_transaction'
   and l.provider_object_reference=p_original and a.status='active' and a.operating_plane_code='global' and p.status='active'
   and (p_environment='production' or app.apple_review_account_enabled(p.id));
 if found then
  if existing.public_id=p_token or exists(select 1 from app.commerce_apple_purchase_sessions s
    where s.planner_id=existing.id and s.app_account_token=p_token and s.original_transaction_reference=p_original)
   or exists(select 1 from app.commerce_apple_transaction_receipts r where r.planner_id=existing.id
     and r.provider_environment=p_environment and r.original_transaction_reference=p_original and r.app_account_token=p_token) then
   return query select existing.id,existing.account;
  end if;
  return;
 end if;
 if p_receipt is null or p_receipt->>'originalTransactionId'<>p_original then return; end if;
 select s.order_id,s.planner_id,a.public_id as account into candidate
 from app.commerce_apple_purchase_sessions s join app.commerce_orders o on o.id=s.order_id and o.planner_id=s.planner_id
 join app.commerce_accounts a on a.id=o.commerce_account_id and a.planner_id=s.planner_id
 join app.planners p on p.id=s.planner_id
 join app.commerce_purchase_consents consent on consent.order_id=o.id and consent.planner_id=s.planner_id
 join app.commerce_apple_price_bindings binding on binding.binding_code=s.binding_code
 join app.commerce_prices price on price.id=o.price_id
 where (s.app_account_token=p_token or (s.legacy_planner_token and p.public_id=p_token))
   and s.state in ('started','pending','closed')
   and s.started_at is not null
   and (s.original_transaction_reference is null or s.original_transaction_reference=p_original)
   and o.provider_code='storekit' and o.provider_environment=p_environment
   and binding.provider_environment=p_environment and binding.price_id=o.price_id
   and binding.product_reference=p_receipt->>'productId'
   and s.storefront_country_code=p_receipt->>'storefront'
   and o.currency_code=p_receipt->>'currency'
   and (p_receipt->>'priceMilliunits')::numeric=o.amount_minor*power(10::numeric,3-price.minor_unit_exponent)
   and (p_receipt->>'purchasedAt')::timestamptz>=s.created_at-interval '5 minutes'
   and (p_receipt->>'purchasedAt')::timestamptz<=statement_timestamp()+interval '5 minutes'
   and (s.state<>'closed' or (p_receipt->>'purchasedAt')::timestamptz<=s.updated_at+interval '5 minutes')
   and a.status='active' and a.operating_plane_code='global' and p.status='active'
   and (p_environment='production' or app.apple_review_account_enabled(p.id))
 for update of s;
 if not found then return; end if;
 update app.commerce_apple_purchase_sessions set original_transaction_reference=p_original where order_id=candidate.order_id;
 return query select candidate.planner_id,candidate.account;
end $$;
revoke all on function app.resolve_apple_purchase_owner(uuid,text,text,jsonb) from public;
grant execute on function app.resolve_apple_purchase_owner(uuid,text,text,jsonb) to continuity_commerce;

grant select on app.commerce_apple_purchase_sessions to continuity_recovery_service;
create policy recovery_apple_purchase_metadata on app.commerce_apple_purchase_sessions
 for select to continuity_recovery_service using(true);
