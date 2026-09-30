alter table app.auth_transactions add column reauth_failed_at timestamptz;
grant select (reauth_failed_at), update (reauth_failed_at) on app.auth_transactions to continuity_auth;
