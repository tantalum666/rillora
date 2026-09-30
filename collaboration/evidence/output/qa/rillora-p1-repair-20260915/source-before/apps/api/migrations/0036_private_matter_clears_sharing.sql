grant create on schema app to continuity_share_service;
grant delete on app.sharing_grants to continuity_share_service;
create function app.clear_private_matter_sharing() returns trigger
language plpgsql security definer set search_path = '' as $$
declare affected bigint[];
begin
  if (new.archived_at is not null and old.archived_at is null)
     or (new.desired_outcome = 'never_disclose' and old.desired_outcome is distinct from 'never_disclose') then
    with removed as (
      delete from app.sharing_grants where matter_item_id = new.id and planner_id = new.planner_id
      returning connection_id
    ) select array_agg(connection_id) into affected from removed;
    if affected is not null then
      update app.sharing_connections set version = version + 1, updated_at = now()
        where id = any(affected) and planner_id = new.planner_id;
      insert into app.audit_events(planner_id, actor_type, action, resource_type, resource_public_id, metadata)
        values(new.planner_id, 'planner', 'sharing.matter_access_removed', 'matter', new.public_id,
          jsonb_build_object('purpose', 'planner_directed', 'connectionCount', cardinality(affected)));
    end if;
  end if;
  return new;
end $$;
revoke all on function app.clear_private_matter_sharing() from public;
alter function app.clear_private_matter_sharing() owner to continuity_share_service;
create trigger private_matter_clears_sharing after update of desired_outcome, archived_at on app.matter_items
  for each row execute function app.clear_private_matter_sharing();
revoke create on schema app from continuity_share_service;
