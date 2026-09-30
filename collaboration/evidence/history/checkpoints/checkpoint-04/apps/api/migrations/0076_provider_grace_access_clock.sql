-- Keep the paid coverage period distinct from a provider-authorized grace window.
-- No market, product, price or entitlement switch is activated by this migration.
grant create on schema app to continuity_share_service;
create function app.commerce_subscription_access_until(s app.commerce_subscriptions)
returns timestamptz language sql immutable parallel safe set search_path='' as $$
  select case
    when s.state <> 'grace' then s.current_period_ends_at
    when s.grace_ends_at is null or s.current_period_ends_at is null
      or s.grace_ends_at <= s.current_period_ends_at then null
    when s.renewal_provider = 'storekit' and s.provider_environment = 'production' then
      case when s.grace_ends_at <= s.current_period_ends_at + interval '28 days'
        then s.grace_ends_at else null end
    else least(s.grace_ends_at, s.current_period_ends_at + interval '7 days')
  end
$$;
revoke all on function app.commerce_subscription_access_until(app.commerce_subscriptions) from public;
alter function app.commerce_subscription_access_until(app.commerce_subscriptions) owner to continuity_share_service;
grant execute on function app.commerce_subscription_access_until(app.commerce_subscriptions)
  to continuity_commerce, continuity_app;

create or replace function app.apply_verified_subscription_entitlements(p_subscription bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare s app.commerce_subscriptions%rowtype; cap record; old_grant app.commerce_entitlement_grants%rowtype;
  until_at timestamptz; eligible boolean; mutations integer:=0; applied boolean:=false;
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
  until_at:=app.commerce_subscription_access_until(s);
  eligible:=s.state in ('active','cancel_at_period_end','grace') and until_at>statement_timestamp()
    and s.current_period_starts_at<=statement_timestamp();
  if eligible is not true then
    update app.commerce_entitlement_grants set revoked_at=coalesce(revoked_at,least(statement_timestamp(),until_at))
      where subscription_id=s.id and planner_id=s.planner_id and revoked_at is null;
    get diagnostics mutations = row_count;
    update app.sharing_saved_items saved set cutoff_at=least(saved.cutoff_at,coalesce(until_at,statement_timestamp()),statement_timestamp())
      from app.commerce_entitlement_grants g where g.id=saved.entitlement_id and g.subscription_id=s.id;
    return mutations>0;
  end if;
  for cap in select pc.capability_code,pc.allowance from app.commerce_plan_capabilities pc
    join app.commerce_plan_versions pv on pv.id=pc.plan_version_id
    where pv.id=s.plan_version_id and pc.capability_code in ('trusted_people_multiple','family_maintenance')
      and (s.provider_environment<>'production' or (pv.status='active' and pc.enforcement_mode in ('included','metered_limit')))
  loop
    -- A legacy unbounded catalog is not a five-person purchase.
    if cap.capability_code='trusted_people_multiple' and (cap.allowance is null or cap.allowance not between 1 and 5) then continue; end if;
    applied:=true;
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
  return applied;
end $$;
revoke all on function app.apply_verified_subscription_entitlements(bigint) from public;
alter function app.apply_verified_subscription_entitlements(bigint) owner to continuity_share_service;
grant execute on function app.apply_verified_subscription_entitlements(bigint) to continuity_commerce;

create or replace function app.commerce_subscription_effective(p_id bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.commerce_subscriptions s where s.id=p_id and s.planner_id=app.current_planner_id()
   and s.state in ('active','cancel_at_period_end','grace','previewing')
   and ((s.provider_environment='internal' and s.acquisition_type in ('migration','support_override')
         and (s.current_period_ends_at is null or s.current_period_ends_at>statement_timestamp()))
     or (s.current_period_starts_at<=statement_timestamp()
       and (app.commerce_subscription_access_until(s))>statement_timestamp()
       and ((s.provider_environment='production' and (select production_entitlements_enabled from app.commerce_runtime_policy where singleton))
         or (s.provider_environment in ('test','sandbox') and exists(select 1 from app.commerce_validation_accounts v
           where v.planner_id=s.planner_id and v.expires_at>statement_timestamp())))))
   and exists(select 1 from app.commerce_entitlement_grants e where e.subscription_id=s.id and e.revoked_at is null
     and e.effective_at<=statement_timestamp() and (e.expires_at is null or e.expires_at>statement_timestamp())))
$$;
revoke all on function app.commerce_subscription_effective(bigint) from public;
alter function app.commerce_subscription_effective(bigint) owner to continuity_share_service;
grant execute on function app.commerce_subscription_effective(bigint) to continuity_app;


create or replace function app.sharing_family_grant(p_owner bigint)
returns table(id bigint, allowance integer, cutoff_at timestamptz)
language sql stable security definer set search_path='' as $$
  select e.id, least(e.allowance,5), least(e.expires_at,
      case when e.source_type='subscription' then
        app.commerce_subscription_access_until(s) else e.expires_at end)
  from app.commerce_entitlement_grants e
  join app.commerce_accounts a on a.id=e.commerce_account_id and a.planner_id=e.planner_id and a.status='active'
  left join app.commerce_subscriptions s on s.id=e.subscription_id and s.planner_id=e.planner_id
  where e.planner_id=p_owner and e.capability_code='trusted_people_multiple'
    and e.allowance between 1 and 5 and e.revoked_at is null
    and e.effective_at<=statement_timestamp() and e.expires_at>statement_timestamp()
    and (e.source_type<>'subscription' or (
      s.state in ('active','cancel_at_period_end','grace')
      and s.current_period_starts_at<=statement_timestamp()
      and (app.commerce_subscription_access_until(s))>statement_timestamp()
      and ((s.provider_environment='production' and
        (select production_entitlements_enabled from app.commerce_runtime_policy where singleton))
        or (s.provider_environment in ('test','sandbox') and exists(select 1
          from app.commerce_validation_accounts v where v.planner_id=p_owner and v.expires_at>statement_timestamp())))
    )) order by e.effective_at desc,e.id desc limit 1
$$;

revoke create on schema app from continuity_share_service;
