drop index app.role_assignments_scope_unique_idx;

create unique index role_assignments_active_scope_unique_idx on app.role_assignments (
  planner_id, person_id, role, coalesce(matter_item_id, 0)
) where status <> 'revoked';
