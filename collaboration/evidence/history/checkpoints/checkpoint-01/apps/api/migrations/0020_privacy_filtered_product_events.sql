create table app.product_events (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  event_name text not null,
  client_source text not null,
  schema_version integer not null default 1,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  constraint product_events_name check (event_name in (
    'motivation_selected',
    'first_item_added',
    'five_items_completed',
    'item_outcome_assigned',
    'item_role_assigned',
    'official_setup_checked',
    'simulation_completed',
    'start_here_exported'
  )),
  constraint product_events_client_source check (client_source in ('web', 'ios', 'unknown')),
  constraint product_events_schema_version check (schema_version = 1),
  constraint product_events_properties_object check (jsonb_typeof(properties) = 'object'),
  constraint product_events_property_contract check (
    (
      event_name = 'motivation_selected'
      and properties ? 'motivation'
      and properties - 'motivation' = '{}'::jsonb
      and properties ->> 'motivation' in (
        'life_change', 'family_responsibility', 'cross_border', 'complex_digital_life',
        'recent_estate_experience', 'general_preparedness', 'other'
      )
    )
    or (
      event_name in ('first_item_added', 'five_items_completed', 'item_outcome_assigned')
      and properties = '{}'::jsonb
    )
    or (
      event_name = 'item_role_assigned'
      and properties ? 'role' and properties ? 'scope'
      and properties - array['role', 'scope'] = '{}'::jsonb
      and properties ->> 'role' in ('trusted_contact', 'executor', 'recipient')
      and properties ->> 'scope' in ('plan_wide', 'matter_specific')
    )
    or (
      event_name = 'official_setup_checked'
      and properties ? 'completed'
      and properties - 'completed' = '{}'::jsonb
      and jsonb_typeof(properties -> 'completed') = 'boolean'
    )
    or (
      event_name = 'simulation_completed'
      and properties ? 'lifeEvent' and properties ? 'kind'
      and properties - array['lifeEvent', 'kind'] = '{}'::jsonb
      and properties ->> 'lifeEvent' in ('death', 'incapacity', 'missing')
      and properties ->> 'kind' in ('count_snapshot', 'role_disclosure')
    )
    or (
      event_name = 'start_here_exported'
      and properties ? 'format'
      and properties - 'format' = '{}'::jsonb
      and properties ->> 'format' in ('plaintext', 'encrypted')
    )
  ),
  constraint product_events_retention_window check (expires_at > occurred_at)
);

create index product_events_planner_occurred_idx
  on app.product_events (planner_id, occurred_at desc, id desc);
create index product_events_expiry_idx on app.product_events (expires_at);

alter table app.product_events enable row level security;
alter table app.product_events force row level security;
create policy product_events_tenant_isolation on app.product_events
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

grant insert on app.product_events to continuity_app;
grant usage, select on sequence app.product_events_id_seq to continuity_app;
