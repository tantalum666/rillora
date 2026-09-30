-- Scoped suggestions do not grant write access to another planner's Matter API.
create table app.family_review_settings (
  planner_id bigint primary key references app.planners(id) on delete cascade,
  collaborator_connection_id bigint,
  cadence_days integer not null default 90 check (cadence_days in (0, 30, 90, 180, 365)),
  next_review_at timestamptz,
  version integer not null default 1 check (version > 0),
  foreign key (collaborator_connection_id, planner_id)
    references app.sharing_connections(id, planner_id) on delete cascade
);
create table app.family_review_rounds (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  request_key uuid not null,
  request_digest text not null,
  due_at timestamptz not null,
  state text not null default 'open' check (state in ('open','completed','cancelled')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, planner_id), unique (planner_id, request_key)
);
create unique index family_one_open_round on app.family_review_rounds(planner_id) where state = 'open';
create table app.family_review_tasks (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  round_id bigint not null,
  connection_id bigint not null,
  matter_item_id bigint not null,
  grant_id bigint not null,
  source_version integer not null,
  source_fields jsonb not null,
  state text not null default 'waiting' check (state in ('waiting','confirmed','needs_update','suggested','applied','dismissed')),
  reason text check (reason in ('cannot_find','outdated','unclear')),
  proposal jsonb,
  version integer not null default 1 check (version > 0),
  responded_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (round_id, planner_id) references app.family_review_rounds(id, planner_id) on delete cascade,
  foreign key (connection_id, planner_id) references app.sharing_connections(id, planner_id) on delete cascade,
  foreign key (matter_item_id, planner_id) references app.matter_items(id, planner_id) on delete cascade,
  unique (round_id, connection_id, matter_item_id)
);
create index family_tasks_connection on app.family_review_tasks(connection_id);
create table app.family_review_changes (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  task_id bigint not null references app.family_review_tasks(id) on delete cascade,
  matter_item_id bigint not null,
  source_version integer not null,
  saved_version integer not null,
  before_fields jsonb not null,
  after_fields jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (matter_item_id, planner_id) references app.matter_items(id, planner_id) on delete cascade
);

do $$ declare t text; begin
  foreach t in array array['family_review_settings','family_review_rounds','family_review_tasks','family_review_changes'] loop
    execute format('revoke all on app.%I from public', t);
    execute format('alter table app.%I enable row level security', t);
    execute format('alter table app.%I force row level security', t);
    execute format('create policy family_owner on app.%I to continuity_app using (planner_id = app.current_planner_id()) with check (planner_id = app.current_planner_id())', t);
    execute format('grant select, insert, update on app.%I to continuity_app', t);
    execute format('grant select on app.%I to continuity_share_service', t);
    execute format('create policy family_service_read on app.%I for select to continuity_share_service using (true)', t);
  end loop;
end $$;
grant usage on sequence app.family_review_rounds_id_seq, app.family_review_tasks_id_seq,
  app.family_review_changes_id_seq to continuity_app;
revoke update on app.family_review_changes from continuity_app;
grant update (state, reason, proposal, version, responded_at) on app.family_review_tasks to continuity_share_service;
create policy family_service_respond on app.family_review_tasks for update to continuity_share_service using (true) with check (true);
grant select (version) on app.matter_items to continuity_share_service;
grant select (display_name) on app.people to continuity_share_service;

-- Existing commerce data stays read-only. This function never grants entitlement.
grant select on app.commerce_entitlement_grants, app.commerce_subscriptions to continuity_share_service;
create policy family_entitlement_read on app.commerce_entitlement_grants for select to continuity_share_service using (true);
create policy family_subscription_read on app.commerce_subscriptions for select to continuity_share_service using (true);
grant create on schema app to continuity_share_service;

