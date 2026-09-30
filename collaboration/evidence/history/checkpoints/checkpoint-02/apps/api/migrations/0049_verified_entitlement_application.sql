-- Only verified provider executors may ask this bounded function to apply
-- capabilities. Ordinary runtime roles still cannot write entitlement rows.
alter table app.commerce_subscriptions add column provider_observed_at timestamptz;
grant select(provider_observed_at), update(provider_observed_at) on app.commerce_subscriptions to continuity_commerce;
alter table app.commerce_reconciliation_runs drop constraint commerce_reconciliation_no_test_entitlement;
grant create on schema app to continuity_share_service;
grant select on app.commerce_plan_capabilities,app.commerce_plan_versions to continuity_share_service;
grant insert,update on app.commerce_entitlement_grants to continuity_share_service;
grant usage on sequence app.commerce_entitlement_grants_id_seq to continuity_share_service;
create policy commerce_entitlement_service_write on app.commerce_entitlement_grants
  for insert to continuity_share_service with check(planner_id=app.current_planner_id());
create policy commerce_entitlement_service_update on app.commerce_entitlement_grants
  for update to continuity_share_service using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());

create function app.apply_verified_subscription_entitlements(p_subscription bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare s app.commerce_subscriptions%rowtype; cap record; old_grant app.commerce_entitlement_grants%rowtype;
  until_at timestamptz; eligible boolean;
begin
  if app.current_planner_id() is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0));
  select * into s from app.commerce_subscriptions where id=p_subscription and planner_id=app.current_planner_id();
  if not found or s.provider_observed_at is null or s.acquisition_type<>'purchased' then return false; end if;
  if not ((s.provider_environment='production' and
      (select production_entitlements_enabled from app.commerce_runtime_policy where singleton))
    or (s.provider_environment in ('test','sandbox') and exists(select 1 from app.commerce_validation_accounts
      where planner_id=s.planner_id and expires_at>statement_timestamp()))) then return false; end if;
  if not exists(select 1 from app.commerce_accounts a where a.id=s.commerce_account_id and a.status='active') then return false; end if;
  until_at:=case when s.state='grace' then least(s.grace_ends_at,s.current_period_ends_at+interval '7 days') else s.current_period_ends_at end;
  eligible:=s.state in ('active','cancel_at_period_end','grace') and until_at>statement_timestamp()
    and s.current_period_starts_at<=statement_timestamp();
  if eligible is not true then
    update app.commerce_entitlement_grants set revoked_at=coalesce(revoked_at,least(statement_timestamp(),until_at))
      where subscription_id=s.id and planner_id=s.planner_id and revoked_at is null;
    update app.sharing_saved_items saved set cutoff_at=least(saved.cutoff_at,coalesce(until_at,statement_timestamp()),statement_timestamp())
      from app.commerce_entitlement_grants g where g.id=saved.entitlement_id and g.subscription_id=s.id;
    return true;
  end if;
  for cap in select pc.capability_code,pc.allowance from app.commerce_plan_capabilities pc
    join app.commerce_plan_versions pv on pv.id=pc.plan_version_id
    where pv.id=s.plan_version_id and pc.capability_code in ('trusted_people_multiple','family_maintenance')
      and (s.provider_environment<>'production' or (pv.status='active' and pc.enforcement_mode in ('included','metered_limit')))
  loop
    -- A legacy unbounded catalog is not a five-person purchase.
    if cap.capability_code='trusted_people_multiple' and (cap.allowance is null or cap.allowance not between 1 and 5) then continue; end if;
    select * into old_grant from app.commerce_entitlement_grants
      where planner_id=s.planner_id and subscription_id=s.id and capability_code=cap.capability_code
        and revoked_at is null order by id desc limit 1;
    if found and old_grant.expires_at>=s.current_period_starts_at then
      update app.commerce_entitlement_grants set expires_at=until_at where id=old_grant.id;
      update app.sharing_saved_items set cutoff_at=until_at where entitlement_id=old_grant.id;
    else
      update app.commerce_entitlement_grants set revoked_at=coalesce(revoked_at,statement_timestamp())
        where planner_id=s.planner_id and subscription_id=s.id and capability_code=cap.capability_code and revoked_at is null;
      insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,
        subscription_id,source_reference,allowance,effective_at,expires_at)
      values(s.planner_id,s.commerce_account_id,cap.capability_code,'subscription',s.id,
        'provider-verified:'||s.public_id::text,cap.allowance,greatest(s.current_period_starts_at,statement_timestamp()),until_at);
      -- New grant IDs deliberately require the owner to resume paused people.
    end if;
  end loop;
  return true;
