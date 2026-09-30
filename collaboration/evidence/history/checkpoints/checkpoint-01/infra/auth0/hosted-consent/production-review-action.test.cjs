const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const crypto=require('node:crypto');
const subject='auth0|synthetic-review';
const digest=crypto.createHash('sha256').update(`https://login.rillora.xyz\u001f${subject}`).digest('hex');
function run(expiry=new Date(Date.now()+60_000).toISOString()){
 const code=fs.readFileSync(__dirname+'/production-review-action.cjs','utf8').replace('__REVIEW_IDENTITY_DIGEST__',digest).replace('__REVIEW_EXPIRES_AT__',expiry).replace('__RILLORA_FORM_ID__','ap_fixture');
 const context={exports:{},require,Date};vm.runInNewContext(code,context);return context.exports;
}
function fixture(client='POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4'){
 const calls={denied:[],forms:[],claims:[]};return {calls,event:{client:{client_id:client},user:{user_id:subject},request:{query:{rillora_auth_ui:'single-hosted-v1'}}},
 api:{access:{deny:x=>calls.denied.push(x)},prompt:{render:(...x)=>calls.forms.push(x)},accessToken:{setCustomClaim:(...x)=>calls.claims.push(x)}}};
}
test('preserves other clients and denies unknown identities and expired review access',async()=>{
 const unrelated=fixture('preview');await run().onExecutePostLogin(unrelated.event,unrelated.api);assert.equal(unrelated.calls.forms.length,0);assert.equal(unrelated.calls.denied.length,0);
 const stranger=fixture();stranger.event.user.user_id='auth0|other';await run().onExecutePostLogin(stranger.event,stranger.api);assert.equal(stranger.calls.denied.length,1);
 const expired=fixture();await run('2020-01-01T00:00:00Z').onExecutePostLogin(expired.event,expired.api);assert.equal(expired.calls.denied.length,1);
});
test('native consent starts unchecked and only exact affirmative continuation sets a receipt',async()=>{
 const f=fixture(),action=run();await action.onExecutePostLogin(f.event,f.api);
 assert.equal(f.calls.forms[0][1].fields.rillora_legal_accepted,false);
 f.event.prompt={id:'ap_fixture',fields:{rillora_legal_accepted:false},vars:{rillora_legal_bundle:f.calls.forms[0][1].vars.rillora_legal_bundle}};
 await action.onContinuePostLogin(f.event,f.api);assert.equal(f.calls.claims.length,0);assert.equal(f.calls.denied.length,1);
 f.event.prompt.fields.rillora_legal_accepted=true;await action.onContinuePostLogin(f.event,f.api);assert.equal(f.calls.claims.length,1);
});
test('Web keeps the existing API clickwrap and receives no invented hosted receipt',async()=>{
 const f=fixture('EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz');await run().onExecutePostLogin(f.event,f.api);
 assert.equal(f.calls.denied.length,0);assert.equal(f.calls.forms.length,0);assert.equal(f.calls.claims.length,0);
});