create function app.family_maintenance_enabled(p_owner bigint, p_preview boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from app.planners where id=p_owner and status='active') and
    (p_preview or exists(
      select 1 from app.commerce_entitlement_grants e
      left join app.commerce_subscriptions s on s.id=e.subscription_id and s.planner_id=e.planner_id
      where e.planner_id=p_owner and e.capability_code='family_maintenance'
        and (e.allowance is null or e.allowance > 0)
        and e.revoked_at is null and e.effective_at <= now()
        and (e.expires_at is null or e.expires_at > now())
        and (e.source_type <> 'subscription' or (s.state in ('active','cancel_at_period_end','grace')
          and s.current_period_ends_at > now()))
    ))
$$;
revoke all on function app.family_maintenance_enabled(bigint, boolean) from public;
grant execute on function app.family_maintenance_enabled(bigint, boolean) to continuity_app, continuity_share_service;
alter function app.family_maintenance_enabled(bigint, boolean) owner to continuity_share_service;

create function app.family_review_task(p_id bigint, p_preview boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'publicId',t.public_id,'roundPublicId',r.public_id,'roundState',r.state,
    'matterPublicId',m.public_id,'connectionPublicId',c.public_id,
    'ownerName',p.display_name,'personName',person.display_name,'title',m.title,
    'state',t.state,'version',t.version,'sourceVersion',t.source_version,
    'currentVersion',m.version,'fields',t.source_fields,'proposal',t.proposal,
    'reason',t.reason,'dueAt',r.due_at,'respondedAt',t.responded_at,'decidedAt',t.decided_at,
    'scopeAvailable',c.status='accepted' and person.status not in ('revoked','archived')
      and g.id is not null and g.detail_level in ('directions','details')
      and m.archived_at is null and m.desired_outcome <> 'never_disclose',
    'isStale',m.version <> t.source_version,
    'canRespond',r.state='open' and c.recipient_planner_id=app.current_planner_id()
      and t.state in ('waiting','confirmed','needs_update','suggested')
      and m.version=t.source_version and app.family_maintenance_enabled(t.planner_id,p_preview),
    'canSuggest',r.state='open' and coalesce(s.collaborator_connection_id=c.id,false)
      and app.family_maintenance_enabled(t.planner_id,p_preview),
    'canManage',t.planner_id=app.current_planner_id() and r.state='open'
      and app.family_maintenance_enabled(t.planner_id,p_preview))
  from app.family_review_tasks t
  join app.family_review_rounds r on r.id=t.round_id and r.planner_id=t.planner_id
  join app.sharing_connections c on c.id=t.connection_id and c.planner_id=t.planner_id
  join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
  join app.planners p on p.id=t.planner_id and p.status='active'
  join app.matter_items m on m.id=t.matter_item_id and m.planner_id=t.planner_id
  left join app.sharing_grants g on g.id=t.grant_id and g.connection_id=c.id and g.matter_item_id=m.id
  left join app.family_review_settings s on s.planner_id=t.planner_id
  where t.id=p_id and (t.planner_id=app.current_planner_id() or
    (c.recipient_planner_id=app.current_planner_id() and c.status='accepted'
      and person.status not in ('revoked','archived') and g.id is not null
      and g.detail_level in ('directions','details') and m.archived_at is null
      and m.desired_outcome <> 'never_disclose'))
$$;
revoke all on function app.family_review_task(bigint, boolean) from public;
grant execute on function app.family_review_task(bigint, boolean) to continuity_app, continuity_share_service;
alter function app.family_review_task(bigint, boolean) owner to continuity_share_service;

create function app.family_review_incoming(p_preview boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x.item order by x.due_at,x.id),'[]'::jsonb) from (
    select t.id,r.due_at,app.family_review_task(t.id,p_preview) as item
    from app.family_review_tasks t join app.sharing_connections c on c.id=t.connection_id
    join app.family_review_rounds r on r.id=t.round_id
    where c.recipient_planner_id=app.current_planner_id()
    order by r.created_at desc,t.id limit 200
  ) x where x.item is not null
