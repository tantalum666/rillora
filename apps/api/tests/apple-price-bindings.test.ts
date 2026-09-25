import { describe, expect, it } from 'vitest';
import { ApplePriceBindings } from '../src/apple-price-bindings.js';
const from='2026-08-01T00:00:00.000Z',cutover='2026-09-20T00:00:00.000Z';
const old={id:'fixture_annual_old',productId:'com.rillora.family.annual',storefrontCountryCode:'USA',currency:'USD',priceMilliunits:68000,priceCode:'family_usd_annual_v2',planVersion:2,effectiveFrom:from,effectiveUntil:cutover};
const current={...old,id:'fixture_annual_new',priceMilliunits:88800,priceCode:'family_apple_usd_annual_fixture',effectiveFrom:cutover,effectiveUntil:null};
// Prices are synthetic mapping examples. They do not approve or publish an Apple price.
const tx={productId:old.productId,storefront:'USA',currency:'USD',price:68000,purchaseDate:Date.parse('2026-09-01T00:00:00.000Z')};
describe('versioned Apple signed-price mapping',()=>{
 it('maps integer milliunits and signed purchase time while preserving historical receipts',()=>{
  const catalog=new ApplePriceBindings([old,current]);
  expect(catalog.resolve(tx).priceCode).toBe(old.priceCode);
  expect(catalog.resolve({...tx,price:88800,purchaseDate:Date.parse(cutover)}).priceCode).toBe(current.priceCode);
  expect(catalog.resolve(tx).priceCode).toBe(old.priceCode);
 });
 it('does not infer a dollar quote from product ID, another storefront or missing signed data',()=>{
  const catalog=new ApplePriceBindings([old,current]);
  for(const patch of [{price:8880},{price:0},{price:undefined},{currency:'HKD'},{storefront:'HKG'},{purchaseDate:undefined}])expect(()=>catalog.resolve({...tx,...patch} as Parameters<ApplePriceBindings['resolve']>[0])).toThrow();
 });
 it('rejects overlapping exact-price windows and duplicate mapping identities',()=>{
  expect(()=>new ApplePriceBindings([old,{...old,id:'duplicate_window'}])).toThrow('overlap');
  expect(()=>new ApplePriceBindings([old,old])).toThrow('unique');
  expect(()=>new ApplePriceBindings([{...old,effectiveUntil:from}])).toThrow();
 });
});
