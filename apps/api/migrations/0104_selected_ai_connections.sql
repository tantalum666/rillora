-- Next-version opt-in only. No existing matter, identity, price or billing row is changed.
create table app.ai_connections (
 id bigint generated always as identity primary key,
 public_id uuid not null default gen_random_uuid() unique,
 planner_id bigint not null references app.planners(id) on delete cascade,
 client_id text not null check(char_length(client_id) between 8 and 128),
 consent_version text not null check(consent_version='ai-selected-read-2026-10-15-1'),
 legal_bundle_sha256 bytea not null check(octet_length(legal_bundle_sha256)=32),
 scopes text[] not null check(scopes <@ array['matters:read:summary','readiness:read:scoped']::text[]
   and 'matters:read:summary'=any(scopes) and cardinality(scopes) between 1 and 2),
 selected_count integer not null check(selected_count between 1 and 20),
 token_valid_after bigint not null default ceil(extract(epoch from clock_timestamp()))::bigint,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 version integer not null default 1 check(version>0),
 unique(id,planner_id),
 check(expires_at>created_at and expires_at<=created_at+interval '7 days')
);
create index ai_connection_owner on app.ai_connections(planner_id,id);
create unique index ai_connection_one_current_client on app.ai_connections(planner_id,client_id) where revoked_at is null;
create table app.ai_connection_matters (
 connection_id bigint not null,
 planner_id bigint not null,
 matter_item_id bigint not null,
 matter_version integer not null check(matter_version>0),
 primary key(connection_id,matter_item_id),
 foreign key(connection_id,planner_id) references app.ai_connections(id,planner_id) on delete cascade,
 foreign key(matter_item_id,planner_id) references app.matter_items(id,planner_id) on delete cascade
);
revoke all on app.ai_connections,app.ai_connection_matters from public;
alter table app.ai_connections enable row level security;
alter table app.ai_connections force row level security;
alter table app.ai_connection_matters enable row level security;
alter table app.ai_connection_matters force row level security;
create policy ai_connection_owner on app.ai_connections to continuity_app
 using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
create policy ai_matter_owner on app.ai_connection_matters to continuity_app
 using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
grant select,insert on app.ai_connections,app.ai_connection_matters to continuity_app;
grant delete on app.ai_connection_matters to continuity_app;
grant update(revoked_at,version) on app.ai_connections to continuity_app;
grant usage,select on sequence app.ai_connections_id_seq to continuity_app;

-- Restricting a matter permanently removes it from every existing AI grant.
-- Unarchiving or clearing Never disclose never re-creates an authorization.
create function app.restrict_ai_matter() returns trigger
language plpgsql set search_path='' as $$
begin
 if (new.archived_at is not null and old.archived_at is null)
  or (new.desired_outcome='never_disclose' and old.desired_outcome is distinct from 'never_disclose') then
  with removed as (delete from app.ai_connection_matters where matter_item_id=new.id and planner_id=new.planner_id returning connection_id)
   update app.ai_connections set version=version+1 where id in(select connection_id from removed);
 end if;
 return null;
end $$;
revoke all on function app.restrict_ai_matter() from public;
create trigger restrict_ai_matter after update of archived_at,desired_outcome on app.matter_items
 for each row execute function app.restrict_ai_matter();

-- Restore never grants/re-expands AI access. Any post-snapshot change invalidates
-- the snapshot connection; all AI connections are revoked by the restore runner.
alter table app.recovery_controls drop constraint recovery_controls_kind_check;
alter table app.recovery_controls add constraint recovery_controls_kind_check
 check(kind in('account','connection','matter','person','free_slot','unreconciled_access','retention_hold','ai_connection'));
create function app.recovery_capture_ai() returns trigger
language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 if not (select enforced from app.recovery_policy where singleton) or app.recovery_replaying() then return null; end if;
 pid:=case when tg_op='DELETE' then old.public_id else new.public_id end;
 insert into app.recovery_controls(entity_key,kind,entity_public_id)
 values('ai_connection:'||pid::text,'ai_connection',pid)
 on conflict(entity_key) do update set revision=nextval('app.recovery_revision_seq'),
 transaction_id=txid_current(),published=false,recorded_at=clock_timestamp();
 return null;
end $$;
alter function app.recovery_capture_ai() owner to continuity_recovery_service;
revoke all on function app.recovery_capture_ai() from public;
create trigger recovery_ai_connection after insert or update or delete on app.ai_connections
 for each row execute function app.recovery_capture_ai();

alter function app.recovery_pending() rename to recovery_pending_before_ai;
revoke all on function app.recovery_pending_before_ai() from public,continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce;
create function app.recovery_pending() returns jsonb
language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(case when item->>'kind'='ai_connection'
  then jsonb_set(item,'{facts}','{"revokeOnRestore":true}'::jsonb) else item end order by ordinal),'[]'::jsonb)
 from jsonb_array_elements(app.recovery_pending_before_ai()) with ordinality as entries(item,ordinal)
$$;
alter function app.recovery_pending() owner to continuity_recovery_service;
revoke all on function app.recovery_pending() from public;
grant execute on function app.recovery_pending() to continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce;

grant select,update(revoked_at,version) on app.ai_connections to continuity_recovery_service;
create policy recovery_ai_metadata on app.ai_connections to continuity_recovery_service using(true) with check(true);
