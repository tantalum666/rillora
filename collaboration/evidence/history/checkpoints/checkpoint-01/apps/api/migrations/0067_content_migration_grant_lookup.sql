-- Resolve saved-copy source IDs during representation-only migration. This
-- nologin role is not a membership of any application runtime login.
grant select on app.sharing_grants to continuity_content_service;
create policy content_service_read on app.sharing_grants for select
 to continuity_content_service using(true);
