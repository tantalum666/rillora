-- Backup import may populate missing/default provider checks for its own plan.
-- Preserve the existing forced tenant RLS and permit only the imported columns.
grant insert (planner_id, plan_id, provider_key, policy_version, completed, completed_at)
  on app.official_setup_checks to continuity_app;
grant usage on sequence app.official_setup_checks_id_seq to continuity_app;
