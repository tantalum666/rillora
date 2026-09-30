grant create on schema app to continuity_share_service;
create function app.owner_saved_sharing_preview(p_public uuid,p_grants jsonb) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('matterPublicId',m.public_id,'detailLevel',level.value,
   'fields',app.sharing_project_fields(s.fields,level.value)) order by g.id),'[]'::jsonb)
 from app.sharing_connections c
 join app.sharing_grants g on g.connection_id=c.id and g.planner_id=c.planner_id
 join app.matter_items m on m.id=g.matter_item_id and m.planner_id=c.planner_id
 join app.sharing_saved_items s on s.grant_id=g.id and s.planner_id=c.planner_id
 join jsonb_to_recordset(p_grants) requested("matterPublicId" uuid,"detailLevel" text) on requested."matterPublicId"=m.public_id
 cross join lateral (select case
   when 'name' in (g.detail_level,s.detail_level,requested."detailLevel") then 'name'
   when 'directions' in (g.detail_level,s.detail_level,requested."detailLevel") then 'directions'
   else 'details' end as value) level
 where c.planner_id=app.current_planner_id() and c.public_id=p_public and c.status='accepted'
   and m.archived_at is null and m.desired_outcome<>'never_disclose'
$$;
revoke all on function app.owner_saved_sharing_preview(uuid,jsonb) from public;
alter function app.owner_saved_sharing_preview(uuid,jsonb) owner to continuity_share_service;
grant execute on function app.owner_saved_sharing_preview(uuid,jsonb) to continuity_app;
revoke create on schema app from continuity_share_service;
