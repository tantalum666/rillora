create or replace function app.sharing_invitation_preview(p_hash bytea) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('publicId',c.public_id,'ownerName',p.display_name,'emailHint',c.recipient_email_label,
   'status','pending','expiresAt',c.invitation_expires_at)
 from app.sharing_connections c join app.planners p on p.id=c.planner_id
 join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
 where c.invitation_token_hash=p_hash and c.status='pending' and c.invitation_expires_at>now()
   and p.status='active' and person.status not in ('revoked','archived')
$$;

create index if not exists sharing_recipient_active_lookup on app.sharing_connections(recipient_planner_id,id)
 where status='accepted';

-- Bound work before JSON aggregation and decryption. This is a request budget,
-- not a creation/plan quota; oversized operations never silently omit records.
create function app.recipient_sharing_work_is_bounded() returns boolean
language sql stable security definer set search_path='' as $$
 select (select count(*) from (
  select c.id from app.sharing_connections c join app.planners p on p.id=c.planner_id and p.status='active'
  join app.people person on person.id=c.person_id and person.planner_id=c.planner_id and person.status not in ('revoked','archived')
  where c.recipient_planner_id=app.current_planner_id() and c.status='accepted' limit 201
 ) connections)<=200 and (select count(*) from (
  select g.id from app.sharing_connections c join app.planners p on p.id=c.planner_id and p.status='active'
  join app.people person on person.id=c.person_id and person.planner_id=c.planner_id and person.status not in ('revoked','archived')
  join app.sharing_grants g on g.connection_id=c.id and g.planner_id=c.planner_id
  join app.matter_items m on m.id=g.matter_item_id and m.planner_id=c.planner_id
  cross join lateral(select app.sharing_connection_mode(c.id) as value) mode
  left join app.sharing_saved_items saved on saved.grant_id=g.id and saved.planner_id=c.planner_id
  where c.recipient_planner_id=app.current_planner_id() and c.status='accepted'
    and m.archived_at is null and m.desired_outcome<>'never_disclose'
    and (mode.value='live' or (mode.value='saved' and saved.grant_id is not null)) limit 501
 ) items)<=500
$$;
revoke all on function app.recipient_sharing_work_is_bounded() from public;
grant execute on function app.recipient_sharing_work_is_bounded() to continuity_app;
alter function app.recipient_sharing_work_is_bounded() owner to continuity_share_service;
