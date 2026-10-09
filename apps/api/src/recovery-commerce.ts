import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {DatabasePool} from './db.js';
import {parseRecoveryControl,recoveryCommerceInventorySchema,type RecoveryControl} from './recovery-journal.js';
import {validateRecoveryHost} from './recovery-replay.js';
import type {RecoveryProviderReader,RecoveryProviderObservation} from './recovery-commerce-readers.js';
import {reconcileCommerceProviderState} from './commerce-reconciliation.js';
import {recordSubscriptionObservation,persistReconciliation} from './commerce-subscription-ledger.js';
import {resolveAppleReceiptPrice,persistAppleReceipt} from './apple-production-receipts.js';
import {appleProductionContext,appleReviewContext} from './apple-execution-context.js';

/** Only a quarantined administrator may refresh current provider facts. The
 * current journal inventory is mandatory; old empty markers never auto-clear. */
export async function reconcileRecoveryCommerce(pool:DatabasePool,controls:RecoveryControl[],generation:string,reader:RecoveryProviderReader){
 if(process.env.NODE_ENV!=='test'){
  const ssl=pool.options.ssl;validateRecoveryHost(pool.options.host??'',typeof ssl==='object'&&ssl.rejectUnauthorized===true);
 }
 const events=controls.map(parseRecoveryControl).filter(e=>e.kind==='unreconciled_access');
 if(events.length>100)throw Error('Commerce recovery needs bounded offline batches');
 let reconciled=0,providerReads=0;
 for(const event of events){
  const client=await pool.connect();
  try{
   await client.query('begin');
   if(!(await client.query("select pg_has_role(session_user,'continuity_recovery_service','member') as allowed")).rows[0]?.allowed)throw Error('Recovery administrator is required');
   if((await client.query('select generation from app.recovery_policy where singleton')).rows[0]?.generation!==generation)throw Error('Recovery generation mismatch');
   await client.query("select pg_advisory_xact_lock(hashtextextended('recovery-commerce',0)),set_config('app.recovery_replay','true',true)");
   const prior=(await client.query('select revision::text from app.recovery_controls where entity_key=$1',[event.key])).rows[0];
   if(prior&&BigInt(prior.revision)>=BigInt(event.revision)){await client.query('commit');continue;}
   const inventory=recoveryCommerceInventorySchema.parse(event.facts);
   if(inventory.manualAccess||!inventory.subscriptions.length||providerReads+inventory.subscriptions.length>20)throw Error('Current complete provider inventory or manual access review is required');
   const owner=(await client.query("select p.id::text,plan.id::text as plan_id from app.planners p join app.plans plan on plan.planner_id=p.id where p.public_id=$1 and p.status='active'",[event.id])).rows;
   if(owner.length!==1)throw Error('Missing or inactive restored owner needs explicit identity and financial recovery');
   const refs=inventory.subscriptions;
   const key=(r:{provider:string;environment:string;reference:string|null;account:string})=>JSON.stringify([r.provider,r.environment,r.reference,r.account]);
   if(new Set(refs.map(key)).size!==refs.length)throw Error('Ambiguous recovery inventory');
   const restored=(await client.query(`select s.renewal_provider as provider,s.provider_environment as environment,s.provider_subscription_reference as reference,a.public_id as account
    from app.commerce_subscriptions s join app.commerce_accounts a on a.id=s.commerce_account_id where s.planner_id=$1`,[owner[0].id])).rows;
   if(restored.some(r=>!refs.some(ref=>key(ref)===key(r))))throw Error('Restored subscription missing from current journal inventory');
   const observations:RecoveryProviderObservation[]=[];
   for(const ref of refs){
    if(!ref.reference||ref.acquisition!=='purchased'||ref.plane!=='global'||ref.market!=='GLOBAL_US')throw Error('Unsupported recovery subscription');
    const observation=await reader(ref,event.id);providerReads++;
    const s=observation.snapshot,at=Date.parse(s.observedAt);
    if(s.provider!==ref.provider||s.providerEnvironment!==ref.environment||s.providerSubscriptionReference!==ref.reference
     ||s.commerceAccountReference!==ref.account||s.planCode!=='family'||!s.priceCode||!Number.isFinite(at)
     ||!Number.isFinite(Date.parse(event.recordedAt))||at<Date.parse(event.recordedAt)||Math.abs(Date.now()-at)>5*60_000
     ||s.source!==(s.provider==='stripe'?'stripe_api':'app_store_server_api_signed_status'))throw Error('Recovery observation scope or freshness mismatch');
    if(s.provider==='storekit'&&(!observation.apple||observation.apple.receipt.originalTransactionId!==ref.reference))throw Error('Verified Apple receipt required');
    if(s.provider==='stripe'&&(!Object.hasOwn(observation,'financialOverride')||typeof observation.disputeResolved!=='boolean'
     ||!observation.stripePrice||!observation.stripeProduct||s.providerCustomerReference!==ref.customer))throw Error('Current Stripe financial verification is required');
    observations.push(observation);
   }
   const decisions=reconcileCommerceProviderState({signals:[],snapshots:observations.map(o=>o.snapshot)}).entitlementDecisions;
   if(decisions.some(d=>d.directive==='hold'))throw Error('Conflicting current providers keep recovery quarantined');
   if(observations.some(o=>Math.abs(Date.now()-Date.parse(o.snapshot.observedAt))>5*60_000))throw Error('Recovery provider observations expired before commit');
   // End old provider rows before restoring one current access-bearing row.
   observations.sort((a,b)=>Number(['active','cancel_at_period_end','grace','past_due'].includes(a.snapshot.state))-Number(['active','cancel_at_period_end','grace','past_due'].includes(b.snapshot.state)));
   for(const observation of observations){
    const s=observation.snapshot,ref=refs.find(r=>r.provider===s.provider&&r.environment===s.providerEnvironment&&r.reference===s.providerSubscriptionReference)!;
    const existing=(await client.query('select id::text,planner_id::text,status,service_market_code from app.commerce_accounts where public_id=$1',[ref.account])).rows[0];
    if(existing&&(existing.planner_id!==owner[0].id||existing.status!=='active'||existing.service_market_code!==ref.market))throw Error('Restored commerce ownership mismatch');
    const account=existing??(await client.query(`insert into app.commerce_accounts(public_id,planner_id,plan_id,operating_plane_code,service_market_code,status)
     values($1,$2,$3,'global',$4,'active') returning id::text`,[ref.account,owner[0].id,owner[0].plan_id,ref.market])).rows[0];
    await client.query('set local role continuity_commerce');await client.query("select set_config('app.current_planner_id',$1,true)",[owner[0].id]);
    await commitObservation(client,{commerceAccountId:account.id,publicId:ref.account},observation,event);
    await client.query('reset role');
   }
   await client.query(`insert into app.recovery_controls(entity_key,kind,entity_public_id,revision,published)
    values($1,'unreconciled_access',$2,$3,true) on conflict(entity_key) do update set revision=excluded.revision,published=true`,[event.key,event.id,event.revision]);
   await client.query('commit');reconciled++;
  }catch(error){await client.query('rollback');throw error;}finally{client.release();}
 }
 return {reconciledOwners:reconciled,providerReads,customerTrafficEnabled:false};
}

