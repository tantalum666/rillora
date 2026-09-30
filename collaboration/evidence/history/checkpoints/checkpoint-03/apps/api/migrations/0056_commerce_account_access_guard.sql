grant create on schema app to continuity_share_service;
create or replace function app.sharing_family_grant(p_owner bigint)
returns table(id bigint, allowance integer, cutoff_at timestamptz)
language sql stable security definer set search_path='' as $$
  select e.id, least(e.allowance,5), least(e.expires_at,
      case when e.source_type='subscription' then
        case when s.state='grace' then least(s.grace_ends_at,s.current_period_ends_at+interval '7 days')
          else s.current_period_ends_at end else e.expires_at end)
  from app.commerce_entitlement_grants e
  join app.commerce_accounts a on a.id=e.commerce_account_id and a.planner_id=e.planner_id and a.status='active'
  left join app.commerce_subscriptions s on s.id=e.subscription_id and s.planner_id=e.planner_id
  where e.planner_id=p_owner and e.capability_code='trusted_people_multiple'
    and e.allowance between 1 and 5 and e.revoked_at is null
    and e.effective_at<=statement_timestamp() and e.expires_at>statement_timestamp()
    and (e.source_type<>'subscription' or (
      s.state in ('active','cancel_at_period_end','grace')
      and s.current_period_starts_at<=statement_timestamp()
      and (case when s.state='grace' then least(s.grace_ends_at,s.current_period_ends_at+interval '7 days')
           else s.current_period_ends_at end)>statement_timestamp()
      and ((s.provider_environment='production' and
        (select production_entitlements_enabled from app.commerce_runtime_policy where singleton))
        or (s.provider_environment in ('test','sandbox') and exists(select 1
          from app.commerce_validation_accounts v where v.planner_id=p_owner and v.expires_at>statement_timestamp())))
    )) order by e.effective_at desc,e.id desc limit 1
$$;


revoke create on schema app from continuity_share_service;
