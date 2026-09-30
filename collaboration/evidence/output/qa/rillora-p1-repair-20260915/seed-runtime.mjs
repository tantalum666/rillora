import fs from 'node:fs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
async function api(path,body,who=A,method=body?'POST':'GET'){
 const r=await fetch('http://127.0.0.1:4260/v1'+path,{method,headers:{'content-type':'application/json','x-dev-planner-id':who},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(path+': '+r.status+' '+await r.text());return r.json();
}
const bank=(await api('/matters')).matters[0];
const wallet=(await api('/matters',{category:'crypto_asset',title:'Friend-only wallet',details:{cryptoCustody:'self_custody',network:'Ethereum',walletAddress:'0x000000000000000000000000000000000000dEaD'},notes:'Friend QA only'})).matter;
const letter=(await api('/matters',{category:'document',title:'Private letter',locationHint:'Private drawer',desiredOutcome:'never_disclose',notes:'Do not put in any recipient guide'})).matter;
const result={bank:bank.publicId,wallet:wallet.publicId,letter:letter.publicId};
for(const [name,who,matter,level] of [['Parent QA',B,bank.publicId,'directions'],['Friend QA',C,wallet.publicId,'details']]){
 const person=(await api('/trusted-contacts',{displayName:name,relationshipLabel:name==='Parent QA'?'Family':'Friend'})).trustedContact;
 const invite=await api('/sharing/connections',{personPublicId:person.publicId,email:who+'@example.test',grants:[{matterPublicId:matter,detailLevel:level}]});
 const token=new URLSearchParams(new URL(invite.invitationUrl).hash.slice(1)).get('invitation');
 result[who===B?'parent':'friend']={connection:invite.connection.publicId,token};
}
fs.writeFileSync(new URL('./runtime-fixtures.json',import.meta.url),JSON.stringify(result,null,2));
console.log('Synthetic map and two pending scoped invitations prepared; no external messages.');
