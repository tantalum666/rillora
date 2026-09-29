import type { PoolClient } from 'pg';
import { z } from 'zod';
import { withCommercePlannerDatabase, type DatabasePool } from './db.js';
import { ApiError } from './errors.js';
import { loadApplePurchaseQuote, type ApplePurchaseSelection } from './apple-purchase-catalog.js';
import { appleQuoteSchema, applePurchaseConsentSchema, applePurchaseConsentDigest, applePurchaseTerms,
  type ApplePurchaseQuote, type ApplePurchaseConsent } from './apple-purchase-consent.js';
import { appleProductionContext, assertAppleContext, requireAppleReviewEnrollment, type AppleExecutionContext } from './apple-execution-context.js';
import { assertNoForeignPurchase, expirePreparedApplePurchases } from './commerce-purchase-conflicts.js';

export class ApplePurchasePreflight {
  constructor(private readonly pool: DatabasePool, readonly context: AppleExecutionContext = appleProductionContext) { assertAppleContext(context); }

  async current(plannerId:string) {
    return withCommercePlannerDatabase(this.pool,plannerId,async client=>{
      await lockCheckout(client); await requireAppleReviewEnrollment(client,this.context);await expirePreparedApplePurchases(client);
      const row=(await client.query<{order_reference:string;client_nonce:string;state:string}>(`select o.public_id::text as order_reference,
          s.client_nonce::text,s.state from app.commerce_apple_purchase_sessions s join app.commerce_orders o on o.id=s.order_id
        where s.planner_id=app.current_planner_id() and s.state in ('prepared','started','pending')
          and o.status in ('created','pending') and o.provider_environment=$1 order by s.created_at desc limit 1`,[this.context.environment])).rows[0];
      return {purchase:row?{orderReference:row.order_reference,nonce:row.client_nonce,state:row.state}:null};
    });
  }

  async quote(plannerId: string, selection: ApplePurchaseSelection) {
    return withCommercePlannerDatabase(this.pool, plannerId, async client => ({
      contractVersion: 'commerce-apple-purchase-v1', quote: (await loadApplePurchaseQuote(client, selection, this.context)).quote,
      purchaseTerms: applePurchaseTerms, requiresFreshEvaluation: true, ...this.executionMetadata(),
    }));
  }

  async prepare(input: { plannerId: string; plannerPublicId: string; nonce: string;
    quote: ApplePurchaseQuote; consent: ApplePurchaseConsent }) {
    const nonce = z.uuid().parse(input.nonce);
    const quote = appleQuoteSchema.parse(input.quote), consent = applePurchaseConsentSchema.parse(input.consent);
    const digest = applePurchaseConsentDigest(quote, consent);
    return withCommercePlannerDatabase(this.pool, input.plannerId, async client => {
      await lockCheckout(client); await requireAppleReviewEnrollment(client,this.context);
      await expirePreparedApplePurchases(client);
      const old = (await client.query<{ order_reference: string; state: string; provider_environment: string; acceptance_sha256: Buffer }>(
        `select o.public_id::text as order_reference,s.state,o.provider_environment,c.acceptance_sha256 from app.commerce_apple_purchase_sessions s
          join app.commerce_orders o on o.id=s.order_id join app.commerce_purchase_consents c on c.order_id=o.id
          where s.planner_id=app.current_planner_id() and s.client_nonce=$1`, [nonce])).rows[0];
      if (old) {
        if (old.provider_environment!==this.context.environment || !old.acceptance_sha256.equals(digest)) throw new ApiError(409,'purchase_terms_changed','Review the current subscription terms.');
        if (['closed','completed'].includes(old.state)) throw new ApiError(409,'checkout_finished','This purchase has finished. Refresh your access.');
        return {...intent(old.order_reference, input.plannerPublicId, old.state),...this.executionMetadata()};
      }
      const current = await loadApplePurchaseQuote(client, quote,this.context);
      if (JSON.stringify(current.quote) !== JSON.stringify(quote)) throw new ApiError(409,'purchase_terms_changed','Review the current Apple price before continuing.');
      await assertApplePurchaseClear(client,this.context);
      const account = (await client.query<{ id: string }>(`with inserted as (
          insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code,status)
          select planner_id,id,'global',$1,'active' from app.plans where planner_id=app.current_planner_id()
          on conflict(plan_id,operating_plane_code) do nothing returning id)
        select id::text from inserted union all select id::text from app.commerce_accounts
          where planner_id=app.current_planner_id() and operating_plane_code='global' and service_market_code=$1 and status='active'
        limit 1`, [quote.serviceMarketCode])).rows[0];
      if (!account) throw new ApiError(409,'billing_account_unavailable','Your billing account is not available for this service market.');
      const order = (await client.query<{ id: string; public_id: string }>(`insert into app.commerce_orders(
          planner_id,commerce_account_id,operator_code,price_id,purchase_route_policy_code,purchase_route_policy_version,
          provider_code,provider_environment,amount_minor,currency_code,status)
        values(app.current_planner_id(),$1,$2,$3,$4,$5,'storekit',$8,$6,$7,'created') returning id::text,public_id::text`,
      [account.id,current.operatorCode,current.priceId,current.routeCode,current.routeVersion,quote.amountMinor,quote.currency,this.context.environment])).rows[0]!;
      await client.query(`insert into app.commerce_apple_purchase_sessions(order_id,planner_id,client_nonce,binding_code,storefront_country_code,state)
        values($1,app.current_planner_id(),$2,$3,$4,'prepared')`, [order.id,nonce,quote.bindingCode,quote.storefrontCountryCode]);
      await client.query(`insert into app.commerce_purchase_consents(planner_id,order_id,consent_version,terms_version,
          subscription_terms_version,refund_policy_version,legal_bundle_sha256,acceptance_sha256,price_code,amount_minor,currency_code,billing_interval)
        values(app.current_planner_id(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'annual')`,
      [order.id,consent.version,consent.termsVersion,consent.subscriptionTermsVersion,consent.refundPolicyVersion,
        Buffer.from(consent.legalBundleSha256,'hex'),digest,quote.priceCode,quote.amountMinor,quote.currency]);
      return {...intent(order.public_id,input.plannerPublicId,'prepared'),...this.executionMetadata()};
    });
  }

