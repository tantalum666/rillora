revoke select on app.auth_transactions from continuity_auth;

grant select (
  token_hash,
  state_hash,
  code_verifier,
  nonce,
  return_to,
  expires_at,
  consumed_at
) on app.auth_transactions to continuity_auth;
