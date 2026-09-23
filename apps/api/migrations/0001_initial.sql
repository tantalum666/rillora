create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'continuity_app') then
    create role continuity_app nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'continuity_auth') then
    create role continuity_auth nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$$;

revoke all on schema public from public;
revoke create on schema public from public;
revoke all on schema app from public;

create or replace function app.current_planner_id()
returns bigint
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('app.current_planner_id', true), '')::bigint
$$;

revoke all on function app.current_planner_id() from public;
grant usage on schema app to continuity_app, continuity_auth;
grant execute on function app.current_planner_id() to continuity_app;

create table app.planners (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  display_name text not null,
  locale text not null default 'en',
  time_zone text not null default 'UTC',
  residence_country_code text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planners_display_name_length check (char_length(display_name) between 1 and 120),
  constraint planners_locale_length check (char_length(locale) between 2 and 35),
  constraint planners_time_zone_length check (char_length(time_zone) between 1 and 80),
  constraint planners_country_code check (
    residence_country_code is null or residence_country_code ~ '^[A-Z]{2}$'
  ),
  constraint planners_status check (status in ('active', 'locked', 'deletion_pending', 'closed'))
);

create table app.auth_sessions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  token_hash bytea not null unique,
  csrf_token_hash bytea not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  constraint auth_sessions_expiry check (expires_at > created_at)
);

create index auth_sessions_planner_id_idx on app.auth_sessions (planner_id);
create index auth_sessions_active_token_idx on app.auth_sessions (token_hash, expires_at)
  where revoked_at is null;

create table app.plans (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null unique references app.planners(id) on delete cascade,
  motivation text,
  status text not null default 'draft',
  policy_version text not null default 'mvp-2026-08-04',
  last_reviewed_at timestamptz,
  review_due_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_id_planner_unique unique (id, planner_id),
  constraint plans_motivation check (
    motivation is null or motivation in (
      'life_change', 'family_responsibility', 'cross_border', 'complex_digital_life',
      'recent_estate_experience', 'general_preparedness', 'other'
    )
  ),
  constraint plans_status check (status in ('draft', 'active', 'needs_review', 'archived')),
  constraint plans_version_positive check (version > 0)
);

create index plans_planner_status_idx on app.plans (planner_id, status);

create table app.people (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  display_name text not null,
  relationship_label text,
  contact_locator_ciphertext bytea,
  contact_locator_key_version text,
  status text not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint people_id_planner_unique unique (id, planner_id),
  constraint people_display_name_length check (char_length(display_name) between 1 and 120),
  constraint people_relationship_length check (
    relationship_label is null or char_length(relationship_label) <= 120
  ),
  constraint people_contact_cipher_pair check (
    (contact_locator_ciphertext is null and contact_locator_key_version is null)
    or (contact_locator_ciphertext is not null and contact_locator_key_version is not null)
  ),
  constraint people_status check (status in ('draft', 'invited', 'confirmed', 'revoked', 'archived')),
  constraint people_version_positive check (version > 0)
);

create index people_planner_status_idx on app.people (planner_id, status, id);

create table app.matter_items (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  category text not null,
  title text not null,
  institution_name text,
  account_hint text,
  value_band text not null default 'unknown',
  currency_code text,
  location_hint text,
  importance text not null default 'important',
  desired_outcome text not null default 'undecided',
  status text not null default 'draft',
  review_due_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint matter_items_id_planner_unique unique (id, planner_id),
  constraint matter_items_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint matter_items_category check (
    category in ('financial_asset', 'debt', 'account', 'device', 'document', 'subscription', 'crypto_asset')
  ),
  constraint matter_items_title_length check (char_length(title) between 1 and 120),
  constraint matter_items_institution_length check (
    institution_name is null or char_length(institution_name) <= 160
  ),
  constraint matter_items_account_hint_length check (
    account_hint is null or char_length(account_hint) <= 160
  ),
  constraint matter_items_location_hint_length check (
    location_hint is null or char_length(location_hint) <= 500
  ),
  constraint matter_items_value_band check (
    value_band in ('none', 'under_1k', '1k_10k', '10k_100k', '100k_plus', 'unknown')
  ),
  constraint matter_items_currency check (
    currency_code is null or currency_code ~ '^[A-Z]{3}$'
  ),
  constraint matter_items_importance check (importance in ('standard', 'important', 'critical')),
  constraint matter_items_outcome check (
    desired_outcome in (
      'notify', 'transfer_request', 'close', 'delete_request', 'memorialize',
      'delay_disclosure', 'never_disclose', 'undecided'
    )
  ),
  constraint matter_items_status check (status in ('draft', 'ready', 'needs_review', 'archived')),
  constraint matter_items_version_positive check (version > 0)
);

create index matter_items_planner_status_id_idx on app.matter_items (planner_id, status, id);
create index matter_items_plan_id_idx on app.matter_items (plan_id);
create index matter_items_review_due_idx on app.matter_items (planner_id, review_due_at)
  where archived_at is null;

create table app.role_assignments (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  person_id bigint not null,
  matter_item_id bigint,
  role text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint role_assignments_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint role_assignments_person_fk foreign key (person_id, planner_id)
    references app.people(id, planner_id) on delete cascade,
  constraint role_assignments_matter_fk foreign key (matter_item_id, planner_id)
    references app.matter_items(id, planner_id) on delete cascade,
  constraint role_assignments_role check (role in ('trusted_contact', 'executor', 'recipient')),
  constraint role_assignments_status check (status in ('draft', 'invited', 'accepted', 'revoked'))
);

