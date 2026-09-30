-- Only the administrative credential holds this nologin role. The runtime
-- bootstrap rejects membership. Explicit policies are required on RDS, whose
-- master login is not a PostgreSQL superuser and still obeys forced RLS.
do $$ declare t text; begin
 foreach t in array array['planners','sharing_connections','sharing_grants','matter_items','people',
  'sharing_preferences','auth_sessions','auth_transactions','sharing_handoffs','recipient_rehearsals','account_deletions'] loop
  execute format('grant select,update,delete on app.%I to continuity_recovery_service',t);
  execute format('create policy recovery_administrative_replay on app.%I to continuity_recovery_service using(true) with check(true)',t);
 end loop;
end $$;
