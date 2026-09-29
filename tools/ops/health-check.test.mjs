import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isPublicAddress,validateConfig,runHealthChecks} from './health-check.mjs';
const config={schemaVersion:1,environment:'test',allowedOrigins:['https://app.rillora.xyz'],timeoutMs:1000,certificateWarningDays:21,targets:[{id:'private-denial',url:'https://app.rillora.xyz/v1/session',expectedStatus:401,headers:{'cache-control':'no-store'}}]};
const now=()=>Date.parse('2026-09-11T00:00:00Z');
test('closed and restricted-review denial are allowed but success and unplanned errors still alarm',async()=>{
  const review={...config,targets:[{...config.targets[0],expectedStatus:[401,503]}]};
  for(const status of [401,503,200,400,500]){
    const report=await runHealthChecks(review,{now,transport:async()=>({status,headers:{'cache-control':'no-store'},certificateExpiresAt:'2026-12-11T00:00:00Z'})});
    assert.equal(report.ok,[401,503].includes(status));
  }
  for(const expectedStatus of [[],[401,401],['401'],[0],Array(4).fill(401)])assert.throws(()=>validateConfig({...config,targets:[{...config.targets[0],expectedStatus}]}));
});
test('rejects private, mapped, loopback and reserved DNS addresses',()=>{
  for(const ip of['127.0.0.1','10.1.2.3','169.254.169.254','172.16.4.5','192.168.1.1','100.64.1.2','203.0.113.1','198.18.0.195','::1','0:0:0:0:0:0:0:1','fd00::1','fe80::1','::ffff:127.0.0.1','::ffff:7f00:1','2001::1','2002:7f00:1::','2001:db8::1','3fff::1'])assert.equal(isPublicAddress(ip),false,ip);
  for(const ip of['1.1.1.1','8.8.8.8','2606:4700::1111','::ffff:808:808'])assert.equal(isPublicAddress(ip),true,ip);
});
test('blocks off-registry origins, credentials, queries, fragments and IP targets',()=>{
  for(const url of['http://app.rillora.xyz/','https://other.example/','https://person:password@app.rillora.xyz/','https://app.rillora.xyz/?token=secret','https://app.rillora.xyz/#invite','https://127.0.0.1/'])assert.throws(()=>validateConfig({...config,targets:[{...config.targets[0],url}]}));
});
test('keeps expanded production monitoring bounded and rejects duplicate identifiers',()=>{
  const targets=Array.from({length:16},(_,index)=>({...config.targets[0],id:`check-${index}`}));
  assert.equal(validateConfig({...config,targets}).targets.length,16);
  assert.throws(()=>validateConfig({...config,targets:[...targets,{...config.targets[0],id:'check-17'}]}));
  assert.throws(()=>validateConfig({...config,targets:[targets[0],targets[0]]}));
});
test('successful denial and TLS check never retain response data',async()=>{
  const report=await runHealthChecks(config,{now,transport:async()=>({status:401,headers:{'cache-control':'no-store'},certificateExpiresAt:'2026-12-11T00:00:00Z',body:'private matter title'})});
  assert.equal(report.ok,true);assert.equal(report.failed,0);assert.equal(report.checks[0].certificateDaysRemaining,91);assert.equal(JSON.stringify(report).includes('private matter'),false);
});
test('unexpected success on a private endpoint is a failure, without logging contents',async()=>{
  const report=await runHealthChecks(config,{now,transport:async()=>({status:200,headers:{'cache-control':'public'},certificateExpiresAt:'2026-09-15T00:00:00Z'})});
  assert.deepEqual(report.checks[0].issues,['unexpected_http_status','header_check_failed:cache-control','certificate_expiring']);
});
test('network failure does not leak arbitrary error messages or codes',async()=>{
  const report=await runHealthChecks(config,{now,transport:async()=>{const e=new Error('Bearer private-token');e.code='SECRET_API_KEY';throw e;}});
  assert.equal(report.ok,false);assert.deepEqual(report.checks[0].issues,['NETWORK_ERROR']);assert.equal(JSON.stringify(report).includes('private-token'),false);
});
test('missing certificate evidence is unknown, not a healthy default',async()=>{
  const report=await runHealthChecks(config,{now,transport:async()=>({status:401,headers:{'cache-control':'no-store'}})});
  assert.equal(report.ok,false);assert.equal(report.checks[0].certificateDaysRemaining,null);
});
