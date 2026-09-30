-- Run with the existing migration identity after both clients and API pass
-- release acceptance. This does not enable sales or production entitlements.
begin;
lock table app.sharing_connections in share row exclusive mode;
lock table app.sharing_preferences in share row exclusive mode;
select singleton from app.commerce_runtime_policy where singleton for update;
do $$
begin
  if exists (
    select c.planner_id from app.sharing_connections c
    join app.people p on p.id=c.person_id and p.status not in ('revoked','archived')
    where c.status='accepted' or (c.status='pending' and c.invitation_expires_at>now())
    group by c.planner_id having count(*)>1
      and not exists(select 1 from app.sharing_family_grant(c.planner_id)) and not exists (
      select 1 from app.sharing_preferences f join app.sharing_connections chosen on chosen.id=f.free_connection_id
      join app.audit_events a on a.planner_id=f.planner_id and a.resource_public_id=chosen.public_id
        and a.action='sharing.free_recipient_selected'
      where f.planner_id=c.planner_id
    )
  ) then
    raise exception 'Existing multi-person beta sharing needs an explicit owner choice before global activation';
  end if;
end $$;
-- A sole existing invitation is already the owner's deliberate one-person path.
insert into app.sharing_preferences(planner_id,free_connection_id)
select c.planner_id,min(c.id) from app.sharing_connections c
join app.people p on p.id=c.person_id and p.status not in ('revoked','archived')
where (c.status='accepted' or (c.status='pending' and c.invitation_expires_at>now()))
  and not exists(select 1 from app.sharing_preferences f where f.planner_id=c.planner_id)
group by c.planner_id having count(*)=1;
update app.commerce_runtime_policy set sharing_limits_enabled=true where singleton;
commit;
