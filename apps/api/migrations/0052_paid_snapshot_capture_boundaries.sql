grant create on schema app to continuity_share_service;
create or replace function app.sharing_capture(p_connection bigint) returns void
language plpgsql security definer set search_path='' as $$
declare c app.sharing_connections%rowtype; e record;
begin
 select * into c from app.sharing_connections where id=p_connection;
 if not found or c.status<>'accepted' then return; end if;
 select * into e from app.sharing_family_grant(c.planner_id);
 -- Never make a cutoff copy from post-expiry values, even if a job/webhook is late.
 if not found or e.cutoff_at<=clock_timestamp() or (c.live_entitlement_id is distinct from e.id and not exists(select 1 from app.sharing_preferences p where p.planner_id=c.planner_id and p.free_connection_id=c.id)) then return; end if;
 insert into app.sharing_saved_items(grant_id,planner_id,entitlement_id,detail_level,fields,saved_at,cutoff_at)
 select g.id,c.planner_id,e.id,g.detail_level,app.sharing_project_fields(jsonb_strip_nulls(
   m.details || jsonb_build_object('title',m.title,'category',m.category,'institutionName',m.institution_name,
     'locationHint',m.location_hint,'desiredOutcome',m.desired_outcome,'accountHint',m.account_hint,
     'valueBand',m.value_band,'currencyCode',m.currency_code,'importance',m.importance,'notes',m.notes)
     ),g.detail_level),clock_timestamp(),e.cutoff_at
 from app.sharing_grants g join app.matter_items m on m.id=g.matter_item_id and m.planner_id=g.planner_id
 where g.connection_id=c.id and g.planner_id=c.planner_id and m.archived_at is null and m.desired_outcome<>'never_disclose'
 on conflict(grant_id) do update set entitlement_id=excluded.entitlement_id,detail_level=excluded.detail_level,
   fields=excluded.fields,saved_at=excluded.saved_at,cutoff_at=excluded.cutoff_at;
end $$;


create or replace function app.sharing_connection_after() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if (tg_op='INSERT' or new.invitation_expires_at is distinct from old.invitation_expires_at) and new.status='pending' and new.invitation_expires_at>statement_timestamp()
   and not exists(select 1 from app.sharing_family_grant(new.planner_id)) then
   insert into app.sharing_preferences(planner_id,free_connection_id) values(new.planner_id,new.id)
   on conflict(planner_id) do update set free_connection_id=excluded.free_connection_id,version=app.sharing_preferences.version+1
   where app.sharing_preferences.free_connection_id is null or not exists(select 1 from app.sharing_connections c
     where c.id=app.sharing_preferences.free_connection_id and (c.status='accepted' or
       (c.status='pending' and c.invitation_expires_at>statement_timestamp())));
 end if;
 if new.status='revoked' then
   delete from app.sharing_saved_items s using app.sharing_grants g where s.grant_id=g.id and g.connection_id=new.id;
   update app.sharing_preferences set free_connection_id=null,version=version+1 where free_connection_id=new.id;
 else perform app.sharing_capture(new.id); end if;
 return new;
end $$;

create function app.sharing_entitlement_after() returns trigger
language plpgsql security definer set search_path='' as $$
declare c record;
begin
 if new.capability_code<>'trusted_people_multiple' then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||new.planner_id::text,0));
 if new.revoked_at is not null or new.expires_at<=statement_timestamp() then
   update app.sharing_saved_items set cutoff_at=least(cutoff_at,new.expires_at,coalesce(new.revoked_at,new.expires_at)) where entitlement_id=new.id;
 else
   for c in select conn.id from app.sharing_connections conn
     where conn.planner_id=new.planner_id and conn.status='accepted'
       and (conn.live_entitlement_id=new.id or exists(select 1 from app.sharing_preferences p
         where p.planner_id=new.planner_id and p.free_connection_id=conn.id))
   loop perform app.sharing_capture(c.id); end loop;
 end if;
 return new;
end $$;
revoke all on function app.sharing_entitlement_after() from public;
alter function app.sharing_entitlement_after() owner to continuity_share_service;
create trigger sharing_entitlement_after after insert or update on app.commerce_entitlement_grants
 for each row execute function app.sharing_entitlement_after();
revoke create on schema app from continuity_share_service;
