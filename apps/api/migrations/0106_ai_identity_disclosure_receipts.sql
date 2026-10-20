-- Optional identity disclosure is separate from selected matter access and existing account terms.
create table app.ai_identity_disclosures (
 connection_id bigint primary key,
 planner_id bigint not null,
 consent_version text not null check(consent_version='ai-verified-email-2026-10-18-1'),
 fields text[] not null check(fields=array['verified_email']::text[]),
 accepted_at timestamptz not null default now(),
 foreign key(connection_id,planner_id) references app.ai_connections(id,planner_id) on delete cascade
);
revoke all on app.ai_identity_disclosures from public;
alter table app.ai_identity_disclosures enable row level security;
alter table app.ai_identity_disclosures force row level security;
create policy ai_identity_disclosure_owner on app.ai_identity_disclosures to continuity_app
 using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
grant select,insert on app.ai_identity_disclosures to continuity_app;
