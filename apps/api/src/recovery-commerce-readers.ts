import type {DatabasePool} from './db.js';
import type {RecoverySubscriptionReference} from './recovery-journal.js';
import type {AuthoritativeSubscriptionSnapshot} from './commerce-provider-contract.js';
import {loadAppleProductionSecret,loadAppleReviewSecret} from './apple-production-secret.js';
import {loadAppleProductionPriceBindings} from './apple-price-catalog.js';
import {AppleProductionVerification,createRilloraAppleProductionVerifier,createRilloraAppleReviewVerifier} from './apple-production-verification.js';
import {AppleProductionServerApi,AppleProductionSnapshotAdapter,type AppleProductionSnapshot} from './apple-production-server-api.js';
import {appleProductionContext,appleReviewContext} from './apple-execution-context.js';
import {loadStripeProductionSecret} from './stripe-production-secret.js';
import {StripeProductionAdapter,type StripeProductionPriceBinding} from './stripe-production-adapter.js';

export type RecoveryProviderObservation={snapshot:AuthoritativeSubscriptionSnapshot;
 apple?:AppleProductionSnapshot;financialOverride?:'refunded'|'revoked'|null;disputeResolved?:boolean;refundResolved?:boolean;
 stripePrice?:StripeProductionPriceBinding;stripeProduct?:string};
/** Trusted backend dependency, never a caller-supplied JSON verification claim. */
export type RecoveryProviderReader=(reference:RecoverySubscriptionReference,plannerPublicId:string)=>Promise<RecoveryProviderObservation>;
export function createRecoveryProviderReader(pool:DatabasePool,config:{appleProductionArn?:string;appleReviewArn?:string;stripeProductionArn?:string;appleRoots:string}):RecoveryProviderReader{
 const apples=new Map<string,Promise<AppleProductionSnapshotAdapter>>();let stripe:Promise<StripeProductionAdapter>|undefined;
 return async(ref,owner)=>{
  if(ref.acquisition!=='purchased'||!ref.reference||ref.plane!=='global'||ref.market!=='GLOBAL_US')throw Error('Recovery provider scope is unsupported');
  if(ref.provider==='storekit'&&(ref.environment==='sandbox'||ref.environment==='production')){
   const review=ref.environment==='sandbox',context=review?appleReviewContext:appleProductionContext;
   const arn=review?config.appleReviewArn:config.appleProductionArn;if(!arn)throw Error('Recovery provider credential is not configured');
   if(!apples.has(ref.environment))apples.set(ref.environment,(async()=>{
    const credentials=await (review?loadAppleReviewSecret:loadAppleProductionSecret)(arn);
    const verifier=new AppleProductionVerification(await (review?createRilloraAppleReviewVerifier:createRilloraAppleProductionVerifier)(config.appleRoots),new Set(credentials.allowedStorefronts),context);
    return new AppleProductionSnapshotAdapter(new AppleProductionServerApi(credentials,undefined,context),verifier,await loadAppleProductionPriceBindings(pool,context));
   })());
   const snapshot=await (await apples.get(ref.environment)!).retrieveAuthoritativeSubscription({anyTransactionId:ref.reference,
    providerSubscriptionReference:ref.reference,expectedAppAccountToken:owner,expectedCommerceAccountReference:ref.account});
   return {snapshot,apple:snapshot};
  }
  if(ref.provider==='stripe'&&ref.environment==='production'&&ref.customer){
   if(!config.stripeProductionArn)throw Error('Recovery provider credential is not configured');
   stripe??=loadStripeProductionSecret(config.stripeProductionArn).then(c=>new StripeProductionAdapter(c));
   const result=await (await stripe).retrieveRecoverySubscription({providerSubscriptionReference:ref.reference,
    expectedCommerceAccountReference:ref.account,expectedStripeCustomerReference:ref.customer});
   return {snapshot:result.snapshot,financialOverride:result.financial.override,disputeResolved:result.financial.resolvedDispute,
    refundResolved:result.financial.resolvedRefund,
    stripePrice:result.price,stripeProduct:result.product};
  }
  throw Error('Recovery provider environment is unsupported');
 };
}
