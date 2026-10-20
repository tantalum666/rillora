import express from 'express';
import { describe,it,expect,vi } from 'vitest';
import request from './http-fixture.js';
import { loadConfig } from '../src/config.js';
import { errorHandler } from '../src/errors.js';
import { createStripeProductionCommerceRouter } from '../src/stripe-production-routes.js';
import { createAppleProductionRouter } from '../src/apple-production-routes.js';
import { appleProductionContext } from '../src/apple-execution-context.js';
import type { StripeCommerceExecutor } from '../src/stripe-commerce-executor.js';
import type { AppleProductionIntake } from '../src/apple-production-intake.js';
import type { ApplePurchasePreflight } from '../src/apple-purchase-preflight.js';
const config={...loadConfig({NODE_ENV:'test',DATABASE_URL:'postgresql:///unused'}),nodeEnv:'production' as const,requireRecentAuthentication:false};
describe('commerce business-route freshness is enforced even if the optional flag is false',()=>{
 it('guards both providers under Express case and slash matching before any side effect',async()=>{
  const sideEffect=vi.fn(async()=>({finishAuthorized:true}));
  const stripe={providerEnvironment:'production',cancelPendingCheckout:sideEffect,createPortal:sideEffect} as unknown as StripeCommerceExecutor;
  const apple={context:appleProductionContext,acceptClientTransaction:sideEffect} as unknown as AppleProductionIntake;
  const purchases={context:appleProductionContext,transition:sideEffect} as unknown as ApplePurchasePreflight;
  for(const authenticatedAt of [null,new Date(Date.now()-660_000),new Date()]) {
   const app=express();app.use(express.json());app.use((req,_res,next)=>{req.auth={plannerId:'1',plannerPublicId:'11111111-1111-4111-8111-111111111111',mode:'bearer',authenticatedAt};next();});
   app.use('/stripe',createStripeProductionCommerceRouter(stripe,{checkoutEnabled:true},config));
   app.use('/apple',createAppleProductionRouter(apple,purchases,config));app.use(errorHandler);
   for(const path of ['/stripe/checkout','/stripe/portal','/stripe/checkout/cancel','/apple/prepare',
     '/apple/purchases/11111111-1111-4111-8111-111111111111','/apple/transactions']) {
    for(const variant of [path,path.toUpperCase()+'/']) {
     const result=await request(app).post(variant).send(path.endsWith('/transactions')?{signedTransaction:'synthetic'}:{});
     if(authenticatedAt && Date.now()-authenticatedAt.getTime()<600_000) expect(result.body.error?.code).not.toBe('reauthentication_required');
     else expect([result.status,result.body.error?.code]).toEqual([403,'reauthentication_required']);
    }
   }
   if(!authenticatedAt || Date.now()-authenticatedAt.getTime()>600_000)expect(sideEffect).not.toHaveBeenCalled();
  }
  expect(sideEffect).toHaveBeenCalled();
 });
});
