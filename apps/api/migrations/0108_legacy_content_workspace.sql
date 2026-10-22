-- Additive Web content workspace. No life-event verification or release path.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='continuity_legacy_service') then
  create role continuity_legacy_service nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
 end if;
 if exists(select 1 from pg_roles where rolname='continuity_legacy_service' and
  (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls or rolreplication)) then
  raise exception 'unsafe legacy service role';
 end if;
end $$;
grant continuity_legacy_service to current_user;
grant usage,create on schema app to continuity_legacy_service;
grant execute on function app.current_planner_id() to continuity_legacy_service;
grant execute on function app.recovery_replaying() to continuity_legacy_service;

create table app.legacy_content_assets (
 id bigint generated always as identity primary key,
 public_id uuid not null unique,
 planner_id bigint not null references app.planners(id) on delete cascade,
 request_key uuid not null,
 kind text not null check(kind in('file','voice')),
 media_type text not null check(media_type in('application/pdf','image/jpeg','image/png','image/webp','audio/wav')),
 byte_count integer not null check(byte_count between 1 and 8388608),
 data_header jsonb not null check(data_header->>'format'='rillora-content-v1' and data_header->>'resource'=public_id::text and data_header->>'purpose'='asset'),
 metadata_envelope jsonb not null check(metadata_envelope->'header'->>'format'='rillora-content-v1' and metadata_envelope->'header'->>'resource'=public_id::text and metadata_envelope->'header'->>'purpose'='asset-metadata'),
 version integer not null default 1 check(version>0),
 storage_state text not null default 'uploading' check(storage_state in('uploading','ready')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,planner_id), unique(planner_id,request_key),
 check((kind='voice')=(media_type like 'audio/%')),
 check((metadata_envelope->'header'->>'version')::integer=version),
 check((data_header->>'version')::integer=1)
);
create index legacy_asset_owner on app.legacy_content_assets(planner_id,id);
create table app.legacy_action_packs (
 id bigint generated always as identity primary key,
 public_id uuid not null unique,
 planner_id bigint not null references app.planners(id) on delete cascade,
 person_id bigint,
 intent text not null default 'after_death' check(intent in('current','after_death')),
 body_envelope jsonb not null check(body_envelope->'header'->>'format'='rillora-content-v1' and body_envelope->'header'->>'resource'=public_id::text and body_envelope->'header'->>'purpose'='pack'),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,planner_id),
 foreign key(person_id,planner_id) references app.people(id,planner_id) on delete set null(person_id),
 check((body_envelope->'header'->>'version')::integer=version)
);
create index legacy_pack_owner on app.legacy_action_packs(planner_id,id);
create table app.legacy_pack_matters (
 pack_id bigint not null, planner_id bigint not null, matter_id bigint not null,
 primary key(pack_id,matter_id),
 foreign key(pack_id,planner_id) references app.legacy_action_packs(id,planner_id) on delete cascade,
 foreign key(matter_id,planner_id) references app.matter_items(id,planner_id) on delete cascade
);
create table app.legacy_pack_assets (
 pack_id bigint not null, planner_id bigint not null, asset_id bigint not null,
 primary key(pack_id,asset_id),
 foreign key(pack_id,planner_id) references app.legacy_action_packs(id,planner_id) on delete cascade,
 foreign key(asset_id,planner_id) references app.legacy_content_assets(id,planner_id) on delete cascade
);
-- Every publication is an immutable, explicitly shared current-access snapshot.
-- An after-death intention can never enter this table.
create table app.legacy_pack_publications (
 id bigint generated always as identity primary key,
 public_id uuid not null unique,
 planner_id bigint not null references app.planners(id) on delete cascade,
 pack_id bigint not null,
 connection_id bigint not null,
 pack_version integer not null check(pack_version>0),
 body_envelope jsonb not null,
 published_at timestamptz not null default now(),
 revoked_at timestamptz,
 unique(id,planner_id),
 foreign key(pack_id,planner_id) references app.legacy_action_packs(id,planner_id) on delete cascade,
 foreign key(connection_id,planner_id) references app.sharing_connections(id,planner_id) on delete cascade
);
create unique index legacy_one_publication on app.legacy_pack_publications(pack_id) where revoked_at is null;
create index legacy_publication_connection on app.legacy_pack_publications(connection_id,id);
create table app.legacy_publication_matters (
 publication_id bigint not null, planner_id bigint not null, matter_id bigint not null,
 primary key(publication_id,matter_id),
 foreign key(publication_id,planner_id) references app.legacy_pack_publications(id,planner_id) on delete cascade,
 foreign key(matter_id,planner_id) references app.matter_items(id,planner_id) on delete cascade
);
create table app.legacy_publication_assets (
 publication_id bigint not null, planner_id bigint not null, asset_id bigint not null,
 metadata_version integer not null check(metadata_version>0),
 metadata_envelope jsonb not null,
 primary key(publication_id,asset_id),
 foreign key(publication_id,planner_id) references app.legacy_pack_publications(id,planner_id) on delete cascade,
 foreign key(asset_id,planner_id) references app.legacy_content_assets(id,planner_id) on delete cascade
);
create table app.legacy_task_progress (
 public_id uuid primary key,
 publication_id bigint not null,
 planner_id bigint not null,
 task_public_id uuid not null,
 status text not null check(status in('not_started','ready','submitted','needs_information','completed','stopped')),
 body_envelope jsonb not null,
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),
 reported_by bigint references app.planners(id) on delete set null,
 unique(publication_id,task_public_id),
 foreign key(publication_id,planner_id) references app.legacy_pack_publications(id,planner_id) on delete cascade
);
-- Contains opaque object identities only; survives account deletion until removal.
create table app.legacy_content_cleanup (
 public_id uuid primary key default gen_random_uuid(),
 owner_public_id uuid not null,
 asset_public_id uuid not null,
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 lease_token uuid,
 lease_until timestamptz,
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 unique(owner_public_id,asset_public_id)
);
create index legacy_cleanup_pending on app.legacy_content_cleanup(next_attempt_at) where completed_at is null;