  async transition(input: { plannerId: string; orderReference: string; action: 'start' | 'pending' | 'cancel' }) {
    return withCommercePlannerDatabase(this.pool,input.plannerId,async client => {
      await lockCheckout(client); await requireAppleReviewEnrollment(client,this.context); await expirePreparedApplePurchases(client);
      const row = (await client.query<{ id: string; state: string; binding_code: string; service_market_code: string; storefront_country_code: string }>(
        `select o.id::text,s.state,s.binding_code,a.service_market_code,s.storefront_country_code
          from app.commerce_apple_purchase_sessions s join app.commerce_orders o on o.id=s.order_id
          join app.commerce_accounts a on a.id=o.commerce_account_id
          where o.public_id=$1 and o.planner_id=app.current_planner_id() and o.provider_environment=$2 for update of s,o`,[input.orderReference,this.context.environment])).rows[0];
      if (!row) throw new ApiError(404,'purchase_not_found','This purchase is not available.');
      if (row.state==='completed') return { state:'completed',...this.executionMetadata() };
      if (row.state==='closed') throw new ApiError(409,'checkout_finished','This purchase has closed. Review the current price.');
      if (input.action==='start') {
        const current=await loadApplePurchaseQuote(client,{serviceMarketCode:row.service_market_code,storefrontCountryCode:row.storefront_country_code},this.context);
        if(current.quote.bindingCode!==row.binding_code) throw new ApiError(409,'purchase_terms_changed','Review the current Apple price.');
        await assertApplePurchaseClear(client,this.context,row.id);
      }
      const next=input.action==='start'?'started':input.action==='pending'?'pending':'closed';
      await client.query('update app.commerce_apple_purchase_sessions set state=$2,updated_at=now() where order_id=$1',[row.id,next]);
      await client.query('update app.commerce_orders set status=$2,updated_at=now() where id=$1 and status in (\'created\',\'pending\')',
        [row.id,input.action==='cancel'?'canceled':'pending']);
      return { state:next,...this.executionMetadata() };
    });
  }
  private executionMetadata() {
    return {environment:this.context.environment,validationOnly:this.context.validationOnly};
  }
}

async function lockCheckout(client: PoolClient) {
  await client.query("select pg_advisory_xact_lock(hashtextextended('checkout:' || app.current_planner_id()::text,0))");
}
async function assertApplePurchaseClear(client: PoolClient, context: AppleExecutionContext, ownOrderId: string | null = null) {
  await assertNoForeignPurchase(client,'storekit');
  if ((await client.query(`select 1 from app.commerce_subscriptions where planner_id=app.current_planner_id()
      and provider_environment=$2 and renewal_provider='storekit'
      and (state in ('previewing','active','cancel_at_period_end','grace','past_due') or renewal_is_possible is distinct from false)
    union all select 1 from app.commerce_orders where planner_id=app.current_planner_id()
      and provider_code='storekit' and provider_environment=$2 and ($1::bigint is null or id<>$1)
      and status in ('created','pending','paid_pending_reconciliation') limit 1`,[ownOrderId,context.environment])).rowCount) {
    throw new ApiError(409,'apple_purchase_in_progress','Restore or finish your existing Apple purchase before starting another.');
  }
}
function intent(orderReference:string,token:string,state:string) {
  return { contractVersion:'commerce-apple-purchase-v1',orderReference,appAccountToken:token.toLowerCase(),state,grantsAccess:false };
}
