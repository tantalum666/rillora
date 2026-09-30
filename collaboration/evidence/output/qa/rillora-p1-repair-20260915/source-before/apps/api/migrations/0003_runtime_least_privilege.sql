revoke all privileges on all tables in schema app from continuity_app;
revoke all privileges on all sequences in schema app from continuity_app;

grant select, update on app.planners, app.plans to continuity_app;
grant select, insert, update on app.people, app.matter_items to continuity_app;
grant select, insert on app.role_assignments to continuity_app;
grant select on app.invitations to continuity_app;
grant select, update on app.official_setup_checks to continuity_app;
grant select, insert on app.claim_simulations, app.export_packages, app.audit_events to continuity_app;

grant usage, select on sequence
  app.people_id_seq,
  app.matter_items_id_seq,
  app.role_assignments_id_seq,
  app.claim_simulations_id_seq,
  app.export_packages_id_seq,
  app.audit_events_id_seq
to continuity_app;