end $$;
revoke all on function app.apply_verified_subscription_entitlements(bigint) from public;
alter function app.apply_verified_subscription_entitlements(bigint) owner to continuity_share_service;
grant execute on function app.apply_verified_subscription_entitlements(bigint) to continuity_commerce;

-- The rollout switch never lets the historical maintenance-preview switch
-- bypass an expired commercial entitlement.
create or replace function app.family_maintenance_enabled(p_owner bigint,p_preview boolean) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.planners where id=p_owner and status='active')
 and (p_owner=app.current_planner_id() or exists(select 1 from app.sharing_connections c
   where c.planner_id=p_owner and c.recipient_planner_id=app.current_planner_id() and c.status='accepted'))
 and ((p_preview and not app.sharing_limits_enabled(p_owner)) or exists(
   select 1 from app.commerce_entitlement_grants e
   join app.commerce_accounts a on a.id=e.commerce_account_id and a.planner_id=e.planner_id and a.status='active'
   where e.planner_id=p_owner and e.capability_code='family_maintenance' and (e.allowance is null or e.allowance>0)
     and e.effective_at<=statement_timestamp() and e.expires_at>statement_timestamp() and e.revoked_at is null
     and exists(select 1 from app.sharing_family_grant(p_owner) allowed
       join app.commerce_entitlement_grants linked on linked.id=allowed.id
       where linked.subscription_id is not distinct from e.subscription_id and linked.source_type=e.source_type)))
$$;
create or replace function app.family_review_task(p_id bigint, p_preview boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'publicId',t.public_id,'roundPublicId',r.public_id,'roundState',r.state,
    'matterPublicId',m.public_id,'connectionPublicId',c.public_id,
    'ownerName',p.display_name,'personName',person.display_name,'title',m.title,
    'state',t.state,'version',t.version,'sourceVersion',t.source_version,
    'currentVersion',m.version,'fields',t.source_fields,'proposal',t.proposal,
    'reason',t.reason,'dueAt',r.due_at,'respondedAt',t.responded_at,'decidedAt',t.decided_at,
    'scopeAvailable',c.status='accepted' and person.status not in ('revoked','archived')
      and g.id is not null and g.detail_level in ('directions','details')
      and m.archived_at is null and m.desired_outcome <> 'never_disclose',
    'isStale',m.version <> t.source_version,
    'canRespond',r.state='open' and c.recipient_planner_id=app.current_planner_id()
      and t.state in ('waiting','confirmed','needs_update','suggested')
      and m.version=t.source_version and app.family_maintenance_enabled(t.planner_id,p_preview),
    'canSuggest',r.state='open' and coalesce(s.collaborator_connection_id=c.id,false)
      and app.family_maintenance_enabled(t.planner_id,p_preview),
    'canManage',t.planner_id=app.current_planner_id() and r.state='open'
      and app.family_maintenance_enabled(t.planner_id,p_preview))
  from app.family_review_tasks t
  join app.family_review_rounds r on r.id=t.round_id and r.planner_id=t.planner_id
  join app.sharing_connections c on c.id=t.connection_id and c.planner_id=t.planner_id
  join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
  join app.planners p on p.id=t.planner_id and p.status='active'
  join app.matter_items m on m.id=t.matter_item_id and m.planner_id=t.planner_id
  left join app.sharing_grants g on g.id=t.grant_id and g.connection_id=c.id and g.matter_item_id=m.id
  left join app.family_review_settings s on s.planner_id=t.planner_id
  where t.id=p_id and (t.planner_id=app.current_planner_id() or
    (c.recipient_planner_id=app.current_planner_id() and c.status='accepted'
      and person.status not in ('revoked','archived') and g.id is not null
      and g.detail_level in ('directions','details') and m.archived_at is null
      and m.desired_outcome <> 'never_disclose' and app.sharing_connection_mode(c.id)='live'))
$$;
revoke all on function app.family_review_task(bigint, boolean) from public;
grant execute on function app.family_review_task(bigint, boolean) to continuity_app, continuity_share_service;
alter function app.family_review_task(bigint, boolean) owner to continuity_share_service;


revoke create on schema app from continuity_share_service;
