-- Complete migration/maintenance behavior without rewriting the installed schema.
grant execute on function app.content_migration_active() to continuity_content_service;

do $$ declare definition text; begin
 select pg_get_functiondef('app.content_key_for_write(text,uuid,boolean)'::regprocedure) into definition;
 definition:=replace(definition,$needle$ perform pg_advisory_xact_lock(hashtextextended('content-key:'||target.owner_id::text,0));$needle$,
  $replacement$ perform pg_advisory_xact_lock(hashtextextended('sharing:'||target.owner_id::text,0)); perform pg_advisory_xact_lock(hashtextextended('content-key:'||target.owner_id::text,0));$replacement$);
 execute definition;
 select pg_get_functiondef('app.content_register_key(text,uuid,uuid,text,text,bytea,boolean)'::regprocedure) into definition;
 definition:=replace(definition,$needle$ perform pg_advisory_xact_lock(hashtextextended('content-key:'||target.owner_id::text,0));$needle$,
  $replacement$ perform pg_advisory_xact_lock(hashtextextended('sharing:'||target.owner_id::text,0)); perform pg_advisory_xact_lock(hashtextextended('content-key:'||target.owner_id::text,0));$replacement$);
 execute definition;
 select pg_get_functiondef('app.content_write_target(text,uuid,boolean)'::regprocedure) into definition;
 definition:=replace(definition,$needle$where id=actor and status='active'$needle$,$replacement$where id=actor and (status='active' or app.content_migration_active())$replacement$);
 execute definition;
 select pg_get_functiondef('app.content_read_values(uuid[],boolean)'::regprocedure) into definition;
 definition:=replace(definition,$needle$where id=actor and status='active'$needle$,$replacement$where id=actor and (status='active' or app.content_migration_active())$replacement$);
 definition:=replace(definition,$needle$p.status='active' and (v.planner_id=actor$needle$,$replacement$(p.status='active' or (v.planner_id=actor and app.content_migration_active())) and (v.planner_id=actor$replacement$);
 execute definition;
end $$;

-- A brief orphan grace period preserves in-flight readers. The periodic sweep
-- removes abandoned values without requiring the original owner to return.
create or replace function app.content_prune_unused() returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 delete from app.private_content_values where public_id in (
  select public_id from app.private_content_values v where planner_id=app.current_planner_id()
   and created_at<now()-interval '15 minutes'
   and not exists(select 1 from app.content_used_references(app.current_planner_id()) ref where ref=v.public_id)
  order by created_at limit 2000
 );
 get diagnostics n=row_count; return n;
end $$;
alter function app.content_prune_unused() owner to continuity_content_service;

alter table app.private_content_policy add column orphan_cursor bigint not null default 0;
grant update(orphan_cursor) on app.private_content_policy to continuity_content_service;
create function app.content_sweep_orphans() returns integer
language plpgsql security definer set search_path='' as $$
declare owner bigint; n integer; total integer:=0; cursor_id bigint;
begin
 select orphan_cursor into cursor_id from app.private_content_policy where singleton for update;
 if not exists(select 1 from app.private_content_values where planner_id>cursor_id and created_at<now()-interval '15 minutes') then cursor_id:=0; end if;
 for owner in select distinct planner_id from app.private_content_values
  where planner_id>cursor_id and created_at<now()-interval '15 minutes' order by planner_id limit 100 loop
  delete from app.private_content_values where public_id in (
   select public_id from app.private_content_values v where planner_id=owner
    and created_at<now()-interval '15 minutes'
    and not exists(select 1 from app.content_used_references(owner) ref where ref=v.public_id)
   order by created_at limit 2000
  );
  get diagnostics n=row_count; total:=total+n;
  cursor_id:=owner;
 end loop;
 update app.private_content_policy set orphan_cursor=cursor_id where singleton;
 return total;
end $$;
revoke all on function app.content_sweep_orphans() from public;
grant execute on function app.content_sweep_orphans() to continuity_app;
alter function app.content_sweep_orphans() owner to continuity_content_service;
