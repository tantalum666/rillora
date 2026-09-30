-- A recipient deleting their account must not erase the owner's review cadence
-- or approved directions. Detach the contributor and retain only owner history.
do $$ declare c record; begin
  for c in select conname from pg_constraint
    where conrelid='app.family_review_settings'::regclass and confrelid='app.sharing_connections'::regclass
  loop execute format('alter table app.family_review_settings drop constraint %I',c.conname); end loop;
  for c in select conname from pg_constraint
    where conrelid='app.family_review_changes'::regclass and confrelid='app.family_review_tasks'::regclass
  loop execute format('alter table app.family_review_changes drop constraint %I',c.conname); end loop;
end $$;
alter table app.family_review_settings add constraint family_review_collaborator_owner
  foreign key (collaborator_connection_id,planner_id) references app.sharing_connections(id,planner_id)
  on delete set null (collaborator_connection_id);
alter table app.family_review_changes alter column task_id drop not null;
alter table app.family_review_changes add constraint family_review_history_task
  foreign key (task_id) references app.family_review_tasks(id) on delete set null;