$$;
revoke all on function app.family_review_incoming(boolean) from public;
grant execute on function app.family_review_incoming(boolean) to continuity_app;
alter function app.family_review_incoming(boolean) owner to continuity_share_service;

create function app.respond_family_review(p_public uuid,p_version integer,p_state text,p_reason text,p_proposal jsonb,p_preview boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t app.family_review_tasks%rowtype; c app.sharing_connections%rowtype;
  m app.matter_items%rowtype; result jsonb;
begin
  select * into t from app.family_review_tasks where public_id=p_public;
  if not found then return jsonb_build_object('error','review_unavailable'); end if;
  select * into c from app.sharing_connections where id=t.connection_id for update;
  if c.status <> 'accepted' or c.recipient_planner_id is distinct from app.current_planner_id()
    then return jsonb_build_object('error','review_unavailable'); end if;
  select * into t from app.family_review_tasks where id=t.id for update;
  result := app.family_review_task(t.id,p_preview);
  if result is null then return jsonb_build_object('error','review_unavailable'); end if;
  if not app.family_maintenance_enabled(t.planner_id,p_preview) then return jsonb_build_object('error','maintenance_unavailable'); end if;
  if t.version <> p_version or not (result->>'canRespond')::boolean
    then return jsonb_build_object('error','review_changed'); end if;
  if p_state not in ('confirmed','needs_update','suggested') then return jsonb_build_object('error','invalid_review'); end if;
  if p_state='suggested' and not (result->>'canSuggest')::boolean
    then return jsonb_build_object('error','suggestion_not_allowed'); end if;
  if p_state='suggested' and (p_proposal is null or jsonb_typeof(p_proposal)<>'object'
    or p_proposal='{}'::jsonb or exists(select 1 from jsonb_each(p_proposal) kv
      where kv.key not in ('institutionName','locationHint') or jsonb_typeof(kv.value)<>'string'))
    then return jsonb_build_object('error','invalid_review'); end if;
  if p_state='needs_update' and (p_reason is null or p_reason not in ('cannot_find','outdated','unclear'))
    then return jsonb_build_object('error','invalid_review'); end if;
  update app.family_review_tasks set state=p_state,reason=case when p_state='needs_update' then p_reason end,
    proposal=case when p_state='suggested' then p_proposal end,version=version+1,responded_at=now() where id=t.id;
  insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
    values(t.planner_id,'trusted_contact','family_review.responded','family_review_task',t.public_id,
      jsonb_build_object('response',p_state,'version',t.version+1));
  return app.family_review_task(t.id,p_preview);
end $$;
revoke all on function app.respond_family_review(uuid,integer,text,text,jsonb,boolean) from public;
grant execute on function app.respond_family_review(uuid,integer,text,text,jsonb,boolean) to continuity_app;
alter function app.respond_family_review(uuid,integer,text,text,jsonb,boolean) owner to continuity_share_service;
revoke create on schema app from continuity_share_service;

-- A new immutable planned version describes the implemented review slice.
insert into app.commerce_capabilities(code,status,baseline_trust_control)
  values('family_maintenance','active',false);
insert into app.commerce_plan_versions(catalog_product_code,plan_code,version,status,effective_from)
  values('rillora_consumer','family',2,'planned',null);
insert into app.commerce_plan_capabilities(plan_version_id,capability_code,allowance,enforcement_mode)
  select target.id,old.capability_code,case when old.capability_code='trusted_people_multiple' then 5 else old.allowance end,old.enforcement_mode
  from app.commerce_plan_capabilities old join app.commerce_plan_versions source on source.id=old.plan_version_id
  cross join app.commerce_plan_versions target
  where source.plan_code='family' and source.version=1 and target.plan_code='family' and target.version=2;
insert into app.commerce_plan_capabilities(plan_version_id,capability_code,allowance,enforcement_mode)
  select id,'family_maintenance',null,'planned' from app.commerce_plan_versions where plan_code='family' and version=2;
