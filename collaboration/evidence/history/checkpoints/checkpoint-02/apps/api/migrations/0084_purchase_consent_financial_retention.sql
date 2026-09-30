-- Preserve the precise recurring-purchase proof only for paid financial records,
-- alongside the existing bounded payment retention; unfinished intent data erases.
grant select on app.commerce_purchase_consents to continuity_account_service;
create policy purchase_consent_deletion_retention on app.commerce_purchase_consents for select
  to continuity_account_service using(true);

grant create on schema app to continuity_account_service;
create or replace function app.finish_account_deletion(p_job uuid,p_lease uuid,p_succeeded boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare j app.account_deletions%rowtype; orders jsonb; attempts jsonb; settlements jsonb; refunds jsonb; apple_receipts jsonb; purchase_consents jsonb;
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
  select coalesce(jsonb_agg((to_jsonb(c)-'id'-'planner_id'-'order_id')||jsonb_build_object('order_public_id',o.public_id)),'[]'::jsonb)
    into purchase_consents from app.commerce_purchase_consents c join app.commerce_orders o on o.id=c.order_id
    where c.planner_id=j.planner_id and o.status in ('paid_pending_reconciliation','paid_reconciled','refunded','disputed');
  if jsonb_array_length(orders)>0 or jsonb_array_length(apple_receipts)>0 then
    insert into app.closed_account_payment_records(deletion_public_id,records)
      values(p_job,jsonb_build_object('orders',orders,'payments',attempts,'settlements',settlements,'refunds',refunds,'appleReceipts',apple_receipts,'purchaseConsents',purchase_consents)) on conflict do nothing;
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