do $$ declare t text; begin
 foreach t in array array['legacy_content_assets','legacy_action_packs','legacy_pack_matters','legacy_pack_assets','legacy_pack_publications','legacy_publication_assets','legacy_publication_matters','legacy_task_progress'] loop
  execute format('revoke all on app.%I from public',t);
  execute format('alter table app.%I enable row level security',t);
  execute format('alter table app.%I force row level security',t);
  execute format('create policy legacy_owner on app.%I to continuity_app using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id())',t);
  execute format('create policy legacy_service on app.%I to continuity_legacy_service using(true) with check(true)',t);
  execute format('create policy runtime_authority on app.%I as restrictive using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()))',t);
  execute format('grant select,insert,delete on app.%I to continuity_app',t);
  execute format('grant select,insert,update,delete on app.%I to continuity_legacy_service',t);
 end loop;
end $$;
grant update(metadata_envelope,version,storage_state,updated_at) on app.legacy_content_assets to continuity_app;
grant update(person_id,intent,body_envelope,version,updated_at) on app.legacy_action_packs to continuity_app;
grant update(revoked_at) on app.legacy_pack_publications to continuity_app;
grant update(status,body_envelope,version,updated_at,reported_by) on app.legacy_task_progress to continuity_app;
grant usage,select on sequence app.legacy_content_assets_id_seq,app.legacy_action_packs_id_seq,app.legacy_pack_publications_id_seq to continuity_app,continuity_legacy_service;
revoke all on app.legacy_content_cleanup from public;
alter table app.legacy_content_cleanup enable row level security;
alter table app.legacy_content_cleanup force row level security;
create policy cleanup_service on app.legacy_content_cleanup to continuity_legacy_service using(true) with check(true);
create policy cleanup_owner on app.legacy_content_cleanup for select to continuity_app using(owner_public_id=(select public_id from app.planners where id=app.current_planner_id()));
create policy runtime_authority on app.legacy_content_cleanup as restrictive using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()));
grant select on app.legacy_content_cleanup to continuity_app;
grant select,insert,update,delete on app.legacy_content_cleanup to continuity_legacy_service;
grant select(id,public_id,status,display_name) on app.planners to continuity_legacy_service;
grant select(id,planner_id,status) on app.people to continuity_legacy_service;
grant select(id,public_id,planner_id,person_id,recipient_planner_id,status) on app.sharing_connections to continuity_legacy_service;
grant select(id,planner_id,archived_at,desired_outcome) on app.matter_items to continuity_legacy_service;
create policy legacy_planner on app.planners for select to continuity_legacy_service using(true);
create policy legacy_person on app.people for select to continuity_legacy_service using(true);
create policy legacy_connection on app.sharing_connections for select to continuity_legacy_service using(true);
create policy legacy_matter on app.matter_items for select to continuity_legacy_service using(true);

