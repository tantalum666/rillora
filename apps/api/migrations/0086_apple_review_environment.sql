-- Review/TestFlight uses Apple-signed Sandbox evidence only for expiring,
-- explicitly enrolled accounts. It never enables customer sales or production grants.
alter table app.commerce_apple_price_bindings
  add column provider_environment text not null default 'production'
    check(provider_environment in ('production','sandbox')),
  add constraint apple_price_binding_environment unique(binding_code,provider_environment);

alter table app.commerce_apple_transaction_receipts
  drop constraint commerce_apple_transaction_receipts_provider_environment_check,
  add constraint apple_receipt_environment check(provider_environment in ('production','sandbox')),
  add constraint apple_receipt_binding_environment foreign key(binding_code,provider_environment)
    references app.commerce_apple_price_bindings(binding_code,provider_environment);
alter table app.commerce_apple_subscription_observations
  drop constraint commerce_apple_subscription_observat_provider_environment_check,
  add constraint apple_observation_environment check(provider_environment in ('production','sandbox'));
alter table app.commerce_provider_event_inbox add column apple_intake_version text
  check(apple_intake_version='verified-status-v1');
update app.commerce_provider_event_inbox set apple_intake_version='verified-status-v1'
  where provider_code='storekit' and provider_environment='production';
create index apple_review_work_due on app.commerce_provider_event_inbox(next_attempt_at,id)
  where provider_code='storekit' and provider_environment='sandbox'
    and apple_intake_version='verified-status-v1'
    and processing_status in ('received','needs_mapping','needs_authoritative_snapshot','processing');

create function app.apple_review_account_enabled(p_planner bigint) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from app.commerce_validation_accounts v join app.planners p on p.id=v.planner_id
    where v.planner_id=p_planner and p.status='active' and v.expires_at>statement_timestamp())
    and not exists(select 1 from app.commerce_subscriptions s
      where s.planner_id=p_planner and s.provider_environment='production')
    and not exists(select 1 from app.commerce_orders o
      where o.planner_id=p_planner and o.provider_environment='production')
$$;
revoke all on function app.apple_review_account_enabled(bigint) from public;
grant execute on function app.apple_review_account_enabled(bigint) to continuity_commerce;

create function app.resolve_apple_transaction_account(p_token uuid,p_environment text)
returns table(planner_id bigint,commerce_account_reference uuid)
language sql stable security definer set search_path='' as $$
  select p.id,a.public_id from app.planners p join app.commerce_accounts a on a.planner_id=p.id
  where p.public_id=p_token and p.status='active' and a.operating_plane_code='global' and a.status='active'
    and (p_environment='production' or (p_environment='sandbox' and app.apple_review_account_enabled(p.id)))
$$;
revoke all on function app.resolve_apple_transaction_account(uuid,text) from public;
grant execute on function app.resolve_apple_transaction_account(uuid,text) to continuity_commerce;

drop policy commerce_purchase_consents_owner on app.commerce_purchase_consents;
create policy commerce_purchase_consents_owner on app.commerce_purchase_consents
  using(planner_id=app.current_planner_id()) with check (
    planner_id=app.current_planner_id() and exists (
      select 1 from app.commerce_orders o where o.id=order_id and o.planner_id=app.current_planner_id()
        and ((o.provider_code in ('stripe','storekit') and o.provider_environment='production')
          or (o.provider_code='storekit' and o.provider_environment='sandbox'
            and app.apple_review_account_enabled(o.planner_id)))
    )
  );
