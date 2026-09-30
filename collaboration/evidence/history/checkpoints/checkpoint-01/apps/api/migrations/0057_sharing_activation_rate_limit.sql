-- Bound automated recipient rotation without limiting privacy/revocation/export.
alter table app.commerce_runtime_policy add column sharing_daily_activation_limit integer not null default 20
  check(sharing_daily_activation_limit between 1 and 100);
grant create on schema app to continuity_share_service;
create function app.sharing_activation_rate_limit(p_owner bigint) returns void
language plpgsql security definer set search_path='' as $$
declare used integer; maximum integer;
begin
 if not app.sharing_limits_enabled(p_owner) then return; end if;
 select sharing_daily_activation_limit into maximum from app.commerce_runtime_policy where singleton;
 select count(*) into used from app.audit_events where planner_id=p_owner
   and action in ('sharing.invitation_created','sharing.updates_resumed','sharing.free_recipient_selected')
   and occurred_at>statement_timestamp()-interval '24 hours';
 if used>=maximum then raise exception 'sharing_change_rate_limited'; end if;
end $$;
revoke all on function app.sharing_activation_rate_limit(bigint) from public;
alter function app.sharing_activation_rate_limit(bigint) owner to continuity_share_service;
grant select(planner_id,action,occurred_at) on app.audit_events to continuity_share_service;
create policy sharing_rate_read on app.audit_events for select to continuity_share_service using(true);
create or replace function app.sharing_reserve(p_connection bigint default null) returns bigint
language plpgsql security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); e record; used integer; lim integer;
begin
 if actor is null then raise exception 'sharing_unauthorized'; end if;
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||actor::text,0));
 if p_connection is not null and not exists(select 1 from app.sharing_connections where id=p_connection and planner_id=actor)
 then raise exception 'sharing_unauthorized'; end if;
 select * into e from app.sharing_family_grant(actor); lim:=coalesce(e.allowance,1);
 if p_connection is null or app.sharing_connection_mode(p_connection)<>'live' then perform app.sharing_activation_rate_limit(actor); end if;
 if app.sharing_limits_enabled(actor) then
   select count(*) into used from app.sharing_connections c join app.people p on p.id=c.person_id
   where c.planner_id=actor and c.id is distinct from p_connection and p.status not in ('revoked','archived')
     and (c.status='accepted' or (c.status='pending' and c.invitation_expires_at>statement_timestamp()))
     and app.sharing_connection_mode(c.id)='live';
   if used>=lim then raise exception 'sharing_limit_reached'; end if;
 end if;
 return e.id;
end $$;

create or replace function app.sharing_select_live(p_public uuid,p_version integer,p_access_version integer,p_free boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); c app.sharing_connections%rowtype; eid bigint; current_version integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||actor::text,0));
 select * into c from app.sharing_connections where public_id=p_public and planner_id=actor and status<>'revoked' for update;
 if not found or c.version<>p_version or (c.status='pending' and c.invitation_expires_at<=statement_timestamp())
 then raise exception 'sharing_changed'; end if;
 select coalesce((select version from app.sharing_preferences where planner_id=actor),0) into current_version;
 if current_version<>p_access_version then raise exception 'sharing_changed'; end if;
 perform app.sharing_activation_rate_limit(actor);
 if p_free then
   insert into app.sharing_preferences(planner_id,free_connection_id) values(actor,c.id)
   on conflict(planner_id) do update set free_connection_id=c.id,version=app.sharing_preferences.version+1;
   perform app.sharing_reserve(c.id);
 else
   eid:=app.sharing_reserve(c.id);
   if eid is null then raise exception 'sharing_family_required'; end if;
 end if;
 update app.sharing_connections set live_entitlement_id=coalesce(eid,live_entitlement_id),version=version+1,updated_at=now() where id=c.id;
 insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
 values(actor,'planner',case when p_free then 'sharing.free_recipient_selected' else 'sharing.updates_resumed' end,
   'sharing_connection',c.public_id,jsonb_build_object('purpose','planner_directed'));
 return app.sharing_access_status();
end $$;


revoke create on schema app from continuity_share_service;
