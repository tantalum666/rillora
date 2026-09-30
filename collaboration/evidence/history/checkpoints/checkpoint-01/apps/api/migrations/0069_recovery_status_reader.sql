-- Health reads use the existing auth role, without giving runtime direct table access.
grant create on schema app to continuity_recovery_service;
create function app.recovery_status() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('enforced',enforced,'generation',generation)
 from app.recovery_policy where singleton
$$;
revoke all on function app.recovery_status() from public;
grant execute on function app.recovery_status() to continuity_auth;
alter function app.recovery_status() owner to continuity_recovery_service;
revoke create on schema app from continuity_recovery_service;
