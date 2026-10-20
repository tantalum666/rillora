-- Optional next-version notice of an arrangement. There is deliberately no
-- matter, grant, package, key or release-condition column in this relationship.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='continuity_future_notice_service') then
  create role continuity_future_notice_service nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
 end if;
 if exists(select 1 from pg_roles where rolname='continuity_future_notice_service'
  and (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls or rolreplication))
 then raise exception 'unsafe future notice role'; end if;
end $$;
grant continuity_future_notice_service to current_user;
grant usage,create on schema app to continuity_future_notice_service;
grant execute on function app.current_planner_id() to continuity_future_notice_service;

create table app.future_recipient_notices (
 id bigint generated always as identity primary key,
 public_id uuid not null default gen_random_uuid() unique,
 planner_id bigint not null references app.planners(id) on delete cascade,
 person_id bigint not null,
 recipient_email_hash bytea not null check(octet_length(recipient_email_hash)=32),
 recipient_email_label text not null check(char_length(recipient_email_label) between 3 and 260),
 invitation_token_hash bytea not null unique check(octet_length(invitation_token_hash)=32),
 invitation_expires_at timestamptz not null,
 status text not null default 'pending' check(status in('pending','acknowledged','declined','revoked')),
 recipient_planner_id bigint references app.planners(id) on delete cascade,
 acknowledged_at timestamptz,
 closed_at timestamptz,
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(person_id,planner_id) references app.people(id,planner_id) on delete cascade,
 check(recipient_planner_id is null or recipient_planner_id<>planner_id),
 check(status<>'acknowledged' or (recipient_planner_id is not null and acknowledged_at is not null)),
 check(invitation_expires_at>created_at)
);
create unique index future_notice_active_person on app.future_recipient_notices(planner_id,person_id)
 where status in('pending','acknowledged');
create unique index future_notice_active_email on app.future_recipient_notices(planner_id,recipient_email_hash)
 where status in('pending','acknowledged');
create index future_notice_person_history on app.future_recipient_notices(planner_id,person_id,id desc);
create index future_notice_recipient on app.future_recipient_notices(recipient_planner_id,status,id desc);
create table app.future_notice_handoffs (
 token_hash bytea primary key check(octet_length(token_hash)=32),
 invitation_token_hash bytea not null check(octet_length(invitation_token_hash)=32),
 notice_public_id uuid not null references app.future_recipient_notices(public_id) on delete cascade,
 expires_at timestamptz not null
);
create index future_notice_handoff_expiry on app.future_notice_handoffs(expires_at);
revoke all on app.future_recipient_notices,app.future_notice_handoffs from public;
grant select on app.future_recipient_notices to continuity_app;
grant insert(planner_id,person_id,recipient_email_hash,recipient_email_label,invitation_token_hash,invitation_expires_at)
 on app.future_recipient_notices to continuity_app;
grant update(recipient_email_hash,recipient_email_label,invitation_token_hash,invitation_expires_at,status,closed_at,version,updated_at)
 on app.future_recipient_notices to continuity_app;
grant usage on sequence app.future_recipient_notices_id_seq to continuity_app;
grant select,insert,delete on app.future_notice_handoffs to continuity_auth;
grant select,update on app.future_recipient_notices to continuity_future_notice_service;
grant select(id,public_id,display_name,status) on app.planners to continuity_future_notice_service;
grant select(id,planner_id,status) on app.people to continuity_future_notice_service;
grant insert(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
 on app.audit_events to continuity_future_notice_service;
grant usage on sequence app.audit_events_id_seq to continuity_future_notice_service;
create policy future_notice_identity on app.planners for select to continuity_future_notice_service using(true);
create policy future_notice_person on app.people for select to continuity_future_notice_service using(true);
create policy future_notice_audit on app.audit_events for insert to continuity_future_notice_service with check(true);
alter table app.future_recipient_notices enable row level security;
alter table app.future_recipient_notices force row level security;
create policy future_notice_owner on app.future_recipient_notices to continuity_app
 using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
create policy future_notice_service on app.future_recipient_notices to continuity_future_notice_service using(true) with check(true);
alter table app.future_notice_handoffs enable row level security;
alter table app.future_notice_handoffs force row level security;
create policy future_notice_auth on app.future_notice_handoffs to continuity_auth using(true) with check(true);
create policy runtime_authority on app.future_recipient_notices as restrictive
 using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()));
create policy runtime_authority on app.future_notice_handoffs as restrictive
 using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()));

-- The sender can rotate a pending link or revoke; only the bounded recipient
-- functions below can record acknowledgement or rejection.
create function app.future_notice_owner_guard() returns trigger
language plpgsql set search_path='' as $$
begin
 if current_user='continuity_app' then
  if tg_op='INSERT' and new.status<>'pending' then raise exception 'future_notice_transition_denied'; end if;
  if tg_op='UPDATE' and not (
   (old.status='pending' and new.status='pending') or
   (old.status<>'revoked' and new.status='revoked'
    and (to_jsonb(new)-'status'-'closed_at'-'version'-'updated_at')
      =(to_jsonb(old)-'status'-'closed_at'-'version'-'updated_at'))
  ) then raise exception 'future_notice_transition_denied'; end if;
 end if;
 return new;
