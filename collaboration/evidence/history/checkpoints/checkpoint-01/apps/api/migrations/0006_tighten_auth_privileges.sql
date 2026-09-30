revoke insert, update, delete on app.auth_transactions from continuity_auth;
revoke insert on app.auth_sessions from continuity_auth;

grant insert (
  token_hash,
  state_hash,
  code_verifier,
  nonce,
  return_to,
  expires_at
) on app.auth_transactions to continuity_auth;

grant update (consumed_at) on app.auth_transactions to continuity_auth;

grant insert (
  planner_id,
  identity_account_id,
  token_hash,
  csrf_token_hash,
  authenticated_at,
  authentication_methods,
  last_seen_at,
  expires_at
) on app.auth_sessions to continuity_auth;
