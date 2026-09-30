alter table app.auth_sessions
  add column credential_kind text not null default 'browser_cookie',
  add constraint auth_sessions_credential_kind check (
    credential_kind in ('browser_cookie', 'native_bearer')
  );

grant select (credential_kind) on app.auth_sessions to continuity_auth;
grant insert (credential_kind) on app.auth_sessions to continuity_auth;
