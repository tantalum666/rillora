create or replace function app.resolve_storekit_account_binding(
  p_planner_public_id uuid
)
returns table (
  planner_id bigint,
  commerce_account_reference uuid
)
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select planner.id, account.public_id
  from app.planners planner
  join app.commerce_accounts account on account.planner_id = planner.id
  where planner.public_id = p_planner_public_id
    and account.operating_plane_code = 'global'
    and account.service_market_code = 'GLOBAL_US'
    and account.status = 'active'
  limit 1
$$;

revoke all on function app.resolve_storekit_account_binding(uuid) from public;
grant execute on function app.resolve_storekit_account_binding(uuid)
  to continuity_commerce;
