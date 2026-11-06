import test from 'node:test';
import assert from 'node:assert/strict';
import contract from '../../../config/purchase-consent.json' with { type: 'json' };
import { currentWebAnnualOffer, purchaseQuote, purchaseProof, productionBillingDestination, productionBillingStatus, webAnnualPriceLabel } from '../src/productionBilling.js';
import { createApiClient } from '../src/api.js';
import { authenticationReturnPath } from '../src/publicIntent.js';
import { readWorkspaceRoute, workspaceURL } from '../src/workspaceNavigation.js';
import { resolvePublicView } from '../src/publicRoutes.js';

const quote = { contractVersion: 'commerce-stripe-production-v1', purchaseConsent: contract, requiresFreshEvaluation: true, applicableTaxShownAtCheckout: true };
test('purchase consent is current, annual, separate and requires explicit acceptance', () => {
  const current = purchaseQuote(quote);
  assert.throws(() => purchaseProof(current, false));
  assert.throws(() => purchaseProof(current, undefined));
  assert.equal(purchaseProof(current, true).acceptedAnnualRenewal, true);
  for (const mutation of [{amountMinor:6800},{amountMinor:8880},{version:"family-annual-web-20260925-1"},{billingPeriod:'monthly'},{legalBundleSha256:'changed'},{termsVersion:'old'}]) {
    assert.throws(() => purchaseQuote({...quote,purchaseConsent:{...contract,...mutation}}));
  }
  assert.equal(purchaseProof(current,true).amountMinor,8899);
  assert.equal(webAnnualPriceLabel,"US$88.99/year");
  assert.equal('label' in purchaseProof(current,true),false);
});
test('visible annual price requires the exact current catalog offer', () => {
  const offer = { priceCode: contract.priceCode, amountMinor: 8899, currencyCode: 'USD', minorUnitExponent: 2, billingInterval: 'annual' };
  assert.equal(currentWebAnnualOffer([offer]), offer);
  assert.equal(currentWebAnnualOffer([]), null);
  for (const change of [{ priceCode: 'old' }, { amountMinor: 6800 }, { currencyCode: 'HKD' }, { minorUnitExponent: 0 }, { billingInterval: 'monthly' }]) {
    assert.equal(currentWebAnnualOffer([{ ...offer, ...change }]), null);
  }
});
test('billing redirects require production response, provider host and server entitlement boundary', () => {
  const response = {contractVersion:'commerce-stripe-production-v1',checkout:{testOnly:false,url:'https://checkout.stripe.com/c/pay/fixture'},boundaries:{callbackGrantsAccess:false,providerSnapshotRequired:true}};
  assert.equal(productionBillingDestination(response,'checkout'),response.checkout.url);
  for(const url of ['http://checkout.stripe.com/pay','https://checkout.stripe.com.evil.invalid/pay','https://user@checkout.stripe.com/pay','javascript:alert(1)']) assert.throws(()=>productionBillingDestination({...response,checkout:{...response.checkout,url}},'checkout'));
  assert.throws(()=>productionBillingDestination({...response,boundaries:{callbackGrantsAccess:true,providerSnapshotRequired:true}},'checkout'));
  assert.throws(()=>productionBillingDestination({...response,checkout:{...response.checkout,testOnly:true}},'checkout'));
  assert.throws(()=>productionBillingStatus({contractVersion:'commerce-stripe-test-v1',testOnly:true}));
});
test('provider returns enter account access and discard untrusted session/payment parameters', () => {
  for(const path of ['/account/billing','/account/billing/complete']) {
    assert.equal(resolvePublicView(path),'account');
    assert.equal(authenticationReturnPath('?session_id=untrusted&returnTo=https://evil.invalid',path),'/?view=access');
    const route=readWorkspaceRoute(path+'?session_id=untrusted');
    assert.equal(route.view,'access');assert.equal(workspaceURL(route),'/?view=access');
  }
});
test('production checkout uses authenticated CSRF POST, independent proof and the same retry key',async()=>{
  const calls=[];
  const client=createApiClient({csrfTokenReader:()=> 'fixture-csrf',fetchImpl:async(url,options)=>{calls.push({url,options});return new Response('{}',{status:201,headers:{'content-type':'application/json'}});}});
  const proof=purchaseProof(purchaseQuote(quote),true);
  await client.startProductionCheckout(proof,'fixture-retry-key');await client.startProductionCheckout(proof,'fixture-retry-key');
  assert.equal(calls.length,2);
  for(const {url,options} of calls){assert.equal(url,'/api/v1/commerce/stripe/checkout');assert.equal(options.method,'POST');assert.equal(options.credentials,'include');assert.equal(options.headers.get('x-csrf-token'),'fixture-csrf');assert.equal(options.headers.get('idempotency-key'),'fixture-retry-key');assert.deepEqual(JSON.parse(options.body),{billingPeriod:'annual',purchaseConsent:proof});}
});

test('production status requires an explicit known checkout-availability result', () => {
  const base={contractVersion:'commerce-stripe-production-v1',testOnly:false,canManage:false,checkoutPending:false,subscription:null};
  for(const checkoutAvailability of ['available','account_unavailable','unavailable']) {
    assert.equal(productionBillingStatus({...base,checkoutAvailability}).checkoutAvailability,checkoutAvailability);
  }
  for(const checkoutAvailability of [undefined,null,true,'test','unknown']) {
    assert.throws(()=>productionBillingStatus({...base,checkoutAvailability}));
  }
});
