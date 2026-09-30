alter table app.plans
  add column first_use_state text not null default 'available',
  add column first_use_step smallint not null default 0,
  add constraint plans_first_use_state check (
    first_use_state in ('available', 'guide_in_progress', 'guide_paused', 'completed')
  ),
  add constraint plans_first_use_step check (first_use_step between 0 and 2),
  add constraint plans_first_use_pair check (
    (first_use_state = 'available' and first_use_step = 0)
    or (first_use_state = 'guide_in_progress' and first_use_step between 1 and 2)
    or (first_use_state = 'guide_paused' and first_use_step between 0 and 2)
    or (first_use_state = 'completed' and first_use_step = 2)
  );

update app.plans p
set first_use_state = 'completed',
    first_use_step = 2
where exists (
  select 1
  from app.matter_items m
  where m.plan_id = p.id and m.archived_at is null
);

