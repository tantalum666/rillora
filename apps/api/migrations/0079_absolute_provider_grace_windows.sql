-- Provider grace durations are elapsed hours, not local-calendar days across DST.
-- Keep the existing data and the single access-clock function; no activation changes.
grant create on schema app to continuity_share_service;
create or replace function app.commerce_subscription_access_until(s app.commerce_subscriptions)
returns timestamptz language sql stable parallel safe set search_path='' as $$
  select case
    when s.state <> 'grace' then s.current_period_ends_at
    when s.grace_ends_at is null or s.current_period_ends_at is null
      or s.grace_ends_at <= s.current_period_ends_at then null
    when s.renewal_provider = 'storekit' and s.provider_environment = 'production' then
      case when s.grace_ends_at <= s.current_period_ends_at + interval '672 hours'
        then s.grace_ends_at else null end
    else least(s.grace_ends_at, s.current_period_ends_at + interval '168 hours')
  end
$$;
revoke create on schema app from continuity_share_service;
