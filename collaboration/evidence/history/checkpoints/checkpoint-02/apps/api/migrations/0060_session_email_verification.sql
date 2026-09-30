-- Allow the authenticated-session service to refresh provider-verified email
-- proof without issuing another session or broadening planner data access.
grant select (id, planner_id, issuer, subject) on app.identity_accounts to continuity_auth;
grant select (identity_account_id), update (verified_email_hash) on app.auth_sessions to continuity_auth;
