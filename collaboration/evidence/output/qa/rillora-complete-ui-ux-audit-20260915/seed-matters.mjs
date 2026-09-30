import fs from 'node:fs/promises';
const base='http://127.0.0.1:4250/v1';const actor='11111111-1111-4111-8111-111111111111';
const rows=[
 {category:'financial_asset',title:'Family bank account',institutionName:'Northstar Bank',locationHint:'Blue folder in study',status:'ready',desiredOutcome:'notify',notes:'Ask the bank for its official estate process.'},
 {category:'account',title:'Cloud photos and family archive',institutionName:'Apple',locationHint:'Estate folder',status:'needs_review',desiredOutcome:'transfer_request'},
 {category:'document',title:'Insurance documents',locationHint:'Home filing cabinet',status:'draft'},
 {category:'device',title:'Family laptop',locationHint:'Home office drawer',details:{deviceModel:'MacBook'},status:'ready'},
 {category:'debt',title:'Mortgage',institutionName:'Example Credit Union',locationHint:'Blue folder',status:'draft'},
 {category:'subscription',title:'Household internet',institutionName:'Example Internet',status:'needs_review'},
 {category:'crypto_asset',title:'On-chain wallet for friend only',details:{cryptoCustody:'self_custody',network:'Ethereum',walletAddress:'0x000000000000000000000000000000000000dEaD'},notes:'Synthetic friend-only note. Not a private key.',desiredOutcome:'transfer_request'},
 {category:'document',title:'Private letter',locationHint:'Private drawer',desiredOutcome:'never_disclose',notes:'Never shared synthetic note.'},
 {category:'document',title:'Unshared document',locationHint:'Archive cupboard',notes:'Unselected synthetic note.'}
];const prior=await (await fetch(base+'/matters',{headers:{'x-dev-planner-id':actor}})).json();const result=prior.matters??[];for(const row of rows){if(result.some(x=>x.title===row.title))continue;const r=await fetch(base+'/matters',{method:'POST',headers:{'Content-Type':'application/json','x-dev-planner-id':actor,'x-rillora-client':'web'},body:JSON.stringify(row)});const b=await r.json();if(!r.ok)throw new Error(JSON.stringify(b));result.push(b);}
await fs.writeFile(new URL('./matter-fixtures.json',import.meta.url),JSON.stringify(result,null,2));console.log('Created nine isolated synthetic matters through the current API.');
