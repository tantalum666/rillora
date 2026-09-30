drop policy if exists planners_tenant_isolation on app.planners;

create policy planners_tenant_isolation on app.planners
  to continuity_app
  using (id = app.current_planner_id())
  with check (id = app.current_planner_id());

create policy planners_auth_lookup on app.planners
  for select
  to continuity_auth
  using (true);

revoke select on app.planners from continuity_auth;
grant select (id, public_id, status) on app.planners to continuity_auth;
