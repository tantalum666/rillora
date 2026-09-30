import {describe,it,expect} from 'vitest';
import type {StripeSdkPort} from '../src/stripe-sdk.js';
import {readStripeRecoveryFinancialState} from '../src/stripe-recovery-financial-state.js';
function fixture(){
 const state:any={invoice:{id:'in_fixture',status:'paid',livemode:true,customer:'cus_fixture',amount_paid:8899,currency:'usd'},
  payment:{id:'inpay_fixture',invoice:'in_fixture',status:'paid',livemode:true,amount_paid:8899,currency:'usd',payment:{type:'payment_intent',payment_intent:'pi_fixture'}},
  charge:{id:'ch_fixture',livemode:true,customer:'cus_fixture',paid:true,captured:true,status:'succeeded',amount:8899,amount_refunded:0,currency:'usd',payment_intent:'pi_fixture',disputed:false,refunded:false},
  refunds:[],disputes:[],more:''};
 const sdk={retrieveInvoice:async()=>state.invoice, listInvoicePaymentsByInvoice:async()=>({data:[state.payment],has_more:state.more==='payments'}),
  listChargesByPaymentIntent:async()=>({data:[state.charge],has_more:state.more==='charges'}),retrieveCharge:async()=>state.charge,
  listRefundsByCharge:async()=>({data:state.refunds,has_more:state.more==='refunds'}),
  listDisputesByCharge:async()=>({data:state.disputes,has_more:state.more==='disputes'})} as unknown as StripeSdkPort;
 return {state,read:()=>readStripeRecoveryFinancialState(sdk,'in_fixture','cus_fixture',true)};
}
describe('Current Stripe financial evidence for quarantined recovery',()=>{
 it('keeps a paid or partially refunded period and identifies a completed full refund',async()=>{
  const f=fixture();expect((await f.read()).override).toBeNull();
  f.state.refunds=[{id:'re_fixture',charge:'ch_fixture',amount:1000,currency:'usd',status:'succeeded'}];f.state.charge.amount_refunded=1000;
  expect((await f.read()).override).toBeNull();
  f.state.refunds[0].amount=8899;f.state.charge.amount_refunded=8899;f.state.charge.refunded=true;
  expect((await f.read()).override).toBe('refunded');
  f.state.refunds[0].status='pending';await expect(f.read()).rejects.toThrow('completed refund evidence');
 });
 it('distinguishes open disputes from a verified won dispute',async()=>{
  const f=fixture();f.state.charge.disputed=true;f.state.disputes=[{id:'du_fixture',charge:'ch_fixture',livemode:true,status:'needs_response'}];
  expect((await f.read()).override).toBe('revoked');f.state.disputes[0].status='won';
  expect(await f.read()).toMatchObject({override:null,resolvedDispute:true});
  f.state.disputes=[];await expect(f.read()).rejects.toThrow('lacks current dispute evidence');
 });
 it('does not use a partial page to restore access',async()=>{
  for(const more of ['payments','charges','refunds','disputes']){const f=fixture();f.state.more=more;await expect(f.read()).rejects.toThrow();}
 });
 it('rejects foreign mode/customer/payment/charge and mismatched settled amounts',async()=>{
  for(const change of [(s:any)=>s.invoice.livemode=false,(s:any)=>s.charge.customer='cus_other',
   (s:any)=>s.payment.invoice='in_other',(s:any)=>s.charge.payment_intent='pi_other',
   (s:any)=>s.charge.captured=false,(s:any)=>s.payment.amount_paid=5000,(s:any)=>s.charge.currency='eur',
   (s:any)=>s.refunds=[{charge:'ch_other',amount:1000,currency:'usd',status:'succeeded'}],
   (s:any)=>s.disputes=[{charge:'ch_other',status:'won',livemode:true}]]){
   const f=fixture();change(f.state);await expect(f.read()).rejects.toThrow();
  }
 });
});