end $$;
revoke all on function app.future_notice_owner_guard() from public;
create trigger future_notice_owner_guard before insert or update on app.future_recipient_notices
 for each row execute function app.future_notice_owner_guard();

create function app.future_notice_public_preview(p_hash bytea) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('publicId',n.public_id,'status','pending','expiresAt',n.invitation_expires_at,
   'purpose','future_notice','contentAvailable',false)
 from app.future_recipient_notices n join app.planners p on p.id=n.planner_id
 join app.people person on person.id=n.person_id and person.planner_id=n.planner_id
 where n.invitation_token_hash=p_hash and n.status='pending' and n.invitation_expires_at>now()
  and p.status='active' and person.status not in('revoked','archived')
$$;
alter function app.future_notice_public_preview(bytea) owner to continuity_future_notice_service;
revoke all on function app.future_notice_public_preview(bytea) from public;
grant execute on function app.future_notice_public_preview(bytea) to continuity_auth;

create function app.future_notice_email_scope(p_hash bytea) returns uuid
language sql stable security definer set search_path='' as $$
 select p.public_id from app.future_recipient_notices n join app.planners p on p.id=n.planner_id
 join app.people person on person.id=n.person_id and person.planner_id=n.planner_id
 where n.invitation_token_hash=p_hash and p.status='active' and person.status not in('revoked','archived')
  and (n.status='pending' or (n.status='acknowledged' and n.recipient_planner_id=app.current_planner_id()))
$$;
alter function app.future_notice_email_scope(bytea) owner to continuity_future_notice_service;
revoke all on function app.future_notice_email_scope(bytea) from public;
grant execute on function app.future_notice_email_scope(bytea) to continuity_app;

create function app.future_notice_review(p_hash bytea,p_email bytea) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare n app.future_recipient_notices%rowtype; actor bigint:=app.current_planner_id(); owner_name text;
begin
 if actor is null then return jsonb_build_object('error','authentication_required'); end if;
 select * into n from app.future_recipient_notices where invitation_token_hash=p_hash;
 if not found or n.status not in('pending','acknowledged')
  or not exists(select 1 from app.people where id=n.person_id and planner_id=n.planner_id and status not in('revoked','archived'))
 then return jsonb_build_object('error','invitation_unavailable'); end if;
 select display_name into owner_name from app.planners where id=n.planner_id and status='active';
 if not found then return jsonb_build_object('error','invitation_unavailable'); end if;
 if n.planner_id=actor then return jsonb_build_object('error','self_invitation'); end if;
 if n.status='acknowledged' then
  if n.recipient_planner_id<>actor then return jsonb_build_object('error','invitation_unavailable'); end if;
 else
  if n.invitation_expires_at<=now() then return jsonb_build_object('error','invitation_expired'); end if;
  if p_email is null then return jsonb_build_object('error','verified_email_required'); end if;
  if p_email<>n.recipient_email_hash then return jsonb_build_object('error','invitation_account_mismatch'); end if;
 end if;
 return jsonb_build_object('publicId',n.public_id,'ownerName',owner_name,'status',n.status,
  'version',n.version,'purpose','future_notice','contentAvailable',false);
end $$;
alter function app.future_notice_review(bytea,bytea) owner to continuity_future_notice_service;
revoke all on function app.future_notice_review(bytea,bytea) from public;
grant execute on function app.future_notice_review(bytea,bytea) to continuity_app;

create function app.future_notice_respond(p_hash bytea,p_email bytea,p_action text,p_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n app.future_recipient_notices%rowtype; reviewed jsonb; next_status text;
begin
 if p_action not in('acknowledge','decline') then return jsonb_build_object('error','invalid_action'); end if;
 select * into n from app.future_recipient_notices where invitation_token_hash=p_hash for update;
 if not found then return jsonb_build_object('error','invitation_unavailable'); end if;
 reviewed:=app.future_notice_review(p_hash,p_email);
 if reviewed ? 'error' then return reviewed; end if;
 if n.status='acknowledged' and p_action='acknowledge' then
  return jsonb_build_object('publicId',n.public_id,'status',n.status,'version',n.version,'contentAvailable',false);
 end if;
 if n.version<>p_version then return jsonb_build_object('error','future_notice_changed'); end if;
 next_status:=case when p_action='acknowledge' then 'acknowledged' else 'declined' end;
 update app.future_recipient_notices set status=next_status,recipient_planner_id=app.current_planner_id(),
  acknowledged_at=case when p_action='acknowledge' then now() else acknowledged_at end,
  closed_at=case when p_action='decline' then now() else null end,version=version+1,updated_at=now()
 where id=n.id;
 insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
 values(n.planner_id,'trusted_contact','future_notice.'||next_status,'future_notice',n.public_id,
  '{"purpose":"future_notice","contentAvailable":false}'::jsonb);
 return jsonb_build_object('publicId',n.public_id,'status',next_status,'version',n.version+1,'contentAvailable',false);
end $$;
alter function app.future_notice_respond(bytea,bytea,text,integer) owner to continuity_future_notice_service;
revoke all on function app.future_notice_respond(bytea,bytea,text,integer) from public;
grant execute on function app.future_notice_respond(bytea,bytea,text,integer) to continuity_app;

create function app.future_notices_received() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(item order by id desc),'[]'::jsonb) from (
  select n.id,jsonb_build_object('publicId',n.public_id,'ownerName',p.display_name,'status','acknowledged',
   'version',n.version,'purpose','future_notice','contentAvailable',false) as item
  from app.future_recipient_notices n join app.planners p on p.id=n.planner_id
  join app.people person on person.id=n.person_id and person.planner_id=n.planner_id
  where n.recipient_planner_id=app.current_planner_id() and n.status='acknowledged'
   and p.status='active' and person.status not in('revoked','archived')
  order by n.id desc limit 101
 ) bounded
