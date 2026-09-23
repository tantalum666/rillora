-- Keep the recipient projection explicit when future private detail fields are added.
create or replace function app.recipient_shared_items() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'connectionPublicId', c.public_id, 'ownerName', owner.display_name,
    'matterPublicId', m.public_id, 'detailLevel', g.detail_level,
    'fields', jsonb_strip_nulls(jsonb_build_object('title', m.title, 'category', m.category)
      || case when g.detail_level in ('directions', 'details') then jsonb_build_object(
        'institutionName', m.institution_name, 'locationHint', m.location_hint, 'desiredOutcome', m.desired_outcome) else '{}'::jsonb end
      || case when g.detail_level = 'details' then jsonb_build_object(
        'accountHint', m.account_hint, 'valueBand', m.value_band, 'currencyCode', m.currency_code, 'importance', m.importance, 'notes', m.notes) || jsonb_build_object(
        'assetType', m.details->'assetType',
        'debtType', m.details->'debtType',
        'documentType', m.details->'documentType',
        'deviceModel', m.details->'deviceModel',
        'billingCycle', m.details->'billingCycle',
        'renewalDate', m.details->'renewalDate',
        'cryptoCustody', m.details->'cryptoCustody',
        'network', m.details->'network',
        'walletAddress', m.details->'walletAddress',
        'walletLabel', m.details->'walletLabel',
        'assetSymbol', m.details->'assetSymbol') else '{}'::jsonb end)
  ) order by c.id, g.id), '[]'::jsonb)
  from app.sharing_connections c
  join app.planners owner on owner.id = c.planner_id and owner.status = 'active'
  join app.people person on person.id = c.person_id and person.planner_id = c.planner_id and person.status not in ('revoked', 'archived')
  join app.sharing_grants g on g.connection_id = c.id and g.planner_id = c.planner_id
  join app.matter_items m on m.id = g.matter_item_id and m.planner_id = c.planner_id
  where c.recipient_planner_id = app.current_planner_id() and c.status = 'accepted'
    and m.archived_at is null and m.desired_outcome <> 'never_disclose'
$$;
revoke all on function app.recipient_shared_items() from public;
grant execute on function app.recipient_shared_items() to continuity_app;
alter function app.recipient_shared_items() owner to continuity_share_service;

