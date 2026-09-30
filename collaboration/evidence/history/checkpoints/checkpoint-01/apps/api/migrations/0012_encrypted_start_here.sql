begin;

alter table app.invitations
  add constraint invitations_id_planner_unique unique (id, planner_id);

alter table app.export_packages
  add constraint export_packages_id_planner_unique unique (id, planner_id);

alter table app.export_packages
  drop constraint export_packages_format;

alter table app.export_packages
  add constraint export_packages_format
  check (format in (
    'start_here_json',
    'start_here_text',
    'printable_pdf',
    'encrypted_start_here_v1'
  ));

alter table app.export_packages
  add column source_preview_public_id uuid,
  add column crypto_version text,
  add column content_nonce bytea,
  add column content_ciphertext bytea,
  add column ciphertext_sha256 bytea;

alter table app.export_packages
  add constraint export_packages_encrypted_shape check (
    (
      format <> 'encrypted_start_here_v1'
      and source_preview_public_id is null
      and crypto_version is null
      and content_nonce is null
      and content_ciphertext is null
      and ciphertext_sha256 is null
    )
    or (
      format = 'encrypted_start_here_v1'
      and source_preview_public_id is not null
      and crypto_version = 'rillora-hpke-v1'
      and (
        (status = 'generating' and content_nonce is null and content_ciphertext is null
          and ciphertext_sha256 is null)
        or (status = 'ready' and octet_length(content_nonce) = 12
          and octet_length(content_ciphertext) between 17 and 65536
          and octet_length(ciphertext_sha256) = 32)
      )
    )
  );

create table app.recipient_device_keys (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  person_id bigint not null,
  invitation_id bigint not null,
  algorithm text not null,
  public_key_x963 bytea not null,
  device_label text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint recipient_device_keys_id_planner_unique unique (id, planner_id),
  constraint recipient_device_keys_person_fk foreign key (person_id, planner_id)
    references app.people(id, planner_id) on delete cascade,
  constraint recipient_device_keys_invitation_fk foreign key (invitation_id, planner_id)
    references app.invitations(id, planner_id) on delete cascade,
  constraint recipient_device_keys_algorithm check (algorithm = 'p256_hpke_base'),
  constraint recipient_device_keys_public_key check (
    octet_length(public_key_x963) = 65 and get_byte(public_key_x963, 0) = 4
  ),
  constraint recipient_device_keys_device_label check (
    char_length(device_label) between 1 and 80
  ),
  constraint recipient_device_keys_status check (status in ('active', 'revoked')),
  constraint recipient_device_keys_revocation check (
    (status = 'active' and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
  )
);

create index recipient_device_keys_planner_status_idx
  on app.recipient_device_keys (planner_id, status, id);
create index recipient_device_keys_person_idx
  on app.recipient_device_keys (person_id);

create table app.export_key_envelopes (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  export_package_id bigint not null,
  envelope_kind text not null,
  recipient_device_key_id bigint,
  recovery_public_key_x963 bytea,
  crypto_suite text not null,
  encapsulated_key bytea not null,
  wrapped_key bytea not null,
  created_at timestamptz not null default now(),
  constraint export_key_envelopes_export_fk foreign key (export_package_id, planner_id)
    references app.export_packages(id, planner_id) on delete cascade,
  constraint export_key_envelopes_recipient_key_fk
    foreign key (recipient_device_key_id, planner_id)
    references app.recipient_device_keys(id, planner_id) on delete restrict,
  constraint export_key_envelopes_kind check (envelope_kind in ('recipient', 'recovery')),
  constraint export_key_envelopes_shape check (
    (envelope_kind = 'recipient' and recipient_device_key_id is not null
      and recovery_public_key_x963 is null)
    or (envelope_kind = 'recovery' and recipient_device_key_id is null
      and octet_length(recovery_public_key_x963) = 65
      and get_byte(recovery_public_key_x963, 0) = 4)
  ),
  constraint export_key_envelopes_crypto_suite check (
    crypto_suite = 'P256-HKDF-SHA256-AES-256-GCM'
  ),
  constraint export_key_envelopes_encapsulated_key check (
    octet_length(encapsulated_key) = 65 and get_byte(encapsulated_key, 0) = 4
  ),
  constraint export_key_envelopes_wrapped_key check (octet_length(wrapped_key) = 48)
);

create unique index export_key_envelopes_recovery_unique_idx
  on app.export_key_envelopes (export_package_id)
  where envelope_kind = 'recovery';
create unique index export_key_envelopes_recipient_unique_idx
  on app.export_key_envelopes (export_package_id, recipient_device_key_id)
  where envelope_kind = 'recipient';
create index export_key_envelopes_planner_export_idx
  on app.export_key_envelopes (planner_id, export_package_id, id);

alter table app.recipient_device_keys enable row level security;
alter table app.recipient_device_keys force row level security;
create policy recipient_device_keys_tenant_isolation on app.recipient_device_keys
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.export_key_envelopes enable row level security;
alter table app.export_key_envelopes force row level security;
create policy export_key_envelopes_tenant_isolation on app.export_key_envelopes
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

grant select on app.recipient_device_keys to continuity_app;
grant select, insert on app.export_key_envelopes to continuity_app;
grant update (status, expires_at, content_nonce, content_ciphertext, ciphertext_sha256)
  on app.export_packages to continuity_app;
grant usage, select on sequence app.export_key_envelopes_id_seq to continuity_app;

commit;
