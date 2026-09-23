-- Direct sharing is separate from role policy and event-conditioned release.
alter table app.auth_sessions add column verified_email_hash bytea;
alter table app.auth_sessions add constraint auth_sessions_email_hash_size
  check (verified_email_hash is null or octet_length(verified_email_hash) = 32);
grant select (verified_email_hash), insert (verified_email_hash) on app.auth_sessions to continuity_auth;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'continuity_share_service') then
    create role continuity_share_service nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end $$;
grant continuity_share_service to current_user;
grant usage on schema app to continuity_share_service;
grant create on schema app to continuity_share_service;
grant execute on function app.current_planner_id() to continuity_share_service;

create table app.sharing_connections (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  person_id bigint not null,
  recipient_email_hash bytea not null check (octet_length(recipient_email_hash) = 32),
  recipient_email_label text not null check (char_length(recipient_email_label) between 3 and 260),
  invitation_token_hash bytea not null unique check (octet_length(invitation_token_hash) = 32),
  invitation_expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  recipient_planner_id bigint references app.planners(id) on delete cascade,
  accepted_at timestamptz,
  revoked_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, planner_id),
  foreign key (person_id, planner_id) references app.people(id, planner_id) on delete cascade,
  check (recipient_planner_id is null or recipient_planner_id <> planner_id),
  check (status <> 'accepted' or (recipient_planner_id is not null and accepted_at is not null))
);
create unique index sharing_active_person on app.sharing_connections(planner_id, person_id)
  where status <> 'revoked';
create index sharing_recipient on app.sharing_connections(recipient_planner_id, status);

create table app.sharing_grants (
  id bigint generated always as identity primary key,
  planner_id bigint not null,
  connection_id bigint not null,
  matter_item_id bigint not null,
  detail_level text not null check (detail_level in ('name', 'directions', 'details')),
  created_at timestamptz not null default now(),
  foreign key (connection_id, planner_id) references app.sharing_connections(id, planner_id) on delete cascade,
  foreign key (matter_item_id, planner_id) references app.matter_items(id, planner_id) on delete cascade,
  unique (connection_id, matter_item_id)
);
create index sharing_grant_matter on app.sharing_grants(matter_item_id);

