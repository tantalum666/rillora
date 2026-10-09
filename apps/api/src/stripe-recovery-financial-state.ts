import type {StripeSdkPort} from './stripe-sdk.js';
import {stripeObjectReference,assertStripeObjectId} from './stripe-provider-shared.js';

/** Read-only current-invoice evidence. An active subscription alone cannot undo
 * a refund/dispute that happened after a database snapshot. No fabricated webhook. */
export async function readStripeRecoveryFinancialState(sdk:StripeSdkPort,invoiceId:string,customerId:string,live:boolean){
 assertStripeObjectId(invoiceId,'in_');assertStripeObjectId(customerId,'cus_');
 if(!sdk.listInvoicePaymentsByInvoice||!sdk.listChargesByPaymentIntent||!sdk.listDisputesByCharge||!sdk.listRefundsByCharge)throw Error('Recovery financial reader is unavailable');
 const invoice=await sdk.retrieveInvoice(invoiceId);
 if(invoice.id!==invoiceId||invoice.livemode!==live||invoice.status!=='paid'||stripeObjectReference(invoice.customer)!==customerId
  ||!Number.isSafeInteger(invoice.amount_paid)||invoice.amount_paid<=0)throw Error('Recovery settled invoice scope mismatch');
 const payments=await sdk.listInvoicePaymentsByInvoice(invoiceId);
 if(payments.has_more||payments.data.length!==1)throw Error('Recovery invoice payment inventory is incomplete or ambiguous');
 const payment=payments.data[0]!;
 if(payment.livemode!==live||payment.status!=='paid'||stripeObjectReference(payment.invoice)!==invoiceId
  ||payment.amount_paid!==invoice.amount_paid||payment.currency!==invoice.currency)throw Error('Recovery payment scope mismatch');
 let charges;
 if(payment.payment.type==='charge'){
  const id=stripeObjectReference(payment.payment.charge);if(!id)throw Error('Recovery charge is missing');assertStripeObjectId(id,'ch_');
  charges=[await sdk.retrieveCharge(id)];
 }else if(payment.payment.type==='payment_intent'){
  const id=stripeObjectReference(payment.payment.payment_intent);if(!id)throw Error('Recovery payment intent is missing');assertStripeObjectId(id,'pi_');
  const list=await sdk.listChargesByPaymentIntent(id);
  if(list.has_more||list.data.some(c=>stripeObjectReference(c.payment_intent)!==id))throw Error('Recovery charge inventory is incomplete');
  charges=list.data.filter(c=>c.paid&&c.status==='succeeded');
 }else throw Error('Recovery payment type needs a separate reviewed adapter');
 if(charges.length!==1)throw Error('One verified settled charge is required');
 const charge=charges[0]!;
 if(charge.livemode!==live||stripeObjectReference(charge.customer)!==customerId||!charge.paid||!charge.captured||charge.status!=='succeeded'
  ||!Number.isSafeInteger(charge.amount)||charge.amount<=0||!Number.isSafeInteger(charge.amount_refunded)
  ||charge.amount_refunded<0||charge.amount_refunded>charge.amount)throw Error('Recovery charge scope mismatch');
 if(charge.amount!==payment.amount_paid||charge.currency!==payment.currency)throw Error('Recovery invoice and charge amounts differ');
 const refunds=await sdk.listRefundsByCharge(charge.id);
 if(refunds.has_more||refunds.data.length>100||refunds.data.some(r=>stripeObjectReference(r.charge)!==charge.id||r.currency!==charge.currency
  ||!Number.isSafeInteger(r.amount)||r.amount<=0||r.amount>charge.amount||!['succeeded','pending','failed','canceled','requires_action'].includes(r.status??'')))
  throw Error('Recovery refund inventory is incomplete');
 const refunded=refunds.data.filter(r=>r.status==='succeeded').reduce((total,r)=>total+r.amount,0);
 if(refunded>charge.amount||(charge.refunded||charge.amount_refunded===charge.amount)&&refunded<charge.amount)throw Error('Full refund lacks completed refund evidence');
 const disputes=await sdk.listDisputesByCharge(charge.id);
 if(disputes.has_more||disputes.data.length>100||disputes.data.some(d=>d.livemode!==live||stripeObjectReference(d.charge)!==charge.id))throw Error('Recovery dispute inventory is incomplete');
 if(charge.disputed&&disputes.data.length===0)throw Error('Disputed charge lacks current dispute evidence');
 const blocked=disputes.data.some(d=>!['won','prevented','warning_closed'].includes(d.status));
 const fullyRefunded=refunded===charge.amount;
 return {override:fullyRefunded?'refunded' as const:blocked?'revoked' as const:null,
  resolvedRefund:!fullyRefunded&&refunds.data.some(r=>r.status==='failed'||r.status==='canceled'),
  resolvedDispute:disputes.data.length>0&&!blocked,chargeReference:charge.id};
}
