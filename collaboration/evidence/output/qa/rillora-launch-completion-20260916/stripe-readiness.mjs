import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const root=process.cwd(),require=createRequire(root+'/apps/api/package.json'),Stripe=require('stripe');
const aws=(args)=>JSON.parse(execFileSync('aws',[...args,'--region','eu-central-1','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
try {
 const stack=aws(['cloudformation','describe-stacks','--stack-name','RilloraStaging','--profile','rillora-cdk-deploy']).Stacks[0];
 const out=Object.fromEntries(stack.Outputs.map(x=>[x.OutputKey,x.OutputValue]));
 const key=aws(['secretsmanager','get-secret-value','--secret-id',out.StripeTestApiKeySecretArn,'--profile','rillora-operator']).SecretString;
 if(!key.startsWith('rk_test_'))throw Error('unexpected_credential_type');
 const stripe=new Stripe(key,{apiVersion:'2026-07-29.dahlia',timeout:15000,maxNetworkRetries:1});
 const prices=await stripe.prices.list({product:'prod_V6O8lAFbTCDmKd',limit:100});
 if(prices.data.some(p=>p.livemode))throw Error('wrong_mode');
 const summary={mode:'test',account:'Rillora',priceRows:prices.data.map(p=>({id:p.id,amount:p.unit_amount,currency:p.currency,interval:p.recurring?.interval,active:p.active})),liveMerchantVerified:false};
 writeFileSync(root+'/output/qa/rillora-launch-completion-20260916/stripe-readiness.json',JSON.stringify(summary,null,2));
 console.log(JSON.stringify(summary));
} catch(e) {console.log(JSON.stringify({status:'blocked',code:e.code??e.type??'read_failed',httpStatus:e.statusCode??null,category:e.name,stderr:e.stderr?String(e.stderr).replace(/[A-Za-z0-9_]{60,}/g,'[redacted]').slice(0,500):undefined}));process.exitCode=1;}
