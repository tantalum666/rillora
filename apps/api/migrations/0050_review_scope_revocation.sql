-- A narrowed grant keeps its paid snapshot identity, but it must not revive
-- a previously withdrawn review task when the owner expands sharing later.
alter table app.family_review_tasks add column access_revoked_at timestamptz;
grant update(access_revoked_at) on app.family_review_tasks to continuity_share_service;
grant create on schema app to continuity_share_service;
create function app.revoke_narrowed_review_access() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.detail_level in ('directions','details') and new.detail_level='name' then
   update app.family_review_tasks set access_revoked_at=coalesce(access_revoked_at,statement_timestamp()) where grant_id=new.id;
 end if;
 return new;
end $$;
revoke all on function app.revoke_narrowed_review_access() from public;
alter function app.revoke_narrowed_review_access() owner to continuity_share_service;
create trigger revoke_narrowed_review_access after update of detail_level on app.sharing_grants
 for each row execute function app.revoke_narrowed_review_access();
create or replace function app.family_review_task(p_id bigint, p_preview boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'publicId',t.public_id,'roundPublicId',r.public_id,'roundState',r.state,
    'matterPublicId',m.public_id,'connectionPublicId',c.public_id,
    'ownerName',p.display_name,'personName',person.display_name,'title',m.title,
    'state',t.state,'version',t.version,'sourceVersion',t.source_version,
    'currentVersion',m.version,'fields',t.source_fields,'proposal',t.proposal,
    'reason',t.reason,'dueAt',r.due_at,'respondedAt',t.responded_at,'decidedAt',t.decided_at,
    'scopeAvailable',t.access_revoked_at is null and c.status='accepted' and person.status not in ('revoked','archived')
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
    (t.access_revoked_at is null and c.recipient_planner_id=app.current_planner_id() and c.status='accepted'
      and person.status not in ('revoked','archived') and g.id is not null
      and g.detail_level in ('directions','details') and m.archived_at is null
      and m.desired_outcome <> 'never_disclose' and app.sharing_connection_mode(c.id)='live'))
$$;
revoke all on function app.family_review_task(bigint, boolean) from public;
grant execute on function app.family_review_task(bigint, boolean) to continuity_app, continuity_share_service;
alter function app.family_review_task(bigint, boolean) owner to continuity_share_service;


create or replace function app.family_maintenance_enabled(p_owner bigint,p_preview boolean) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.planners where id=p_owner and status='active')
 and (p_owner=app.current_planner_id() or exists(select 1 from app.sharing_connections c
   where c.planner_id=p_owner and c.recipient_planner_id=app.current_planner_id() and c.status='accepted'))
 and ((p_preview and not app.sharing_limits_enabled(p_owner)) or exists(
   select 1 from app.commerce_entitlement_grants e
   join app.commerce_accounts a on a.id=e.commerce_account_id and a.planner_id=e.planner_id and a.status='active'
   where e.planner_id=p_owner and e.capability_code='family_maintenance' and (e.allowance is null or e.allowance>0)
     and e.effective_at<=statement_timestamp() and e.expires_at>statement_timestamp() and e.revoked_at is null
     and ((not app.sharing_limits_enabled(p_owner) and e.source_type<>'subscription') or exists(select 1 from app.sharing_family_grant(p_owner) allowed
       join app.commerce_entitlement_grants linked on linked.id=allowed.id
       where linked.subscription_id is not distinct from e.subscription_id and linked.source_type=e.source_type))))
$$;

revoke create on schema app from continuity_share_service;
