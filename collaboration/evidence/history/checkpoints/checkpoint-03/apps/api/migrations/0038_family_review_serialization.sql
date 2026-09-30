-- Keep review closure and recipient responses in a single ordering.
-- The service gets one column's UPDATE privilege solely for row locking;
-- runtime roles still cannot assume this nologin service role.
grant update (version) on app.family_review_rounds to continuity_share_service;
create policy family_service_round_lock on app.family_review_rounds for update
  to continuity_share_service using (true) with check (true);
grant select on app.commerce_accounts to continuity_share_service;
create policy family_account_read on app.commerce_accounts for select
  to continuity_share_service using (true);
grant create on schema app to continuity_share_service;

create or replace function app.family_maintenance_enabled(p_owner bigint, p_preview boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from app.planners where id=p_owner and status='active')
    and (p_owner=app.current_planner_id() or exists(select 1 from app.sharing_connections c
      where c.planner_id=p_owner and c.recipient_planner_id=app.current_planner_id() and c.status='accepted'))
    and (p_preview or exists(
      select 1 from app.commerce_entitlement_grants e
      join app.commerce_accounts a on a.id=e.commerce_account_id and a.planner_id=e.planner_id and a.status='active'
      left join app.commerce_subscriptions s on s.id=e.subscription_id and s.planner_id=e.planner_id
      where e.planner_id=p_owner and e.capability_code='family_maintenance'
        and (e.allowance is null or e.allowance > 0)
        and e.revoked_at is null and e.effective_at <= now()
        and (e.expires_at is null or e.expires_at > now())
        and (e.source_type <> 'subscription' or (s.state in ('active','cancel_at_period_end','grace')
          and s.current_period_ends_at > now()))
    ))
$$;

create or replace function app.respond_family_review(p_public uuid,p_version integer,p_state text,p_reason text,p_proposal jsonb,p_preview boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t app.family_review_tasks%rowtype; c app.sharing_connections%rowtype; result jsonb;
begin
  select * into t from app.family_review_tasks where public_id=p_public;
  if not found then return jsonb_build_object('error','review_unavailable'); end if;
  -- Check identity before acquiring another household's review lock.
  if not exists(select 1 from app.sharing_connections where id=t.connection_id
    and status='accepted' and recipient_planner_id=app.current_planner_id())
    then return jsonb_build_object('error','review_unavailable'); end if;
  perform 1 from app.family_review_rounds where id=t.round_id for update;
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
      where kv.key not in ('institutionName','locationHint') or jsonb_typeof(kv.value)<>'string'
        or char_length(kv.value #>> '{}') not between 1 and case when kv.key='institutionName' then 160 else 500 end))
    then return jsonb_build_object('error','invalid_review'); end if;
  if p_state='suggested' and t.source_fields || p_proposal = t.source_fields
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
revoke create on schema app from continuity_share_service;
