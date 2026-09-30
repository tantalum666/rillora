create table app.identity_accounts (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  issuer text not null,
  subject text not null,
  last_authenticated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint identity_accounts_issuer_length check (char_length(issuer) between 8 and 500),
  constraint identity_accounts_subject_length check (char_length(subject) between 1 and 255),
  constraint identity_accounts_issuer_subject_unique unique (issuer, subject)
);

create index identity_accounts_planner_id_idx on app.identity_accounts (planner_id);

create table app.auth_transactions (
  id bigint generated always as identity primary key,
  token_hash bytea not null unique,
  state_hash bytea not null unique,
  code_verifier text not null,
  nonce text not null,
  return_to text not null default '/',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  constraint auth_transactions_verifier_length check (char_length(code_verifier) between 43 and 128),
  constraint auth_transactions_nonce_length check (char_length(nonce) between 32 and 255),
  constraint auth_transactions_return_path check (
    char_length(return_to) between 1 and 500
    and return_to like '/%'
    and return_to not like '//%'
    and position(chr(92) in return_to) = 0
  ),
  constraint auth_transactions_expiry check (expires_at > created_at)
);

create index auth_transactions_expiry_idx on app.auth_transactions (expires_at)
  where consumed_at is null;

alter table app.auth_sessions
  add column identity_account_id bigint references app.identity_accounts(id) on delete set null,
  add column authenticated_at timestamptz,
  add column authentication_methods text[] not null default '{}'::text[];

create index auth_sessions_identity_account_idx on app.auth_sessions (identity_account_id)
  where identity_account_id is not null;

create or replace function app.provision_oidc_planner(
  p_issuer text,
  p_subject text,
  p_display_name text,
  p_locale text,
  p_time_zone text
)
returns table (planner_id bigint, planner_public_id uuid, identity_account_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_planner_id bigint;
  v_planner_public_id uuid;
  v_identity_account_id bigint;
  v_plan_id bigint;
begin
  if char_length(p_issuer) not between 8 and 500
     or char_length(p_subject) not between 1 and 255
     or char_length(p_display_name) not between 1 and 120
     or char_length(p_locale) not between 2 and 35
     or char_length(p_time_zone) not between 1 and 80 then
    raise exception 'invalid identity provisioning input' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_issuer || chr(31) || p_subject, 0)
  );

  select ia.id, p.id, p.public_id
    into v_identity_account_id, v_planner_id, v_planner_public_id
  from app.identity_accounts ia
  join app.planners p on p.id = ia.planner_id
  where ia.issuer = p_issuer and ia.subject = p_subject and p.status = 'active';

  if found then
    update app.identity_accounts
       set last_authenticated_at = now()
     where id = v_identity_account_id;
  else
    insert into app.planners (display_name, locale, time_zone)
    values (p_display_name, p_locale, p_time_zone)
    returning id, public_id into v_planner_id, v_planner_public_id;

    insert into app.plans (planner_id, motivation, status)
    values (v_planner_id, null, 'draft')
    returning id into v_plan_id;

    insert into app.official_setup_checks (
      planner_id, plan_id, provider_key, policy_version, completed
    )
    select v_planner_id, v_plan_id, provider_key, 'initial-2026-08-04', false
    from unnest(array['apple', 'google', 'meta', 'github', 'password_manager']) as provider_key;

    insert into app.identity_accounts (planner_id, issuer, subject)
    values (v_planner_id, p_issuer, p_subject)
    returning id into v_identity_account_id;
  end if;

  return query select v_planner_id, v_planner_public_id, v_identity_account_id;
end
$$;

revoke all on table app.identity_accounts, app.auth_transactions from public;
revoke all on function app.provision_oidc_planner(text, text, text, text, text) from public;

grant execute on function app.provision_oidc_planner(text, text, text, text, text)
to continuity_auth;
grant select, insert, update, delete on app.auth_transactions to continuity_auth;
grant insert on app.auth_sessions to continuity_auth;
grant usage, select on sequence
  app.auth_transactions_id_seq,
  app.auth_sessions_id_seq
to continuity_auth;

revoke select on app.auth_sessions from continuity_auth;
grant select (
  id,
  public_id,
  planner_id,
  token_hash,
  csrf_token_hash,
  expires_at,
  last_seen_at,
  revoked_at,
  authenticated_at,
  authentication_methods
  ,created_at
) on app.auth_sessions to continuity_auth;
