create table app.disclosure_rehearsals (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  life_event text not null,
  state text not null,
  policy_version text not null,
  policy_snapshot jsonb not null,
  completed_checkpoints jsonb not null default '[]'::jsonb,
  simulation_only boolean not null default true,
  operative boolean not null default false,
  identity_verified boolean not null default false,
  documents_verified boolean not null default false,
  multi_party_verified boolean not null default false,
  notifications_sent boolean not null default false,
  data_released boolean not null default false,
  cooling_off_ends_at timestamptz,
  cooling_off_simulated_at timestamptz,
  appealed_at timestamptz,
  canceled_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disclosure_rehearsals_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint disclosure_rehearsals_life_event check (
    life_event in ('death', 'incapacity', 'missing')
  ),
  constraint disclosure_rehearsals_event_state check (
    (life_event = 'death' and state in (
      'death_claim_opened', 'death_identity_review', 'death_document_review',
      'death_multi_party_confirmation', 'death_cooling_off', 'death_preview_ready',
      'death_appealed', 'death_canceled'
    ))
    or (life_event = 'incapacity' and state in (
      'incapacity_claim_opened', 'incapacity_identity_review',
      'incapacity_authority_review', 'incapacity_multi_party_confirmation',
      'incapacity_cooling_off', 'incapacity_preview_ready',
      'incapacity_appealed', 'incapacity_canceled'
    ))
    or (life_event = 'missing' and state in (
      'missing_report_opened', 'missing_identity_review',
      'missing_contact_attempts_review', 'missing_multi_party_confirmation',
      'missing_support_cooling_off', 'missing_limited_preview_ready',
      'missing_appealed', 'missing_canceled'
    ))
  ),
  constraint disclosure_rehearsals_snapshot_object check (
    jsonb_typeof(policy_snapshot) = 'object'
  ),
  constraint disclosure_rehearsals_checkpoints_array check (
    jsonb_typeof(completed_checkpoints) = 'array'
  ),
  constraint disclosure_rehearsals_non_operative check (
    simulation_only = true
    and operative = false
    and identity_verified = false
    and documents_verified = false
    and multi_party_verified = false
    and notifications_sent = false
    and data_released = false
  ),
  constraint disclosure_rehearsals_version_positive check (version > 0),
  constraint disclosure_rehearsals_cooling_pair check (
    cooling_off_simulated_at is null or cooling_off_ends_at is not null
  )
);

create index disclosure_rehearsals_planner_updated_idx
  on app.disclosure_rehearsals (planner_id, updated_at desc, id desc);
create index disclosure_rehearsals_plan_id_idx
  on app.disclosure_rehearsals (plan_id);

alter table app.disclosure_rehearsals enable row level security;
alter table app.disclosure_rehearsals force row level security;
create policy disclosure_rehearsals_tenant_isolation on app.disclosure_rehearsals
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

grant select, insert, update on app.disclosure_rehearsals to continuity_app;
grant usage, select on sequence app.disclosure_rehearsals_id_seq to continuity_app;
