grant create on schema app to continuity_share_service;
create function app.sharing_pause_live(p_public uuid,p_version integer,p_access_version integer) returns void
language plpgsql security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); c app.sharing_connections%rowtype;
begin
 if actor is null then raise exception 'sharing_unauthorized'; end if;
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||actor::text,0));
 select * into c from app.sharing_connections where public_id=p_public and planner_id=actor and status<>'revoked' for update;
 if not found or c.version<>p_version or coalesce((select version from app.sharing_preferences where planner_id=actor),0)<>p_access_version
 then raise exception 'sharing_changed'; end if;
 update app.sharing_preferences set free_connection_id=null,version=version+1 where planner_id=actor and free_connection_id=c.id;
 update app.sharing_connections set live_entitlement_id=null,version=version+1,updated_at=now() where id=c.id;
 insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
 values(actor,'planner','sharing.updates_paused','sharing_connection',c.public_id,jsonb_build_object('purpose','planner_directed'));
end $$;
revoke all on function app.sharing_pause_live(uuid,integer,integer) from public;
alter function app.sharing_pause_live(uuid,integer,integer) owner to continuity_share_service;
grant execute on function app.sharing_pause_live(uuid,integer,integer) to continuity_app;

create function app.commerce_subscription_effective(p_id bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.commerce_subscriptions s where s.id=p_id and s.planner_id=app.current_planner_id()
   and s.state in ('active','cancel_at_period_end','grace','previewing')
   and ((s.provider_environment='internal' and s.acquisition_type in ('migration','support_override')
         and (s.current_period_ends_at is null or s.current_period_ends_at>statement_timestamp()))
     or (s.current_period_starts_at<=statement_timestamp()
       and (case when s.state='grace' then least(s.grace_ends_at,s.current_period_ends_at+interval '7 days') else s.current_period_ends_at end)>statement_timestamp()
       and ((s.provider_environment='production' and (select production_entitlements_enabled from app.commerce_runtime_policy where singleton))
         or (s.provider_environment in ('test','sandbox') and exists(select 1 from app.commerce_validation_accounts v
           where v.planner_id=s.planner_id and v.expires_at>statement_timestamp())))))
   and exists(select 1 from app.commerce_entitlement_grants e where e.subscription_id=s.id and e.revoked_at is null
     and e.effective_at<=statement_timestamp() and (e.expires_at is null or e.expires_at>statement_timestamp())))
$$;
revoke all on function app.commerce_subscription_effective(bigint) from public;
alter function app.commerce_subscription_effective(bigint) owner to continuity_share_service;
grant execute on function app.commerce_subscription_effective(bigint) to continuity_app;
revoke create on schema app from continuity_share_service;
