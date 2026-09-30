alter table app.role_assignments
  add column version integer not null default 1,
  add constraint role_assignments_version_positive check (version > 0);

alter table app.disclosure_rehearsals
  add column invalidated_at timestamptz,
  add column invalidated_reason text,
  add constraint disclosure_rehearsals_invalidation_pair check (
    (invalidated_at is null and invalidated_reason is null)
    or (invalidated_at is not null and invalidated_reason = 'policy_source_changed')
  );

grant update (role, matter_item_id, status, version, updated_at)
  on app.role_assignments to continuity_app;
grant update (invalidated_at, invalidated_reason, version, updated_at)
  on app.disclosure_rehearsals to continuity_app;