create unique index role_assignments_scope_unique_idx on app.role_assignments (
  planner_id, person_id, role, coalesce(matter_item_id, 0)
);
create index role_assignments_plan_id_idx on app.role_assignments (plan_id);
create index role_assignments_person_id_idx on app.role_assignments (person_id);
create index role_assignments_matter_item_id_idx on app.role_assignments (matter_item_id)
  where matter_item_id is not null;

create table app.invitations (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  person_id bigint not null,
  role_assignment_id bigint not null references app.role_assignments(id) on delete cascade,
  delivery_channel text not null,
  token_hash bytea unique,
  status text not null default 'pending',
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_person_fk foreign key (person_id, planner_id)
    references app.people(id, planner_id) on delete cascade,
  constraint invitations_delivery_channel check (delivery_channel in ('simulation', 'email')),
  constraint invitations_status check (status in ('pending', 'accepted', 'expired', 'revoked')),
  constraint invitations_real_token check (
    delivery_channel = 'simulation'
    or (token_hash is not null and expires_at is not null)
  )
);

create index invitations_planner_status_idx on app.invitations (planner_id, status, id);
create index invitations_person_id_idx on app.invitations (person_id);
create index invitations_role_assignment_id_idx on app.invitations (role_assignment_id);

create table app.official_setup_checks (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  provider_key text not null,
  policy_version text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_setup_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint official_setup_provider check (
    provider_key in ('apple', 'google', 'meta', 'github', 'password_manager')
  ),
  constraint official_setup_completed_time check (
    (completed = false and completed_at is null) or completed = true
  ),
  constraint official_setup_version_positive check (version > 0),
  constraint official_setup_plan_provider_unique unique (plan_id, provider_key)
);

create index official_setup_planner_id_idx on app.official_setup_checks (planner_id);
create index official_setup_plan_id_idx on app.official_setup_checks (plan_id);

create table app.claim_simulations (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  life_event text not null,
  policy_version text not null,
  policy_snapshot jsonb not null,
  completed_at timestamptz not null default now(),
  constraint claim_simulations_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint claim_simulations_life_event check (life_event in ('death', 'incapacity', 'missing')),
  constraint claim_simulations_snapshot_object check (jsonb_typeof(policy_snapshot) = 'object')
);

create index claim_simulations_planner_completed_idx on app.claim_simulations (
  planner_id, completed_at desc, id desc
);
create index claim_simulations_plan_id_idx on app.claim_simulations (plan_id);

create table app.export_packages (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  format text not null,
  status text not null default 'previewed',
  object_locator_ciphertext bytea,
  object_locator_key_version text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint export_packages_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint export_packages_format check (format in ('start_here_json', 'printable_pdf')),
  constraint export_packages_status check (status in ('previewed', 'generating', 'ready', 'expired', 'deleted')),
  constraint export_packages_locator_pair check (
    (object_locator_ciphertext is null and object_locator_key_version is null)
    or (object_locator_ciphertext is not null and object_locator_key_version is not null)
  )
);

create index export_packages_planner_created_idx on app.export_packages (
  planner_id, created_at desc, id desc
);
create index export_packages_plan_id_idx on app.export_packages (plan_id);

create table app.audit_events (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  actor_type text not null,
  action text not null,
  resource_type text not null,
  resource_public_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_events_actor check (actor_type in ('planner', 'trusted_contact', 'operator', 'system')),
  constraint audit_events_action_length check (char_length(action) between 1 and 100),
  constraint audit_events_resource_length check (char_length(resource_type) between 1 and 80),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index audit_events_planner_cursor_idx on app.audit_events (
  planner_id, occurred_at desc, id desc
);

alter table app.planners enable row level security;
alter table app.planners force row level security;
create policy planners_tenant_isolation on app.planners
  using (id = app.current_planner_id())
  with check (id = app.current_planner_id());

alter table app.plans enable row level security;
alter table app.plans force row level security;
create policy plans_tenant_isolation on app.plans
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.people enable row level security;
alter table app.people force row level security;
create policy people_tenant_isolation on app.people
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.matter_items enable row level security;
alter table app.matter_items force row level security;
create policy matter_items_tenant_isolation on app.matter_items
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.role_assignments enable row level security;
alter table app.role_assignments force row level security;
create policy role_assignments_tenant_isolation on app.role_assignments
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.invitations enable row level security;
alter table app.invitations force row level security;
create policy invitations_tenant_isolation on app.invitations
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.official_setup_checks enable row level security;
alter table app.official_setup_checks force row level security;
create policy official_setup_tenant_isolation on app.official_setup_checks
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.claim_simulations enable row level security;
alter table app.claim_simulations force row level security;
create policy claim_simulations_tenant_isolation on app.claim_simulations
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.export_packages enable row level security;
alter table app.export_packages force row level security;
create policy export_packages_tenant_isolation on app.export_packages
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.audit_events enable row level security;
alter table app.audit_events force row level security;
create policy audit_events_read on app.audit_events
  for select using (planner_id = app.current_planner_id());
create policy audit_events_append on app.audit_events
  for insert with check (planner_id = app.current_planner_id());

grant select, update on app.planners to continuity_app;
grant select, insert, update, delete on
  app.plans,
  app.people,
  app.matter_items,
  app.role_assignments,
  app.invitations,
  app.official_setup_checks,
  app.claim_simulations,
  app.export_packages
to continuity_app;
grant select, insert on app.audit_events to continuity_app;
grant usage, select on all sequences in schema app to continuity_app;

grant select on app.planners, app.auth_sessions to continuity_auth;
grant update (last_seen_at, revoked_at) on app.auth_sessions to continuity_auth;

alter default privileges in schema app revoke all on tables from public;
alter default privileges in schema app revoke all on sequences from public;
alter default privileges in schema app revoke all on functions from public;
