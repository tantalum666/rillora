-- Authentication time must come from a verified auth_time claim, never token iat.
update app.auth_sessions set authenticated_at = null where authenticated_at is not null;
alter table app.auth_transactions
  add column reauth_session_public_id uuid,
  add column reauth_poll_hash bytea check (reauth_poll_hash is null or octet_length(reauth_poll_hash)=32),
  add column reauth_completed_at timestamptz;
grant select (reauth_session_public_id, reauth_poll_hash, reauth_completed_at, created_at)
  on app.auth_transactions to continuity_auth;
grant insert (reauth_session_public_id, reauth_poll_hash), update (reauth_completed_at)
  on app.auth_transactions to continuity_auth;
grant update (authenticated_at, authentication_methods) on app.auth_sessions to continuity_auth;
