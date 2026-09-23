revoke update on app.planners from continuity_app;

revoke select on app.auth_sessions from continuity_auth;
grant select (
  public_id,
  planner_id,
  token_hash,
  csrf_token_hash,
  expires_at,
  revoked_at
) on app.auth_sessions to continuity_auth;
