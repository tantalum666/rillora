begin;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'continuity_rehearsal') then
    create role continuity_rehearsal nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$$;

grant usage on schema app to continuity_rehearsal;

create or replace function app.current_rehearsal_id()
returns bigint
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('app.current_rehearsal_id', true), '')::bigint
$$;

revoke all on function app.current_rehearsal_id() from public;
grant execute on function app.current_rehearsal_id() to continuity_rehearsal;

create table app.recipient_rehearsals (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  person_id bigint not null,
  role_assignment_id bigint not null references app.role_assignments(id) on delete cascade,
  invitation_id bigint not null,
  acceptance_token_hash bytea not null unique,
  session_token_hash bytea unique,
  status text not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint recipient_rehearsals_person_fk foreign key (person_id, planner_id)
    references app.people(id, planner_id) on delete cascade,
  constraint recipient_rehearsals_invitation_fk foreign key (invitation_id, planner_id)
    references app.invitations(id, planner_id) on delete cascade,
  constraint recipient_rehearsals_token_lengths check (
    octet_length(acceptance_token_hash) = 32
    and (session_token_hash is null or octet_length(session_token_hash) = 32)
  ),
  constraint recipient_rehearsals_status check (status in ('pending', 'accepted', 'revoked')),
  constraint recipient_rehearsals_state check (
    (status = 'pending' and session_token_hash is null and accepted_at is null and revoked_at is null)
    or (status = 'accepted' and session_token_hash is not null and accepted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  ),
  constraint recipient_rehearsals_expiry check (expires_at > created_at)
);

create unique index recipient_rehearsals_active_person_idx
  on app.recipient_rehearsals (planner_id, person_id)
  where status in ('pending', 'accepted');
create index recipient_rehearsals_planner_created_idx
  on app.recipient_rehearsals (planner_id, created_at desc, id desc);

alter table app.export_packages
  add column recipient_rehearsal_id bigint references app.recipient_rehearsals(id) on delete cascade;
alter table app.export_packages
  add constraint export_packages_recipient_rehearsal_shape check (
    recipient_rehearsal_id is null or format = 'encrypted_start_here_v1'
  );
create index export_packages_recipient_rehearsal_idx
  on app.export_packages (recipient_rehearsal_id) where recipient_rehearsal_id is not null;

alter table app.recipient_rehearsals enable row level security;
alter table app.recipient_rehearsals force row level security;
create policy recipient_rehearsals_planner on app.recipient_rehearsals
  to continuity_app
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());
create policy recipient_rehearsals_acceptance on app.recipient_rehearsals
  for update to continuity_rehearsal
  using (
    status = 'pending'
    and acceptance_token_hash = decode(nullif(current_setting('app.rehearsal_acceptance_hash', true), ''), 'hex')
  )
  with check (
    status = 'accepted'
    and acceptance_token_hash = decode(nullif(current_setting('app.rehearsal_acceptance_hash', true), ''), 'hex')
    and session_token_hash = decode(nullif(current_setting('app.rehearsal_new_session_hash', true), ''), 'hex')
  );
create policy recipient_rehearsals_session on app.recipient_rehearsals
  for select to continuity_rehearsal
  using (
    status = 'accepted'
    and session_token_hash = decode(nullif(current_setting('app.rehearsal_session_hash', true), ''), 'hex')
  );

alter policy recipient_device_keys_tenant_isolation on app.recipient_device_keys to continuity_app;
create policy recipient_device_keys_rehearsal_select on app.recipient_device_keys
  for select to continuity_rehearsal
  using (
    planner_id = app.current_planner_id()
    and invitation_id = (
      select invitation_id from app.recipient_rehearsals
      where id = app.current_rehearsal_id()
    )
  );
create policy recipient_device_keys_rehearsal_insert on app.recipient_device_keys
  for insert to continuity_rehearsal
  with check (
    planner_id = app.current_planner_id()
    and person_id = (
      select person_id from app.recipient_rehearsals
      where id = app.current_rehearsal_id()
    )
    and invitation_id = (
      select invitation_id from app.recipient_rehearsals
      where id = app.current_rehearsal_id()
    )
    and status = 'active'
  );
create policy recipient_device_keys_rehearsal_update on app.recipient_device_keys
  for update to continuity_rehearsal
  using (
    planner_id = app.current_planner_id()
    and invitation_id = (
      select invitation_id from app.recipient_rehearsals
      where id = app.current_rehearsal_id()
    )
  )
  with check (
    planner_id = app.current_planner_id()
    and invitation_id = (
      select invitation_id from app.recipient_rehearsals
      where id = app.current_rehearsal_id()
    )
    and status = 'revoked'
    and revoked_at is not null
  );

alter policy export_packages_tenant_isolation on app.export_packages to continuity_app;
create policy export_packages_rehearsal_read on app.export_packages
  for select to continuity_rehearsal
  using (recipient_rehearsal_id = app.current_rehearsal_id());

alter policy export_key_envelopes_tenant_isolation on app.export_key_envelopes to continuity_app;
create policy export_key_envelopes_rehearsal_read on app.export_key_envelopes
  for select to continuity_rehearsal
  using (
    envelope_kind = 'recipient'
    and export_package_id in (
      select id from app.export_packages where recipient_rehearsal_id = app.current_rehearsal_id()
    )
    and recipient_device_key_id in (
      select id from app.recipient_device_keys where status = 'active'
    )
  );

grant select, insert, update on app.recipient_rehearsals to continuity_app;
grant insert on app.invitations to continuity_app;
grant update (status, updated_at) on app.role_assignments to continuity_app;
grant update (status, accepted_at, revoked_at) on app.invitations to continuity_app;
grant update (status, revoked_at) on app.recipient_device_keys to continuity_app;
grant usage, select on sequence
  app.recipient_rehearsals_id_seq,
  app.invitations_id_seq,
  app.recipient_device_keys_id_seq
to continuity_app;

grant select on app.recipient_rehearsals, app.recipient_device_keys,
  app.export_packages, app.export_key_envelopes to continuity_rehearsal;
grant update (status, session_token_hash, accepted_at) on app.recipient_rehearsals
  to continuity_rehearsal;
grant insert on app.recipient_device_keys to continuity_rehearsal;
grant update (status, revoked_at) on app.recipient_device_keys to continuity_rehearsal;
grant usage, select on sequence app.recipient_device_keys_id_seq to continuity_rehearsal;

commit;
