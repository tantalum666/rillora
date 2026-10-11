-- Password/SET ROLE/GUC possession alone must not authorize a runtime transaction.
-- Only the application signer and dedicated maintenance credentials are trusted.
do $$ declare name text; begin
 foreach name in array array['continuity_authority_service','continuity_identity_service','continuity_commerce_resolver'] loop
  if not exists(select 1 from pg_roles where rolname=name) then
   execute format('create role %I nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication',name);
  end if;
  if exists(select 1 from pg_roles where rolname=name and
   (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls or rolreplication)) then
   raise exception 'unsafe security service role';
  end if;
  execute format('grant %I to current_user',name);
 end loop;
end $$;
do $$ declare name text; begin
 foreach name in array array['continuity_app','continuity_auth','continuity_commerce','continuity_rehearsal',
  'continuity_account_service','continuity_content_service','continuity_share_service','continuity_recovery_service','continuity_retention_service'] loop
  if exists(select 1 from pg_roles where rolname=name and
   (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls or rolreplication)) then
   raise exception 'unsafe existing service role';
  end if;
 end loop;
end $$;
create schema rillora_guard authorization continuity_authority_service;
revoke all on schema rillora_guard from public;
create table rillora_guard.runtime_authority (
 singleton boolean primary key default true check(singleton),
 signing_key text not null check(signing_key ~ '^[A-Za-z0-9_-]{48,128}$')
);
alter table rillora_guard.runtime_authority owner to continuity_authority_service;
revoke all on rillora_guard.runtime_authority from public;
alter table rillora_guard.runtime_authority enable row level security;
alter table rillora_guard.runtime_authority force row level security;
create policy authority_key_access on rillora_guard.runtime_authority to continuity_authority_service using(true) with check(true);
grant usage,create on schema app to continuity_authority_service,continuity_identity_service,continuity_commerce_resolver;
grant usage on schema public to continuity_authority_service;

create function app.runtime_maintenance_login() returns boolean
language sql stable security definer set search_path='' as $$
 select pg_has_role(session_user,'continuity_authority_service','MEMBER')
  or pg_has_role(session_user,'continuity_recovery_service','MEMBER')
$$;
alter function app.runtime_maintenance_login() owner to continuity_authority_service;
revoke all on function app.runtime_maintenance_login() from public;

create function app.runtime_authority_valid() returns boolean
language plpgsql stable security definer set search_path='' as $$
declare actor text:=coalesce(current_setting('app.current_planner_id',true),'');
 expires text:=coalesce(current_setting('app.authority_expires',true),'');
 signature text:=coalesce(current_setting('app.authority_signature',true),'');
 role_name text:=current_setting('role',true); key text; message text; now_seconds bigint;
begin
 if app.runtime_maintenance_login() then return true; end if;
 -- A distinct worker login has only claim/finish EXECUTE grants, no API roles.
 if exists(select 1 from pg_roles where rolname='continuity_deletion_worker' and pg_has_role(session_user,oid,'MEMBER')) then return true; end if;
 if role_name not in ('continuity_app','continuity_auth','continuity_rehearsal','continuity_commerce')
  or actor !~ '^([1-9][0-9]{0,18})?$' or expires !~ '^[0-9]{10}$' or signature !~ '^[a-f0-9]{64}$'
  or current_database() !~ '^[a-z][a-z0-9_]{0,62}$' or session_user::text !~ '^[a-z][a-z0-9_]{0,62}$' then return false; end if;
 now_seconds:=floor(extract(epoch from clock_timestamp()))::bigint;
 if expires::bigint<now_seconds or expires::bigint>now_seconds+120 then return false; end if;
 select signing_key into key from rillora_guard.runtime_authority where singleton;
 if key is null then return false; end if;
 message:=concat_ws('|','rillora-db-v1',current_database(),session_user,pg_backend_pid()::text,
  txid_current()::text,role_name,actor,expires);
 return public.hmac(convert_to(message,'UTF8'),convert_to(key,'UTF8'),'sha256')=decode(signature,'hex');
end $$;
alter function app.runtime_authority_valid() owner to continuity_authority_service;
revoke all on function app.runtime_authority_valid() from public;
grant execute on function app.runtime_authority_valid() to public;

create or replace function app.current_planner_id() returns bigint
language plpgsql stable security definer set search_path='' as $$
begin
 if not app.runtime_authority_valid() then return null; end if;
 return nullif(current_setting('app.current_planner_id',true),'')::bigint;
end $$;
alter function app.current_planner_id() owner to continuity_authority_service;

-- Transfer every formerly administrator-owned runtime definer before forcing RLS.
grant select,insert,update on app.planners,app.plans,app.identity_accounts,app.official_setup_checks to continuity_identity_service;
grant usage,select on sequence app.planners_id_seq,app.plans_id_seq,app.identity_accounts_id_seq,app.official_setup_checks_id_seq to continuity_identity_service;
alter function app.provision_oidc_planner(text,text,text,text,text) owner to continuity_identity_service;
do $$ declare t text; begin
 foreach t in array array['planners','plans','identity_accounts','official_setup_checks'] loop
  execute format('create policy identity_provision_service on app.%I to continuity_identity_service using(true) with check(true)',t);
 end loop;
end $$;
grant select on app.planners,app.plans to continuity_commerce_resolver;
grant update(original_transaction_reference) on app.commerce_apple_purchase_sessions to continuity_commerce_resolver;
do $$ declare t record; begin
 for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='app' and c.relkind='r' and (c.relname like 'commerce_%' or c.relname in ('planners','plans')) loop
  execute format('grant select on app.%I to continuity_commerce_resolver',t.relname);
  execute format('create policy commerce_resolver_read on app.%I for select to continuity_commerce_resolver using(true)',t.relname);
 end loop;
end $$;
create policy commerce_resolver_claim on app.commerce_apple_purchase_sessions for update to continuity_commerce_resolver using(true) with check(true);
grant execute on function app.current_planner_id() to continuity_identity_service,continuity_commerce_resolver;
alter function app.resolve_commerce_account(uuid) owner to continuity_commerce_resolver;
alter function app.resolve_storekit_account_binding(uuid) owner to continuity_commerce_resolver;
alter function app.resolve_apple_production_account(uuid) owner to continuity_commerce_resolver;
alter function app.commerce_planner_can_purchase() owner to continuity_commerce_resolver;
alter function app.apple_review_account_enabled(bigint) owner to continuity_commerce_resolver;
alter function app.resolve_apple_transaction_account(uuid,text) owner to continuity_commerce_resolver;
alter function app.resolve_apple_purchase_owner(uuid,text,text,jsonb) owner to continuity_commerce_resolver;

-- A restrictive policy complements existing tenant/sharing projections. It must
-- also cover tables whose runtime grants are column-level or had no prior RLS.
do $$ declare t record; begin
 for t in select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='app' and c.relkind='r' and c.relname<>'schema_migrations' loop
  if not t.relrowsecurity then
   execute format('create policy prior_acl_rows on app.%I using(true) with check(true)',t.relname);
  end if;
  execute format('alter table app.%I enable row level security',t.relname);
  execute format('alter table app.%I force row level security',t.relname);
  execute format('create policy runtime_authority on app.%I as restrictive using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()))',t.relname);
 end loop;
end $$;
revoke create on schema app from continuity_authority_service,continuity_identity_service,continuity_commerce_resolver;
