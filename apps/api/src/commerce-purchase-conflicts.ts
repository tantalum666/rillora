import type { PoolClient } from 'pg';
import { ApiError } from './errors.js';

export async function assertFamilyPriceReady(client:PoolClient,priceId:string):Promise<void> {
  const result=await client.query(`select count(*)=2 as ready from app.commerce_prices price
    join app.commerce_plan_versions plan on plan.id=price.plan_version_id
    join app.commerce_plan_capabilities cap on cap.plan_version_id=plan.id
    where price.id=$1 and plan.plan_code='family' and plan.status='active'
      and cap.enforcement_mode in ('included','metered_limit')
      and ((cap.capability_code='trusted_people_multiple' and cap.allowance=5)
        or (cap.capability_code='family_maintenance' and (cap.allowance is null or cap.allowance>0)))`,[priceId]);
  if(!result.rows[0]?.ready)throw new ApiError(409,'billing_closed','The included Family features are not available for purchase yet.');
}

/** Caller holds the shared checkout advisory lock. An expired prepared quote has
 * never opened a sheet; a started/pending payment has no such safe time limit. */
export async function expirePreparedApplePurchases(client: PoolClient): Promise<void> {
  await client.query(`with expired as (
      update app.commerce_apple_purchase_sessions set state='closed',updated_at=now()
      where planner_id=app.current_planner_id() and state='prepared' and prepared_until<=now()
      returning order_id)
    update app.commerce_orders set status='canceled',updated_at=now()
      where id in(select order_id from expired) and status='created'`);
}

export async function isTestCommerceAccount(client: PoolClient): Promise<boolean> {
  const result = await client.query<{ testing: boolean }>(`select app.commerce_validation_enabled()
      or exists(select 1 from app.commerce_subscriptions where planner_id=app.current_planner_id()
        and provider_environment in ('sandbox','test'))
      or exists(select 1 from app.commerce_orders where planner_id=app.current_planner_id()
        and provider_environment in ('sandbox','test')) as testing`);
  return result.rows[0]?.testing === true;
}

export async function assertNoForeignPurchase(client: PoolClient, provider: 'stripe' | 'storekit',
  environment: 'production' | 'sandbox' = 'production'): Promise<void> {
  // Review identities never become real payers merely because their enrollment
  // expired. Retire their synthetic ledger explicitly, or use a customer account.
  if (environment === 'production' && await isTestCommerceAccount(client)) {
    throw new ApiError(409,'test_account_real_purchase_blocked','Testing accounts cannot make real purchases. Use a separate customer account.');
  }
  if (!(await client.query('select app.commerce_planner_can_purchase() as allowed')).rows[0]?.allowed) {
    throw new ApiError(409,'billing_account_unavailable','Your account cannot start a purchase right now.');
  }
  await expirePreparedApplePurchases(client);
  const conflict = (await client.query(`select exists(select 1 from app.commerce_subscriptions
      where planner_id=app.current_planner_id() and provider_environment='production' and renewal_provider<>$1
        and (state in ('previewing','active','cancel_at_period_end','grace','past_due')
          or renewal_is_possible is distinct from false)) as subscription,
    exists(select 1 from app.commerce_orders where planner_id=app.current_planner_id()
      and provider_environment='production' and provider_code<>$1
      and status in ('created','pending','paid_pending_reconciliation')) as checkout`, [provider])).rows[0];
  if (conflict.subscription) throw new ApiError(409, 'existing_subscription', 'Manage your existing subscription before starting another.');
  if (conflict.checkout) throw new ApiError(409, 'unfinished_checkout', 'Finish or cancel your other checkout before starting another.');
}
