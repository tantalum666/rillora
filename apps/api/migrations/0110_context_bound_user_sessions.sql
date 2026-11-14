-- Opt-in bounded long sessions. Existing sessions retain the original policy.
alter table app.auth_sessions
  add column context_version smallint not null default 0,
  add column client_context_hash bytea,
  add column network_context_hashes bytea,
  add column idle_timeout_minutes integer,
  add column identity_checked_at timestamptz,
  add constraint auth_session_context_shape check (
    (context_version=0 and client_context_hash is null and network_context_hashes is null
      and idle_timeout_minutes is null and identity_checked_at is null)
    or (context_version=1 and client_context_hash is not null and network_context_hashes is not null
      and idle_timeout_minutes is not null and octet_length(client_context_hash)=32
      and octet_length(network_context_hashes) between 32 and 160
      and octet_length(network_context_hashes)%32=0
      and idle_timeout_minutes between 1 and 10080 and identity_checked_at is not null
      and expires_at <= created_at + interval '30 days')
  );
grant update (network_context_hashes, identity_checked_at) on app.auth_sessions to continuity_auth;
grant select (context_version, client_context_hash, network_context_hashes, idle_timeout_minutes, identity_checked_at),
  insert (context_version, client_context_hash, network_context_hashes, idle_timeout_minutes, identity_checked_at)
  on app.auth_sessions to continuity_auth;