async function commitObservation(client:PoolClient,context:{commerceAccountId:string;publicId:string},observation:RecoveryProviderObservation,event:RecoveryControl){
 let s=observation.snapshot,override=observation.financialOverride??null;
 const prior=(await client.query(`select provider_invoice_reference,financial_state_override from app.commerce_subscriptions
  where planner_id=app.current_planner_id() and renewal_provider=$1 and provider_environment=$2 and provider_subscription_reference=$3`,
  [s.provider,s.providerEnvironment,s.providerSubscriptionReference])).rows[0];
 if(s.provider==='stripe'&&prior?.provider_invoice_reference===s.providerInvoiceReference){
  if(prior.financial_state_override==='refunded'&&observation.refundResolved!==true)override='refunded';
  if(prior.financial_state_override==='revoked'&&!observation.disputeResolved)override??='revoked';
  if(override)s={...s,state:override,cancelAtPeriodEnd:false};
 }
 const appleContext=s.providerEnvironment==='sandbox'?appleReviewContext:appleProductionContext;
 const price=observation.apple?await resolveAppleReceiptPrice(client,observation.apple.receipt,appleContext):
  (await client.query(`select p.id::text,p.plan_version_id::text from app.commerce_prices p join app.commerce_storefront_products sku on sku.price_id=p.id
   join app.commerce_plan_versions pv on pv.id=p.plan_version_id
   where p.price_code=$1 and sku.provider_code='stripe' and sku.provider_environment=$2 and p.purchase_channel='web'
    and p.status=any($3::text[]) and sku.status=any($3::text[]) and sku.provider_account_reference='acct_1U6B2RCxTlowhyiG'
    and sku.external_product_reference=$4 and sku.external_parent_product_reference=$5
    and p.amount_minor=$6 and p.currency_code=upper($7) and pv.version=$8
    and p.billing_interval=$9 limit 2`,[s.priceCode,s.providerEnvironment,s.providerEnvironment==='production'?['active','retired']:['test_only','retired'],
    observation.stripePrice?.id,observation.stripeProduct,observation.stripePrice?.amountMinor,observation.stripePrice?.currency,
    observation.stripePrice?.planVersion,observation.stripePrice?.interval==='year'?'annual':'monthly'])).rows;
 const bound=Array.isArray(price)?(price.length===1?price[0]:null):price;
 if(!bound)throw Error('Restored price mapping needs an explicit catalog repair');
 if(observation.apple){
  const apple=observation.apple;
  if(bound.binding_code!==apple.priceBindingId||bound.price_code!==s.priceCode||bound.plan_version!==apple.planVersion)throw Error('Apple recovery price changed before commit');
  const old=(await client.query(`select o.* from app.commerce_apple_subscription_observations o join app.commerce_subscriptions sub on sub.id=o.subscription_id
   where sub.planner_id=app.current_planner_id() and sub.renewal_provider='storekit' and sub.provider_environment=$1 and sub.provider_subscription_reference=$2`,
   [s.providerEnvironment,s.providerSubscriptionReference])).rows[0];
  if(old&&(old.purchased_at>new Date(apple.receipt.purchasedAt)||old.renewal_signed_at>new Date(apple.renewalSignedAt)
   ||(old.transaction_reference===apple.providerTransactionReference&&old.transaction_signed_at>new Date(apple.transactionSignedAt))))throw Error('Apple recovery status regressed');
 }
 const decision=reconcileCommerceProviderState({signals:[],snapshots:[s]}).entitlementDecisions[0];
 if(!decision||decision.directive==='hold')throw Error('Provider state is unresolved');
 const digest=createHash('sha256').update(JSON.stringify(s)).digest();
 const ref=`recovery:${event.revision}:${digest.toString('hex')}`;
 const record=(await client.query(`insert into app.commerce_provider_events(planner_id,commerce_account_id,provider_code,provider_environment,
  provider_event_reference,event_type,signature_verified,payload_sha256,processing_status,provider_occurred_at)
  values(app.current_planner_id(),$1,$2,$3,$4,'recovery_current_provider_state',$5,$6,'received',$7) returning id::text,public_id::text`,
  [context.commerceAccountId,s.provider,s.providerEnvironment,ref,Boolean(observation.apple),digest,s.observedAt])).rows[0];
 if(s.provider==='stripe'){
  if(!s.providerCustomerReference)throw Error('Verified recovery customer is missing');
  const customer=await client.query(`insert into app.commerce_provider_customers(planner_id,commerce_account_id,provider_code,provider_environment,provider_customer_reference,status)
   values(app.current_planner_id(),$1,'stripe',$2,$3,'active') on conflict(commerce_account_id,provider_code,provider_environment) do update set status='active'
   where app.commerce_provider_customers.provider_customer_reference=excluded.provider_customer_reference returning id`,
   [context.commerceAccountId,s.providerEnvironment,s.providerCustomerReference]);
  if(customer.rowCount!==1)throw Error('Recovery cannot replace another billing customer');
 }
 for(const [type,value] of [[s.provider==='storekit'?'original_transaction':'subscription',s.providerSubscriptionReference],
  ...(s.provider==='stripe'?[['customer',s.providerCustomerReference!]]:[])]){
  await client.query(`insert into app.commerce_provider_object_links(provider_code,provider_environment,provider_object_type,provider_object_reference,commerce_account_reference)
   values($1,$2,$3,$4,$5) on conflict(provider_code,provider_environment,provider_object_reference) do nothing`,[s.provider,s.providerEnvironment,type,value,context.publicId]);
  if(!(await client.query(`select 1 from app.commerce_provider_object_links where provider_code=$1 and provider_environment=$2 and provider_object_reference=$3 and commerce_account_reference=$4`,
   [s.provider,s.providerEnvironment,value,context.publicId])).rowCount)throw Error('Recovery provider object belongs to another account');
 }
 // API reads are recorded with signature_verified=false; no webhook is fabricated.
 const subscription=await recordSubscriptionObservation(client,context,{provider:s.provider,providerEnvironment:s.providerEnvironment,
  providerSubscriptionReference:s.providerSubscriptionReference},s,bound,record.public_id,override);
 if(observation.apple){
  const apple=observation.apple;await persistAppleReceipt(client,subscription,apple.receipt,appleContext);
  await client.query(`insert into app.commerce_apple_subscription_observations(subscription_id,planner_id,transaction_reference,transaction_signed_at,renewal_signed_at,purchased_at,provider_environment)
   values($1,app.current_planner_id(),$2,$3,$4,$5,$6) on conflict(subscription_id) do update set transaction_reference=excluded.transaction_reference,
   transaction_signed_at=excluded.transaction_signed_at,renewal_signed_at=excluded.renewal_signed_at,purchased_at=excluded.purchased_at`,
   [subscription,apple.providerTransactionReference,apple.transactionSignedAt,apple.renewalSignedAt,apple.receipt.purchasedAt,s.providerEnvironment]);
 }
 const applied=await persistReconciliation(client,context,record.id,subscription,decision,s.observedAt);
 if(decision.directive==='grant'&&!applied)throw Error('Restored paid-access policy is not eligible');
 await client.query("update app.commerce_provider_events set processing_status='applied',processed_at=now() where id=$1",[record.id]);
}
