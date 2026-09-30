-- Only administrative sessions can assume this nologin role. The role may
-- change protected representation, never business versions/status/permissions.
grant update(title,institution_name,account_hint,location_hint,notes,value_band,currency_code,details)
 on app.matter_items to continuity_content_service;
grant update(display_name,relationship_label) on app.people to continuity_content_service;
grant update(source_fields,proposal) on app.family_review_tasks to continuity_content_service;
grant update(before_fields,after_fields) on app.family_review_changes to continuity_content_service;
grant update(fields) on app.sharing_saved_items to continuity_content_service;
grant update(policy_snapshot) on app.disclosure_rehearsals to continuity_content_service;
do $$ declare t text; begin
 foreach t in array array['matter_items','people','family_review_tasks','family_review_changes','sharing_saved_items','disclosure_rehearsals'] loop
  execute format('create policy content_representation_migration on app.%I for update to continuity_content_service using(app.content_migration_active() and planner_id=app.current_planner_id()) with check(app.content_migration_active() and planner_id=app.current_planner_id())',t);
 end loop;
end $$;
