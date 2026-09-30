begin;

alter table app.recipient_rehearsals
  add constraint recipient_rehearsals_id_planner_unique unique (id, planner_id);

alter table app.export_packages
  drop constraint export_packages_recipient_rehearsal_id_fkey;
alter table app.export_packages
  add constraint export_packages_recipient_rehearsal_fk
  foreign key (recipient_rehearsal_id, planner_id)
  references app.recipient_rehearsals(id, planner_id) on delete cascade;

create unique index recipient_device_keys_rehearsal_public_key_active_idx
  on app.recipient_device_keys (invitation_id, public_key_x963)
  where status = 'active';

commit;
