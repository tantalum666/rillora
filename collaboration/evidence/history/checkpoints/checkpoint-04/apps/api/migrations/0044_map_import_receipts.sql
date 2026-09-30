create table app.map_import_receipts (
  planner_id bigint not null references app.planners(id) on delete cascade,
  source_sha256 bytea not null check (octet_length(source_sha256)=32),
  matter_count integer not null,
  person_count integer not null,
  created_at timestamptz not null default now(),
  primary key (planner_id, source_sha256)
);
alter table app.map_import_receipts enable row level security;
alter table app.map_import_receipts force row level security;
create policy map_import_owner on app.map_import_receipts to continuity_app
  using (planner_id=app.current_planner_id()) with check (planner_id=app.current_planner_id());
grant select, insert on app.map_import_receipts to continuity_app;