create function app.legacy_publication_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare pack app.legacy_action_packs%rowtype;
begin
 if tg_op='UPDATE' then
  if (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at') or (old.revoked_at is not null and new.revoked_at is null)
   then raise exception 'immutable legacy publication'; end if;
  return new;
 end if;
 select * into pack from app.legacy_action_packs where id=new.pack_id and planner_id=new.planner_id;
 if not found or pack.intent<>'current' or pack.person_id is null or pack.version<>new.pack_version or pack.body_envelope<>new.body_envelope
  or not exists(select 1 from app.sharing_connections c join app.people person on person.id=c.person_id
   join app.planners owner on owner.id=c.planner_id
   where c.id=new.connection_id and c.planner_id=new.planner_id and c.person_id=pack.person_id
    and c.status='accepted' and c.recipient_planner_id is not null and owner.status='active' and person.status not in('archived','revoked'))
  or exists(select 1 from app.legacy_pack_matters ref join app.matter_items m on m.id=ref.matter_id
   where ref.pack_id=pack.id and (m.archived_at is not null or m.desired_outcome='never_disclose'))
 then raise exception 'legacy publication unavailable'; end if;
 return new;
end $$;
alter function app.legacy_publication_guard() owner to continuity_legacy_service;
revoke all on function app.legacy_publication_guard() from public;
create trigger legacy_publication_guard before insert or update on app.legacy_pack_publications for each row execute function app.legacy_publication_guard();

create function app.legacy_restrict_matter() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' or new.archived_at is not null or new.desired_outcome='never_disclose' then
  update app.legacy_pack_publications set revoked_at=coalesce(revoked_at,now()) where id in
   (select publication_id from app.legacy_publication_matters where matter_id=old.id and planner_id=old.planner_id);
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
alter function app.legacy_restrict_matter() owner to continuity_legacy_service;
revoke all on function app.legacy_restrict_matter() from public;
create trigger legacy_restrict_matter before delete or update of archived_at,desired_outcome on app.matter_items for each row execute function app.legacy_restrict_matter();
create function app.legacy_restrict_person() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' or new.status in('archived','revoked') then
  update app.legacy_pack_publications set revoked_at=coalesce(revoked_at,now()) where pack_id in
   (select id from app.legacy_action_packs where person_id=old.id and planner_id=old.planner_id);
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
alter function app.legacy_restrict_person() owner to continuity_legacy_service;
revoke all on function app.legacy_restrict_person() from public;
create trigger legacy_restrict_person before delete or update of status on app.people for each row execute function app.legacy_restrict_person();
create function app.legacy_restrict_pack() returns trigger language plpgsql set search_path='' as $$
begin
 if new.person_id is distinct from old.person_id or new.intent is distinct from old.intent then
  update app.legacy_pack_publications set revoked_at=coalesce(revoked_at,now()) where pack_id=old.id and planner_id=old.planner_id;
 end if;
 return new;
end $$;
revoke all on function app.legacy_restrict_pack() from public;
create trigger legacy_restrict_pack before update of person_id,intent on app.legacy_action_packs for each row execute function app.legacy_restrict_pack();

create function app.legacy_queue_asset_removal() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid;
begin
 select public_id into owner_id from app.planners where id=old.planner_id;
 -- A cascading planner DELETE may already have removed the visible parent.
 if owner_id is null then owner_id:=(old.data_header->>'owner')::uuid; end if;
 insert into app.legacy_content_cleanup(owner_public_id,asset_public_id)
  values(owner_id,old.public_id) on conflict(owner_public_id,asset_public_id) do nothing;
 -- A bounded S3 PUT can still complete after a lost response. Wait beyond its
 -- request deadline before removing objects, including account-deletion jobs.
 update app.legacy_content_cleanup set next_attempt_at=greatest(next_attempt_at,old.created_at+interval '5 minutes')
  where owner_public_id=owner_id and asset_public_id=old.public_id;
 update app.legacy_pack_publications set revoked_at=coalesce(revoked_at,now()) where id in
  (select publication_id from app.legacy_publication_assets where asset_id=old.id and planner_id=old.planner_id);
 return old;
end $$;
alter function app.legacy_queue_asset_removal() owner to continuity_legacy_service;
revoke all on function app.legacy_queue_asset_removal() from public;
create trigger legacy_queue_asset_removal before delete on app.legacy_content_assets for each row execute function app.legacy_queue_asset_removal();

create function app.legacy_received(p_publication uuid default null,p_before uuid default null) returns jsonb
language sql stable security definer set search_path='' as $$
 with allowed as (
 select pub.id,pub.public_id,jsonb_build_object('publicId',pub.public_id,'packPublicId',pack.public_id,
  'owner',owner.public_id,'ownerName',owner.display_name,'packVersion',pub.pack_version,'body',pub.body_envelope,
  'publishedAt',pub.published_at) as item
 from app.legacy_pack_publications pub join app.legacy_action_packs pack on pack.id=pub.pack_id
 join app.sharing_connections c on c.id=pub.connection_id and c.planner_id=pub.planner_id
 join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
 join app.planners owner on owner.id=pub.planner_id
 where c.recipient_planner_id=app.current_planner_id() and c.status='accepted' and owner.status='active'
  and person.status not in('revoked','archived') and pub.revoked_at is null and pack.intent='current'
  and pack.person_id=person.id
 ), selected as (select * from allowed where (p_publication is null or public_id=p_publication)
  and (p_before is null or id<(select id from allowed where public_id=p_before)) order by id desc limit 51)
 select coalesce(jsonb_agg(item order by id desc),'[]'::jsonb) from selected
$$;
alter function app.legacy_received(uuid,uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_received(uuid,uuid) from public;
grant execute on function app.legacy_received(uuid,uuid) to continuity_app;
create function app.legacy_publication_state(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('revision',coalesce((select sum(version)::text from app.legacy_task_progress where publication_id=pub.id),'0'))
 from app.legacy_pack_publications pub where pub.public_id=p_id and pub.revoked_at is null
 and (pub.planner_id=app.current_planner_id() or jsonb_array_length(app.legacy_received(p_id))>0)
$$;
alter function app.legacy_publication_state(uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_publication_state(uuid) from public;
grant execute on function app.legacy_publication_state(uuid) to continuity_app;
create function app.legacy_lock_publication(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from app.legacy_pack_publications where public_id=p_id and revoked_at is null
  and (planner_id=app.current_planner_id() or jsonb_array_length(app.legacy_received(p_id))>0) for update;
 return found;
end $$;
alter function app.legacy_lock_publication(uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_lock_publication(uuid) from public;
grant execute on function app.legacy_lock_publication(uuid) to continuity_app;
create function app.legacy_received_assets(p_publication uuid,p_asset uuid default null) returns jsonb
language sql stable security definer set search_path='' as $$
 select case when jsonb_array_length(app.legacy_received(p_publication))=0 then '[]'::jsonb else
  (select coalesce(jsonb_agg(jsonb_build_object('publicId',a.public_id,'owner',a.data_header->>'owner',
   'kind',a.kind,'mediaType',a.media_type,'byteCount',a.byte_count,'dataHeader',a.data_header,
   'metadata',pa.metadata_envelope,'version',pa.metadata_version)),'[]'::jsonb)
   from app.legacy_pack_publications pub join app.legacy_publication_assets pa on pa.publication_id=pub.id
   join app.legacy_content_assets a on a.id=pa.asset_id and a.planner_id=pub.planner_id
   where pub.public_id=p_publication and a.storage_state='ready' and (p_asset is null or a.public_id=p_asset)) end
$$;
alter function app.legacy_received_assets(uuid,uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_received_assets(uuid,uuid) from public;
grant execute on function app.legacy_received_assets(uuid,uuid) to continuity_app;

-- Progress is a user report, never a verification or content-release signal.
create function app.legacy_progress(p_publication uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select case when not exists(select 1 from app.legacy_pack_publications where public_id=p_publication and planner_id=app.current_planner_id())
  and jsonb_array_length(app.legacy_received(p_publication))=0 then '[]'::jsonb else
 (select coalesce(jsonb_agg(jsonb_build_object('publicId',p.public_id,'taskId',p.task_public_id,'status',p.status,
 'body',p.body_envelope,'version',p.version,'updatedAt',p.updated_at,
 'reportedByOwner',p.reported_by=p.planner_id)),'[]'::jsonb) from app.legacy_task_progress p
 join app.legacy_pack_publications pub on pub.id=p.publication_id where pub.public_id=p_publication) end
$$;
alter function app.legacy_progress(uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_progress(uuid) from public;
grant execute on function app.legacy_progress(uuid) to continuity_app;
create function app.legacy_report_progress(p_publication uuid,p_task uuid,p_id uuid,p_version integer,p_status text,p_body jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare pub app.legacy_pack_publications%rowtype;
begin
 select * into pub from app.legacy_pack_publications where public_id=p_publication and revoked_at is null for update;
 if not found or (pub.planner_id<>app.current_planner_id() and jsonb_array_length(app.legacy_received(p_publication))=0) then return false; end if;
 if p_version=1 then
  insert into app.legacy_task_progress(public_id,publication_id,planner_id,task_public_id,status,body_envelope,version,reported_by)
   values(p_id,pub.id,pub.planner_id,p_task,p_status,p_body,1,app.current_planner_id()) on conflict(publication_id,task_public_id) do nothing;
 else
  update app.legacy_task_progress set status=p_status,body_envelope=p_body,version=p_version,updated_at=now(),reported_by=app.current_planner_id()
   where public_id=p_id and publication_id=pub.id and task_public_id=p_task and version=p_version-1;
 end if;
 return found;
end $$;
alter function app.legacy_report_progress(uuid,uuid,uuid,integer,text,jsonb) owner to continuity_legacy_service;
revoke all on function app.legacy_report_progress(uuid,uuid,uuid,integer,text,jsonb) from public;
grant execute on function app.legacy_report_progress(uuid,uuid,uuid,integer,text,jsonb) to continuity_app;

-- Account deletion cannot claim completion while stored objects remain unqueued.
grant select(public_id,planner_id,lease_token,status,lease_until) on app.account_deletions to continuity_legacy_service;
create policy legacy_deletion_job on app.account_deletions for select to continuity_legacy_service using(true);
create function app.legacy_prepare_account_cleanup(p_job uuid,p_lease uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare owner_id bigint; owner_public uuid;
begin
 select j.planner_id into owner_id from app.account_deletions j where j.public_id=p_job and j.lease_token=p_lease
  and j.status='processing' and j.lease_until>now();
 if owner_id is null then raise exception 'invalid deletion lease'; end if;
 select public_id into owner_public from app.planners where id=owner_id and status='deletion_pending';
 if owner_public is null then raise exception 'invalid deletion account'; end if;
 delete from app.legacy_content_assets where planner_id=owner_id;
 return owner_public;
end $$;
alter function app.legacy_prepare_account_cleanup(uuid,uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_prepare_account_cleanup(uuid,uuid) from public;
grant execute on function app.legacy_prepare_account_cleanup(uuid,uuid) to continuity_deletion_worker;
create function app.legacy_claim_cleanup(p_owner uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare row app.legacy_content_cleanup%rowtype; lease uuid:=gen_random_uuid();
begin
 select * into row from app.legacy_content_cleanup where completed_at is null
  and (p_owner is null or owner_public_id=p_owner) and next_attempt_at<=now()
  and (lease_until is null or lease_until<now()) order by created_at for update skip locked limit 1;
 if not found then return null; end if;
 update app.legacy_content_cleanup set lease_token=lease,lease_until=now()+interval '2 minutes',attempts=attempts+1 where public_id=row.public_id;
 return jsonb_build_object('publicId',row.public_id,'leaseToken',lease,'owner',row.owner_public_id,'asset',row.asset_public_id);
end $$;
alter function app.legacy_claim_cleanup(uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_claim_cleanup(uuid) from public;
grant execute on function app.legacy_claim_cleanup(uuid) to continuity_deletion_worker;
create function app.legacy_finish_cleanup(p_id uuid,p_lease uuid,p_success boolean) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 update app.legacy_content_cleanup set completed_at=case when p_success then now() else null end,
  lease_token=null,lease_until=null,next_attempt_at=now()+interval '1 minute'
  where public_id=p_id and lease_token=p_lease and completed_at is null;
 return found;
end $$;
alter function app.legacy_finish_cleanup(uuid,uuid,boolean) owner to continuity_legacy_service;
revoke all on function app.legacy_finish_cleanup(uuid,uuid,boolean) from public;
grant execute on function app.legacy_finish_cleanup(uuid,uuid,boolean) to continuity_deletion_worker;
create function app.legacy_account_cleanup_pending(p_owner uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.legacy_content_cleanup where owner_public_id=p_owner and completed_at is null)
$$;
alter function app.legacy_account_cleanup_pending(uuid) owner to continuity_legacy_service;
revoke all on function app.legacy_account_cleanup_pending(uuid) from public;
grant execute on function app.legacy_account_cleanup_pending(uuid) to continuity_deletion_worker;

alter function app.finish_account_deletion(uuid,uuid,boolean) rename to finish_account_deletion_before_content;
revoke all on function app.finish_account_deletion_before_content(uuid,uuid,boolean) from public,continuity_deletion_worker,continuity_auth;
grant execute on function app.finish_account_deletion_before_content(uuid,uuid,boolean) to continuity_legacy_service;
create function app.finish_account_deletion(p_job uuid,p_lease uuid,p_succeeded boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare owner_id bigint; owner_public uuid;
begin
 if p_succeeded and not app.recovery_replaying() then
  select j.planner_id,p.public_id into owner_id,owner_public from app.account_deletions j join app.planners p on p.id=j.planner_id
   where j.public_id=p_job and j.lease_token=p_lease and j.status='processing';
  if exists(select 1 from app.legacy_content_assets where planner_id=owner_id)
   or app.legacy_account_cleanup_pending(owner_public) then
   return app.finish_account_deletion_before_content(p_job,p_lease,false);
  end if;
 end if;
 return app.finish_account_deletion_before_content(p_job,p_lease,p_succeeded);
end $$;
alter function app.finish_account_deletion(uuid,uuid,boolean) owner to continuity_legacy_service;
revoke all on function app.finish_account_deletion(uuid,uuid,boolean) from public;
-- The quarantined restore entrypoint runs as the existing account-service owner.
-- It must call this wrapper, not bypass file custody through the renamed body.
grant execute on function app.finish_account_deletion(uuid,uuid,boolean) to continuity_deletion_worker,continuity_recovery_service,continuity_account_service;

-- The additional processing notice is separate from the current iOS clickwrap.
create table app.legacy_content_consents (
 planner_id bigint not null references app.planners(id) on delete cascade,
 version text not null check(version='2026-10-22-1'),
 accepted_at timestamptz not null default now(),
 primary key(planner_id,version)
);
alter table app.legacy_content_consents enable row level security;
alter table app.legacy_content_consents force row level security;
create policy consent_owner on app.legacy_content_consents to continuity_app using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
create policy runtime_authority on app.legacy_content_consents as restrictive using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()));
grant select,insert on app.legacy_content_consents to continuity_app;

create function app.legacy_asset_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_public uuid;
begin
 select public_id into owner_public from app.planners where id=new.planner_id and status='active';
 if owner_public is null or new.data_header->>'owner' is distinct from owner_public::text
  or new.metadata_envelope->'header'->>'owner' is distinct from owner_public::text then raise exception 'invalid content owner'; end if;
 if tg_op='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended('legacy:'||new.planner_id::text,0));
  if (select count(*) from app.legacy_content_assets where planner_id=new.planner_id)>=100
   or (select coalesce(sum(byte_count),0) from app.legacy_content_assets where planner_id=new.planner_id)+new.byte_count>134217728
   then raise exception 'legacy storage limit'; end if;
 elsif new.data_header is distinct from old.data_header or new.public_id<>old.public_id or new.planner_id<>old.planner_id
  or new.byte_count<>old.byte_count or new.media_type<>old.media_type or new.request_key<>old.request_key or new.kind<>old.kind
  or (old.storage_state='ready' and new.storage_state<>'ready') then raise exception 'immutable content object';
 end if;
 return new;
end $$;
alter function app.legacy_asset_guard() owner to continuity_legacy_service;
revoke all on function app.legacy_asset_guard() from public;
create trigger legacy_asset_guard before insert or update on app.legacy_content_assets for each row execute function app.legacy_asset_guard();

create function app.legacy_restrict_connection() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' or new.status<>'accepted' or new.recipient_planner_id is distinct from old.recipient_planner_id then
  update app.legacy_pack_publications set revoked_at=coalesce(revoked_at,now()) where connection_id=old.id;
 end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
alter function app.legacy_restrict_connection() owner to continuity_legacy_service;
revoke all on function app.legacy_restrict_connection() from public;
create trigger legacy_restrict_connection before delete or update of status,recipient_planner_id on app.sharing_connections
 for each row execute function app.legacy_restrict_connection();

create function app.legacy_sweep_uploads() returns void language sql security definer set search_path='' as $$
 delete from app.legacy_content_assets where id in (select id from app.legacy_content_assets
  where storage_state='uploading' and created_at<now()-interval '15 minutes' order by id limit 50 for update skip locked)
$$;
alter function app.legacy_sweep_uploads() owner to continuity_legacy_service;
revoke all on function app.legacy_sweep_uploads() from public;
grant execute on function app.legacy_sweep_uploads() to continuity_deletion_worker;

-- Restore an old snapshot only after replaying tombstones and revoking shares.
alter table app.recovery_controls drop constraint recovery_controls_kind_check;
alter table app.recovery_controls add constraint recovery_controls_kind_check check(kind in
 ('account','connection','matter','person','free_slot','unreconciled_access','retention_hold','ai_connection','future_notice','legacy_asset','legacy_publication'));
create function app.recovery_capture_legacy() returns trigger language plpgsql security definer set search_path='' as $$
declare pid uuid; kind text:=tg_argv[0];
begin
 if not(select enforced from app.recovery_policy where singleton) or app.recovery_replaying() then return null; end if;
 pid:=case when tg_op='DELETE' then old.public_id else new.public_id end;
 insert into app.recovery_controls(entity_key,kind,entity_public_id) values(kind||':'||pid::text,kind,pid)
 on conflict(entity_key) do update set revision=nextval('app.recovery_revision_seq'),transaction_id=txid_current(),published=false,recorded_at=clock_timestamp();
 return null;
end $$;
alter function app.recovery_capture_legacy() owner to continuity_recovery_service;
revoke all on function app.recovery_capture_legacy() from public;
create trigger recovery_legacy_asset after delete on app.legacy_content_assets for each row execute function app.recovery_capture_legacy('legacy_asset');
create trigger recovery_legacy_publication after insert or update or delete on app.legacy_pack_publications for each row execute function app.recovery_capture_legacy('legacy_publication');
alter function app.recovery_pending() rename to recovery_pending_before_legacy;
revoke all on function app.recovery_pending_before_legacy() from public,continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce,continuity_deletion_worker;
create function app.recovery_pending() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(case when item->>'kind'='legacy_asset' then jsonb_set(item,'{facts}','{"deleted":true}'::jsonb)
  when item->>'kind'='legacy_publication' then jsonb_set(item,'{facts}','{"revokeOnRestore":true}'::jsonb)
  else item end order by ordinal),'[]'::jsonb)
 from jsonb_array_elements(app.recovery_pending_before_legacy()) with ordinality as entries(item,ordinal)
$$;
alter function app.recovery_pending() owner to continuity_recovery_service;
revoke all on function app.recovery_pending() from public;
grant execute on function app.recovery_pending() to continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce,continuity_deletion_worker;
grant select,delete on app.legacy_content_assets to continuity_recovery_service;
grant select,update(revoked_at) on app.legacy_pack_publications to continuity_recovery_service;
create policy recovery_legacy_assets on app.legacy_content_assets to continuity_recovery_service using(true) with check(true);
create policy recovery_legacy_publications on app.legacy_pack_publications to continuity_recovery_service using(true) with check(true);

revoke create on schema app from continuity_legacy_service;
