const base='http://127.0.0.1:4390/v1',owner='11111111-1111-4111-8111-111111111111',recipient='22222222-2222-4222-8222-222222222222';
async function api(path,body,actor=owner,method='POST'){
 const r=await fetch(base+path,{method,headers:{'content-type':'application/json','x-dev-planner-id':actor,'x-rillora-client':'ios'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data;
}
const rows=[
 {category:'financial_asset',title:'Everyday bank account',institutionName:'Northstar Bank',locationHint:'Blue folder in the study',status:'ready',desiredOutcome:'notify',notes:'The latest statement is in the folder. Contact the bank for its official next steps.'},
 {category:'account',title:'Family photos',institutionName:'Apple',locationHint:'Digital records folder',status:'needs_review',desiredOutcome:'transfer_request',notes:'Our photos are in the shared family library. Check the official Legacy Contact setting.'},
 {category:'document',title:'Important documents',locationHint:'Home filing cabinet · top drawer',status:'ready',notes:'Copies of the insurance policy and legal documents are kept together.'},
 {category:'device',title:'My laptop',locationHint:'Desk drawer',details:{deviceModel:'MacBook'},status:'ready',notes:'The purchase record is in the documents folder. No unlock code is stored here.'},
 {category:'subscription',title:'Home broadband',institutionName:'Example Internet',locationHint:'Household bills folder',status:'needs_review'},
 {category:'financial_asset',title:'Home insurance',institutionName:'Example Insurance',locationHint:'Blue folder in the study',status:'draft',notes:'Find the policy number on the paper statement.'}
];
const saved=[];for(const row of rows)saved.push((await api('/matters',row)).matter);
const contact=(await api('/trusted-contacts',{displayName:'Casey Morgan',relationshipLabel:'Partner'})).trustedContact;
const invitation=await api('/sharing/connections',{personPublicId:contact.publicId,email:recipient+'@example.test',grants:saved.slice(0,3).map(m=>({matterPublicId:m.publicId,detailLevel:'directions'}))});
const token=new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation');
await api('/sharing/invitations/accept',{invitationToken:token,accepted:true},recipient);
console.log(JSON.stringify({syntheticOnly:true,matters:saved.length,contacts:1,connection:'accepted through local development identities',realIdentity:false,mailSent:false}));
