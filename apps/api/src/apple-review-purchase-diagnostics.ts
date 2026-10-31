import type { PoolClient } from 'pg';

type Client = Pick<PoolClient, 'query'>;
export type AppleReviewPurchaseDiagnostic = {
  order_reference: string;
  state: string;
  order_status: string;
  amount_minor: string;
  currency_code: string;
  minor_unit_exponent: number;
  storefront_country_code: string;
  price_code: string;
  consent_version: string | null;
  terms_version: string | null;
  created_at: Date;
  started_at: Date | null;
  has_original_transaction: boolean;
  receipt_price_milliunits: string | null;
  receipt_currency_code: string | null;
  receipt_purchased_at: Date | null;
  subscription_state: string | null;
  current_period_ends_at: Date | null;
  last_event_status: string | null;
  last_event_error_code: string | null;
  last_event_signature_verified: boolean | null;
};

/** Existing operator inspection only: no tokens, signed payloads, identity or customer content. */
export async function inspectAppleReviewPurchases(client: Client, reviewPlannerIds: string[]) {
  if (reviewPlannerIds.length === 0) return [];
  if (reviewPlannerIds.length > 500 || reviewPlannerIds.some(id => !/^[1-9][0-9]*$/.test(id))) {
    throw new Error('Invalid bounded review inspection scope');
  }
  const result = await client.query<AppleReviewPurchaseDiagnostic>(`select
      o.public_id::text as order_reference,s.state,o.status as order_status,o.amount_minor::text,o.currency_code,
      price.minor_unit_exponent,s.storefront_country_code,price.price_code,
      consent.consent_version,consent.terms_version,s.created_at,s.started_at,
      s.original_transaction_reference is not null as has_original_transaction,
      receipt.price_milliunits::text as receipt_price_milliunits,receipt.currency_code as receipt_currency_code,
      receipt.purchased_at as receipt_purchased_at,subscription.state as subscription_state,
      subscription.current_period_ends_at,inbox_event.processing_status as last_event_status,
      inbox_event.last_error_code as last_event_error_code,inbox_event.signature_verified as last_event_signature_verified
    from app.commerce_apple_purchase_sessions s
    join app.commerce_orders o on o.id=s.order_id and o.planner_id=s.planner_id
    join app.commerce_validation_accounts enrollment on enrollment.planner_id=s.planner_id
    join app.planners planner on planner.id=s.planner_id and planner.status='active'
    join app.commerce_prices price on price.id=o.price_id
    left join app.commerce_purchase_consents consent on consent.order_id=o.id and consent.planner_id=o.planner_id
    left join lateral(select r.price_milliunits,r.currency_code,r.purchased_at,r.subscription_id
      from app.commerce_apple_transaction_receipts r where r.planner_id=s.planner_id and r.provider_environment='sandbox'
        and r.original_transaction_reference=s.original_transaction_reference
      order by r.purchased_at desc,r.transaction_reference desc limit 1) receipt on true
    left join app.commerce_subscriptions subscription on subscription.id=receipt.subscription_id
      and subscription.planner_id=s.planner_id and subscription.provider_environment='sandbox'
    left join lateral(select i.processing_status,i.last_error_code,i.signature_verified
      from app.commerce_provider_event_inbox i where i.provider_code='storekit' and i.provider_environment='sandbox'
        and (i.account_binding_reference=s.app_account_token
          or i.provider_subscription_reference=s.original_transaction_reference)
      order by i.received_at desc,i.id desc limit 1) inbox_event on true
    where s.planner_id=any($1::bigint[]) and o.provider_code='storekit'
      and o.provider_environment='sandbox'
      and (s.state in ('prepared','started','pending') or s.updated_at>=statement_timestamp()-interval '7 days')
    order by s.created_at,o.id limit 501`, [[...new Set(reviewPlannerIds)]]);
  if (result.rows.length > 500) throw new Error('Review purchase inspection exceeds its bound');
  return result.rows;
}
