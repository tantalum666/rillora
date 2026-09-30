import fs from 'node:fs';
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
async function api(path, body, actor=A, method=body?'POST':'GET') {
 const response = await fetch('http://127.0.0.1:4260/v1'+path,{method,headers:{'content-type':'application/json','x-dev-planner-id':actor},body:body?JSON.stringify(body):undefined});
 if(!response.ok) throw Error(path+':'+response.status+':'+await response.text()); return response.json();
}
const matter=(await api('/matters',{category:'crypto_asset',title:'Foreground QA wallet',details:{cryptoCustody:'self_custody',network:'Ethereum',walletAddress:'0x000000000000000000000000000000000000dEaD'},notes:'Visible only before scope changes'})).matter;
const person=(await api('/trusted-contacts',{displayName:'Recipient QA',relationshipLabel:'Local fixture'})).trustedContact;
const invitation=await api('/sharing/connections',{personPublicId:person.publicId,email:B+'@example.test',grants:[{matterPublicId:matter.publicId,detailLevel:'details'}]});
const token=new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation');
fs.writeFileSync(new URL('./state-fixture.json',import.meta.url), JSON.stringify({A,B,matter:matter.publicId,person:person.publicId,connection:invitation.connection.publicId,token},null,2));
console.log('Local synthetic invitation ready; no external message.');
