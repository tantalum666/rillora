-- Recheck ownership status at purchase preparation, not only at the earlier
-- HTTP authentication step. This grants no read of the identity/profile table.
create function app.commerce_planner_can_purchase() returns boolean
language sql stable security definer set search_path=pg_catalog,app as $$
  select exists(select 1 from app.planners where id=app.current_planner_id() and status='active')
    and not exists(select 1 from app.commerce_accounts where planner_id=app.current_planner_id()
      and operating_plane_code='global' and status<>'active')
$$;
revoke all on function app.commerce_planner_can_purchase() from public;
grant execute on function app.commerce_planner_can_purchase() to continuity_commerce;
