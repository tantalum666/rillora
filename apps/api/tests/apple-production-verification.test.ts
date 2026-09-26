import { describe, expect, it } from 'vitest';
import { Environment, Type, InAppOwnershipType, type JWSTransactionDecodedPayload,
  type JWSRenewalInfoDecodedPayload, type ResponseBodyV2DecodedPayload } from '@apple/app-store-server-library';
import { AppleProductionVerification, rilloraAppleIdentity as identity } from '../src/apple-production-verification.js';
import type { AppleSignedDataVerifying } from '../src/apple-storekit-adapter.js';

const token='abcdef12-abcd-4bcd-8bcd-abcdef123456', now=Date.parse('2026-09-26T00:00:00Z');
const transaction=():JWSTransactionDecodedPayload=>({environment:Environment.PRODUCTION,bundleId:identity.bundleId,
  subscriptionGroupIdentifier:identity.subscriptionGroupId,productId:identity.annualProductId,storefront:'USA',
  type:Type.AUTO_RENEWABLE_SUBSCRIPTION,quantity:1,inAppOwnershipType:InAppOwnershipType.PURCHASED,
  transactionId:'10000000000001',originalTransactionId:'10000000000001',appAccountToken:token,
  signedDate:now,purchaseDate:now-1000,expiresDate:now+365*86400000,price:88800,currency:'USD'});
const renewal=():JWSRenewalInfoDecodedPayload=>({environment:Environment.PRODUCTION,originalTransactionId:'10000000000001',
  productId:identity.annualProductId,autoRenewProductId:identity.annualProductId,appAccountToken:token,signedDate:now,autoRenewStatus:1});
const notification=():ResponseBodyV2DecodedPayload=>({notificationUUID:'11111111-1111-4111-8111-111111111111',notificationType:'DID_RENEW',signedDate:now,
  data:{environment:Environment.PRODUCTION,bundleId:identity.bundleId,appAppleId:identity.appAppleId,signedTransactionInfo:'signed.transaction.fixture',signedRenewalInfo:'signed.renewal.fixture'}});
function verifier(patch:Partial<AppleSignedDataVerifying>={}):AppleSignedDataVerifying{return{
  verifyAndDecodeTransaction:async()=>transaction(),verifyAndDecodeRenewalInfo:async()=>renewal(),verifyAndDecodeNotification:async()=>notification(),...patch};}
const client={signedTransaction:'signed.transaction.fixture',expectedAppAccountToken:token};
const status={signedTransaction:'signed.transaction.fixture',signedRenewalInfo:'signed.renewal.fixture',expectedOriginalTransactionId:'10000000000001',expectedAppAccountToken:token};

describe('production Apple binding after official signature verification (synthetic decoded fixtures)',()=>{
  it('normalizes a bound production signal without retaining signed payloads and canonicalizes UUID casing',async()=>{
    const checker=new AppleProductionVerification(verifier({verifyAndDecodeTransaction:async()=>({...transaction(),appAccountToken:token.toUpperCase()})}),new Set(['USA']));
    const signal=await checker.verifyClientTransaction(client);
    expect(signal).toMatchObject({provider:'storekit',providerEnvironment:'production',accountBindingReference:token,requiresAuthoritativeSnapshot:true});
    expect(JSON.stringify(signal)).not.toContain('signed.transaction.fixture');
    await expect(checker.verifySubscriptionStatus(status)).resolves.toHaveProperty('transaction');
  });
  it('requires an explicit supported storefront set and exact authenticated owner',async()=>{
    expect(()=>new AppleProductionVerification(verifier(),new Set())).toThrow('explicit');
    const checker=new AppleProductionVerification(verifier(),new Set(['USA']));
    await expect(checker.verifyClientTransaction({...client,expectedAppAccountToken:'ffffffff-ffff-4fff-8fff-ffffffffffff'})).rejects.toThrow('ownership');
    // No client/device storefront is used to reject an otherwise owned historical receipt.
    await expect(checker.verifyClientTransaction(client)).resolves.toHaveProperty('receipt.storefront','USA');
  });
  it('rejects Sandbox, foreign products/groups, shared or multiseat purchases and unversionable signed prices',async()=>{
    for(const patch of [{environment:Environment.SANDBOX},{bundleId:'com.other.app'},{subscriptionGroupIdentifier:'another'},
      {productId:'com.other.annual'},{storefront:'GBR'},{quantity:2},{inAppOwnershipType:InAppOwnershipType.FAMILY_SHARED},
      {type:Type.CONSUMABLE},{price:undefined},{currency:'usd'},{expiresDate:now-2000},
      {billingPlanType:'MONTHLY'},{commitmentInfo:{}},{advancedCommerceInfo:{}}]){
      const checker=new AppleProductionVerification(verifier({verifyAndDecodeTransaction:async()=>({...transaction(),...patch}) as JWSTransactionDecodedPayload}),new Set(['USA']));
      await expect(checker.verifyClientTransaction(client)).rejects.toThrow();
    }
  });
  it('rejects mixed nested renewal environments, subjects, products and account tokens',async()=>{
    for(const patch of [{environment:Environment.SANDBOX},{originalTransactionId:'20000000000000'},
      {productId:identity.historicalMonthlyProductId},{appAccountToken:'ffffffff-ffff-4fff-8fff-ffffffffffff'},
      {renewalBillingPlanType:'MONTHLY'},{commitmentInfo:{}},{advancedCommerceInfo:{}}]){
      const checker=new AppleProductionVerification(verifier({verifyAndDecodeRenewalInfo:async()=>({...renewal(),...patch})}),new Set(['USA']));
      await expect(checker.verifySubscriptionStatus(status)).rejects.toThrow();
    }
  });
  it('binds notification app identity and verifies its nested objects before returning a renewal signal',async()=>{
    await expect(new AppleProductionVerification(verifier(),new Set(['USA'])).verifyNotification('signed.notification.fixture')).resolves.toMatchObject({signalType:'renewal_paid',providerEnvironment:'production'});
    for(const patch of [{appAppleId:1},{environment:Environment.SANDBOX},{bundleId:'com.other.app'}]){
      const checker=new AppleProductionVerification(verifier({verifyAndDecodeNotification:async()=>({...notification(),data:{...notification().data,...patch}})}),new Set(['USA']));
      await expect(checker.verifyNotification('signed.notification.fixture')).rejects.toThrow('identity');
    }
  });
  it('does not fall back when the signature verifier fails or input is oversized',async()=>{
    const checker=new AppleProductionVerification(verifier({verifyAndDecodeTransaction:async()=>{throw new Error('signature rejected');}}),new Set(['USA']));
    await expect(checker.verifyClientTransaction(client)).rejects.toThrow('signature rejected');
    await expect(checker.verifyClientTransaction({...client,signedTransaction:'a'.repeat(256*1024+1)})).rejects.toThrow('boundary');
  });
});