$$;
alter function app.future_notices_received() owner to continuity_future_notice_service;
revoke all on function app.future_notices_received() from public;
grant execute on function app.future_notices_received() to continuity_app;

create function app.future_notice_leave(p_id uuid,p_version integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n app.future_recipient_notices%rowtype;
begin
 select * into n from app.future_recipient_notices
  where public_id=p_id and recipient_planner_id=app.current_planner_id() and status='acknowledged' for update;
 if not found or n.version<>p_version then return false; end if;
 update app.future_recipient_notices set status='declined',closed_at=now(),version=version+1,updated_at=now() where id=n.id;
 insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
 values(n.planner_id,'trusted_contact','future_notice.left','future_notice',n.public_id,'{"contentAvailable":false}'::jsonb);
 return true;
end $$;
alter function app.future_notice_leave(uuid,integer) owner to continuity_future_notice_service;
revoke all on function app.future_notice_leave(uuid,integer) from public;
grant execute on function app.future_notice_leave(uuid,integer) to continuity_app;

create function app.revoke_future_notices_for_person() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status in('archived','revoked') and old.status not in('archived','revoked') then
  update app.future_recipient_notices set status='revoked',closed_at=now(),version=version+1,updated_at=now()
   where person_id=new.id and planner_id=new.planner_id and status in('pending','acknowledged');
 end if;
 return null;
end $$;
alter function app.revoke_future_notices_for_person() owner to continuity_future_notice_service;
revoke all on function app.revoke_future_notices_for_person() from public;
create trigger revoke_future_notices_for_person after update of status on app.people
 for each row execute function app.revoke_future_notices_for_person();
revoke create on schema app from continuity_future_notice_service;

-- Restore cannot resurrect an old acknowledgement or invitation after revocation.
alter table app.recovery_controls drop constraint recovery_controls_kind_check;
alter table app.recovery_controls add constraint recovery_controls_kind_check
 check(kind in('account','connection','matter','person','free_slot','unreconciled_access','retention_hold','ai_connection','future_notice'));
create function app.recovery_capture_future_notice() returns trigger
language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 if not(select enforced from app.recovery_policy where singleton) or app.recovery_replaying() then return null; end if;
 pid:=case when tg_op='DELETE' then old.public_id else new.public_id end;
 insert into app.recovery_controls(entity_key,kind,entity_public_id)
 values('future_notice:'||pid::text,'future_notice',pid)
 on conflict(entity_key) do update set revision=nextval('app.recovery_revision_seq'),
  transaction_id=txid_current(),published=false,recorded_at=clock_timestamp();
 return null;
end $$;
alter function app.recovery_capture_future_notice() owner to continuity_recovery_service;
revoke all on function app.recovery_capture_future_notice() from public;
create trigger recovery_future_notice after insert or update or delete on app.future_recipient_notices
 for each row execute function app.recovery_capture_future_notice();
alter function app.recovery_pending() rename to recovery_pending_before_future_notices;
revoke all on function app.recovery_pending_before_future_notices() from public,continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce,continuity_deletion_worker;
create function app.recovery_pending() returns jsonb
language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(case when item->>'kind'='future_notice'
  then jsonb_set(item,'{facts}','{"revokeOnRestore":true}'::jsonb) else item end order by ordinal),'[]'::jsonb)
 from jsonb_array_elements(app.recovery_pending_before_future_notices()) with ordinality as entries(item,ordinal)
$$;
alter function app.recovery_pending() owner to continuity_recovery_service;
revoke all on function app.recovery_pending() from public;
grant execute on function app.recovery_pending() to continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce,continuity_deletion_worker;
grant select,update(status,closed_at,version) on app.future_recipient_notices to continuity_recovery_service;
grant select,delete on app.future_notice_handoffs to continuity_recovery_service;
create policy recovery_future_notices on app.future_recipient_notices to continuity_recovery_service using(true) with check(true);
create policy recovery_future_handoffs on app.future_notice_handoffs to continuity_recovery_service using(true);
