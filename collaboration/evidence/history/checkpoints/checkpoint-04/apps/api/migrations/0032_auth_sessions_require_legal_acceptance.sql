alter table app.auth_sessions
  add column legal_acceptance_id bigint
    references app.legal_acceptances(id) on delete restrict;

create index auth_sessions_legal_acceptance_idx
  on app.auth_sessions (legal_acceptance_id)
  where legal_acceptance_id is not null;

grant insert (legal_acceptance_id) on app.auth_sessions to continuity_auth;
grant select (legal_acceptance_id) on app.auth_sessions to continuity_auth;