create table app.sharing_handoffs (
  token_hash bytea primary key check (octet_length(token_hash) = 32),
  invitation_token_hash bytea not null check (octet_length(invitation_token_hash) = 32),
  connection_public_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sharing_handoff_expiry on app.sharing_handoffs(expires_at);
revoke all on app.sharing_connections, app.sharing_grants, app.sharing_handoffs from public;
grant select, insert, update, delete on app.sharing_connections, app.sharing_grants to continuity_app;
grant usage on sequence app.sharing_connections_id_seq, app.sharing_grants_id_seq to continuity_app;
grant select, insert, delete on app.sharing_handoffs to continuity_auth;

alter table app.sharing_connections enable row level security;
alter table app.sharing_connections force row level security;
create policy sharing_owner on app.sharing_connections to continuity_app
  using (planner_id = app.current_planner_id()) with check (planner_id = app.current_planner_id());
alter table app.sharing_grants enable row level security;
alter table app.sharing_grants force row level security;
create policy sharing_grant_owner on app.sharing_grants to continuity_app
  using (planner_id = app.current_planner_id()) with check (planner_id = app.current_planner_id());

-- This nologin role is never granted to the API runtime. Only the functions
-- below can use its bounded column grants and return a field-level projection.
grant select, update on app.sharing_connections to continuity_share_service;
grant select on app.sharing_grants to continuity_share_service;
create policy sharing_function_service on app.sharing_connections to continuity_share_service using (true) with check (true);
create policy sharing_grant_function_service on app.sharing_grants to continuity_share_service using (true);
grant select (id, public_id, display_name, status) on app.planners to continuity_share_service;
grant select (id, planner_id, status) on app.people to continuity_share_service;
grant select (id, planner_id, public_id, category, title, institution_name, location_hint,
  desired_outcome, account_hint, value_band, currency_code, importance, archived_at)
  on app.matter_items to continuity_share_service;
create policy sharing_function_planners on app.planners for select to continuity_share_service using (true);
create policy sharing_function_people on app.people for select to continuity_share_service using (true);
create policy sharing_function_matters on app.matter_items for select to continuity_share_service using (true);
grant insert (planner_id, actor_type, action, resource_type, resource_public_id, metadata)
  on app.audit_events to continuity_share_service;
grant usage on sequence app.audit_events_id_seq to continuity_share_service;
create policy sharing_function_audit on app.audit_events for insert to continuity_share_service with check (true);

create function app.sharing_invitation_preview(p_hash bytea) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('publicId', c.public_id, 'ownerName', p.display_name,
    'emailHint', c.recipient_email_label,
    'status', case when c.status = 'pending' and c.invitation_expires_at <= now() then 'expired' else c.status end,
    'expiresAt', c.invitation_expires_at)
  from app.sharing_connections c join app.planners p on p.id = c.planner_id
  join app.people person on person.id = c.person_id and person.planner_id = c.planner_id
  where c.invitation_token_hash = p_hash and p.status = 'active'
    and person.status not in ('revoked', 'archived')
$$;
revoke all on function app.sharing_invitation_preview(bytea) from public;
grant execute on function app.sharing_invitation_preview(bytea) to continuity_auth, continuity_app;
alter function app.sharing_invitation_preview(bytea) owner to continuity_share_service;

create function app.accept_sharing_invitation(p_hash bytea, p_email_hash bytea) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c app.sharing_connections%rowtype; actor bigint := app.current_planner_id();
begin
  if actor is null then return jsonb_build_object('error', 'authentication_required'); end if;
  select * into c from app.sharing_connections where invitation_token_hash = p_hash for update;
  if not found or c.status = 'revoked' then return jsonb_build_object('error', 'invitation_unavailable'); end if;
  if not exists (select 1 from app.planners where id = c.planner_id and status = 'active')
     or not exists (select 1 from app.people where id = c.person_id and planner_id = c.planner_id and status not in ('revoked', 'archived'))
  then return jsonb_build_object('error', 'invitation_unavailable'); end if;
  if c.status = 'accepted' then
    if c.recipient_planner_id = actor then return jsonb_build_object('publicId', c.public_id, 'status', 'accepted'); end if;
    return jsonb_build_object('error', 'invitation_unavailable');
  end if;
  if c.invitation_expires_at <= now() then return jsonb_build_object('error', 'invitation_expired'); end if;
  if c.planner_id = actor then return jsonb_build_object('error', 'self_invitation'); end if;
  if p_email_hash is null then return jsonb_build_object('error', 'verified_email_required'); end if;
  if c.recipient_email_hash <> p_email_hash then return jsonb_build_object('error', 'invitation_account_mismatch'); end if;
  update app.sharing_connections set status = 'accepted', recipient_planner_id = actor,
    accepted_at = now(), version = version + 1, updated_at = now() where id = c.id;
  insert into app.audit_events(planner_id, actor_type, action, resource_type, resource_public_id, metadata)
    values(c.planner_id, 'trusted_contact', 'sharing.invitation_accepted', 'sharing_connection', c.public_id,
      jsonb_build_object('readOnly', true, 'purpose', 'planner_directed'));
  return jsonb_build_object('publicId', c.public_id, 'status', 'accepted');
end $$;
revoke all on function app.accept_sharing_invitation(bytea, bytea) from public;
grant execute on function app.accept_sharing_invitation(bytea, bytea) to continuity_app;
alter function app.accept_sharing_invitation(bytea, bytea) owner to continuity_share_service;

create function app.recipient_shared_items() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'connectionPublicId', c.public_id, 'ownerName', owner.display_name,
    'matterPublicId', m.public_id, 'detailLevel', g.detail_level,
    'fields', jsonb_strip_nulls(jsonb_build_object('title', m.title, 'category', m.category)
      || case when g.detail_level in ('directions', 'details') then jsonb_build_object(
        'institutionName', m.institution_name, 'locationHint', m.location_hint, 'desiredOutcome', m.desired_outcome) else '{}'::jsonb end
      || case when g.detail_level = 'details' then jsonb_build_object(
        'accountHint', m.account_hint, 'valueBand', m.value_band, 'currencyCode', m.currency_code, 'importance', m.importance) else '{}'::jsonb end)
  ) order by c.id, g.id), '[]'::jsonb)
  from app.sharing_connections c
  join app.planners owner on owner.id = c.planner_id and owner.status = 'active'
  join app.people person on person.id = c.person_id and person.planner_id = c.planner_id and person.status not in ('revoked', 'archived')
  join app.sharing_grants g on g.connection_id = c.id and g.planner_id = c.planner_id
  join app.matter_items m on m.id = g.matter_item_id and m.planner_id = c.planner_id
  where c.recipient_planner_id = app.current_planner_id() and c.status = 'accepted'
    and m.archived_at is null and m.desired_outcome <> 'never_disclose'
$$;
revoke all on function app.recipient_shared_items() from public;
grant execute on function app.recipient_shared_items() to continuity_app;
alter function app.recipient_shared_items() owner to continuity_share_service;

create function app.recipient_sharing_connections() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('publicId', c.public_id, 'ownerName', p.display_name,
    'acceptedAt', c.accepted_at, 'readOnly', true) order by c.accepted_at desc), '[]'::jsonb)
  from app.sharing_connections c join app.planners p on p.id = c.planner_id and p.status = 'active'
  join app.people person on person.id = c.person_id and person.planner_id = c.planner_id and person.status not in ('revoked', 'archived')
  where c.recipient_planner_id = app.current_planner_id() and c.status = 'accepted'
$$;
revoke all on function app.recipient_sharing_connections() from public;
grant execute on function app.recipient_sharing_connections() to continuity_app;
alter function app.recipient_sharing_connections() owner to continuity_share_service;

create function app.revoke_person_sharing() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('revoked', 'archived') and new.status is distinct from old.status then
    update app.sharing_connections set status = 'revoked', revoked_at = now(),
      version = version + 1, updated_at = now()
      where person_id = new.id and planner_id = new.planner_id and status <> 'revoked';
  end if;
  return new;
end $$;
revoke all on function app.revoke_person_sharing() from public;
alter function app.revoke_person_sharing() owner to continuity_share_service;
create trigger person_sharing_revocation after update of status on app.people
  for each row execute function app.revoke_person_sharing();
revoke create on schema app from continuity_share_service;
