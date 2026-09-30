create table app.matter_create_receipts (
  planner_id bigint not null references app.planners(id) on delete cascade,
  request_id uuid not null,
  request_sha256 bytea not null check (octet_length(request_sha256)=32),
  matter_public_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (planner_id, request_id)
);
alter table app.matter_create_receipts enable row level security;
alter table app.matter_create_receipts force row level security;
create policy matter_create_owner on app.matter_create_receipts to continuity_app
  using (planner_id=app.current_planner_id()) with check (planner_id=app.current_planner_id());
grant select, insert on app.matter_create_receipts to continuity_app;
