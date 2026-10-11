-- Preserve server-issued Apple ownership correlation across quarantined restores.
grant select on app.commerce_apple_price_bindings to continuity_recovery_service;
grant select(id,planner_id,provider_environment,original_transaction_reference,app_account_token,signed_at)
 on app.commerce_apple_transaction_receipts to continuity_recovery_service;
create policy recovery_apple_owner_token_inventory on app.commerce_apple_transaction_receipts
 for select to continuity_recovery_service using(true);

create or replace function app.recovery_pending() returns jsonb
language plpgsql security definer set search_path='' as $$
declare e record; payload jsonb; result jsonb:='[]'::jsonb;
begin
 for e in select * from app.recovery_controls where transaction_id=txid_current() and not published order by revision loop
  payload:=null;
  if e.kind='connection' then
   select jsonb_build_object('status',c.status,'recipient',p.public_id,'version',c.version,'historyVersion',2,
    'grants',coalesce((select jsonb_agg(jsonb_build_object('matter',m.public_id,'level',g.detail_level,'grantId',g.id::text,
      'savedFieldNames',(select coalesce(jsonb_agg(k order by k),'[]'::jsonb) from app.sharing_saved_items s
        cross join lateral jsonb_object_keys(s.fields) k where s.grant_id=g.id having count(*)>0),
      'revokedReviewThrough',(select max(t.id)::text from app.family_review_tasks t where t.grant_id=g.id and t.access_revoked_at is not null)
    ) order by m.public_id)
      from app.sharing_grants g join app.matter_items m on m.id=g.matter_item_id
      where g.connection_id=c.id),'[]'::jsonb)) into payload
   from app.sharing_connections c left join app.planners p on p.id=c.recipient_planner_id where c.public_id=e.entity_public_id;
  elsif e.kind='matter' then
   select jsonb_build_object('version',version,'archived',archived_at is not null,'private',desired_outcome='never_disclose')
    into payload from app.matter_items where public_id=e.entity_public_id;
  elsif e.kind='person' then
   select jsonb_build_object('version',version,'restricted',status in('archived','revoked') or archived_at is not null)
    into payload from app.people where public_id=e.entity_public_id;
  elsif e.kind='free_slot' then
   select jsonb_build_object('connection',c.public_id) into payload from app.planners p
    left join app.sharing_preferences f on f.planner_id=p.id left join app.sharing_connections c on c.id=f.free_connection_id
    where p.public_id=e.entity_public_id;
  elsif e.kind='retention_hold' then
   select jsonb_build_object('category',category,'recordId',record_id,'reason',reason_code,'active',released_at is null)
    into payload from app.retention_holds where public_id=e.entity_public_id;
  elsif e.kind='account' then
   select jsonb_build_object('status',status) into payload from app.planners where public_id=e.entity_public_id;
  elsif e.kind='unreconciled_access' then
   select jsonb_build_object('version',1,'manualAccess',exists(
    select 1 from app.commerce_entitlement_grants g where g.planner_id=p.id
     and g.capability_code in ('trusted_people_multiple','family_maintenance') and g.source_type<>'subscription'
     and g.revoked_at is null and (g.expires_at is null or g.expires_at>now())),
    'subscriptions',coalesce((select jsonb_agg(jsonb_build_object('provider',s.renewal_provider,'environment',s.provider_environment,
      'reference',s.provider_subscription_reference,'account',a.public_id,'market',a.service_market_code,'plane',a.operating_plane_code,
      'acquisition',s.acquisition_type,'customer',c.provider_customer_reference,
      'appAccountToken',case when s.renewal_provider='storekit' then coalesce((
       select r.app_account_token from app.commerce_apple_transaction_receipts r
       where r.planner_id=s.planner_id and r.original_transaction_reference=s.provider_subscription_reference
         and r.provider_environment=s.provider_environment and r.app_account_token is not null
       order by r.signed_at desc,r.id desc limit 1
      ),(
       select ps.app_account_token from app.commerce_apple_purchase_sessions ps
       join app.commerce_apple_price_bindings pb on pb.binding_code=ps.binding_code
       where ps.planner_id=s.planner_id and ps.original_transaction_reference=s.provider_subscription_reference
         and pb.provider_environment=s.provider_environment order by ps.created_at desc limit 1
      )) else null end) order by s.id)
     from app.commerce_subscriptions s join app.commerce_accounts a on a.id=s.commerce_account_id
     left join app.commerce_provider_customers c on c.commerce_account_id=a.id and c.provider_code=s.renewal_provider and c.provider_environment=s.provider_environment
     where s.planner_id=p.id),'[]'::jsonb)) into payload from app.planners p where p.public_id=e.entity_public_id;
   if payload is null then payload:='{}'::jsonb;
   elsif jsonb_array_length(payload->'subscriptions')>100 then raise exception 'recovery commerce inventory requires bounded maintenance'; end if;
  else payload:='{}'::jsonb;
  end if;
  result:=result||jsonb_build_array(jsonb_build_object('key',e.entity_key,'kind',e.kind,'id',e.entity_public_id,
   'revision',e.revision::text,'recordedAt',e.recorded_at,'facts',coalesce(payload,'{"deleted":true}'::jsonb)));
 end loop;
 return result;
end $$;
