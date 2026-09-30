alter table app.auth_transactions
  add column legal_acceptance_required boolean,
  add column terms_version text,
  add column privacy_version text,
  add column consent_text_version text,
  add column legal_bundle_sha256 bytea,
  add column accepted_terms boolean,
  add column acknowledged_privacy boolean,
  add column accepted_electronic_records boolean,
  add column legal_client_surface text;

update app.auth_transactions
set legal_acceptance_required = false
where legal_acceptance_required is null;

alter table app.auth_transactions
  alter column legal_acceptance_required set not null;

alter table app.auth_transactions
  add constraint auth_transactions_legal_acceptance_complete check (
    (
      legal_acceptance_required is false
      and terms_version is null
      and privacy_version is null
      and consent_text_version is null
      and legal_bundle_sha256 is null
      and accepted_terms is null
      and acknowledged_privacy is null
      and accepted_electronic_records is null
      and legal_client_surface is null
    ) or (
      legal_acceptance_required is true
      and terms_version is not null
      and privacy_version is not null
      and consent_text_version is not null
      and legal_bundle_sha256 is not null
      and accepted_terms is true
      and acknowledged_privacy is true
      and accepted_electronic_records is true
      and legal_client_surface = 'web'
    )
  ),
  add constraint auth_transactions_legal_versions check (
    legal_acceptance_required is false or (
      char_length(terms_version) between 8 and 100
      and char_length(privacy_version) between 8 and 100
      and char_length(consent_text_version) between 8 and 120
      and octet_length(legal_bundle_sha256) = 32
    )
  );

create table app.legal_acceptances (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete restrict,
  identity_account_id bigint not null references app.identity_accounts(id) on delete restrict,
  terms_version text not null,
  privacy_version text not null,
  consent_text_version text not null,
  legal_bundle_sha256 bytea not null,
  accepted_terms boolean not null,
  acknowledged_privacy boolean not null,
  accepted_electronic_records boolean not null,
  client_surface text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint legal_acceptances_versions check (
    char_length(terms_version) between 8 and 100
    and char_length(privacy_version) between 8 and 100
    and char_length(consent_text_version) between 8 and 120
  ),
  constraint legal_acceptances_digest check (octet_length(legal_bundle_sha256) = 32),
  constraint legal_acceptances_affirmative check (
    accepted_terms is true
    and acknowledged_privacy is true
    and accepted_electronic_records is true
  ),
  constraint legal_acceptances_surface check (client_surface in ('web', 'ios')),
  constraint legal_acceptances_identity_version_unique unique (
    identity_account_id,
    terms_version,
    privacy_version,
    legal_bundle_sha256
  )
);

create index legal_acceptances_planner_time_idx
  on app.legal_acceptances (planner_id, accepted_at desc);

revoke all on app.legal_acceptances from public;
revoke all on app.legal_acceptances_id_seq from public;

grant insert (
  legal_acceptance_required,
  terms_version,
  privacy_version,
  consent_text_version,
  legal_bundle_sha256,
  accepted_terms,
  acknowledged_privacy,
  accepted_electronic_records,
  legal_client_surface
) on app.auth_transactions to continuity_auth;

grant select (
  legal_acceptance_required,
  terms_version,
  privacy_version,
  consent_text_version,
  legal_bundle_sha256,
  accepted_terms,
  acknowledged_privacy,
  accepted_electronic_records,
  legal_client_surface
) on app.auth_transactions to continuity_auth;

grant select, insert on app.legal_acceptances to continuity_auth;
grant usage, select on app.legal_acceptances_id_seq to continuity_auth;
