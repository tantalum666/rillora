import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiClient } from '../src/api.js';
import { futureNoticeTokenFromUrl, validateFutureNotice, validateFutureNoticeEnvelope,
  validateFutureNoticeDecision, validateFutureNoticeList, validateFutureNoticeLeave } from '../src/futureNotices.js';
import { en, zhCN } from '../src/i18n/messages/futureNotices.js';

const id = '11111111-1111-4111-8111-111111111111', person = '22222222-2222-4222-8222-222222222222';
const token = 'n'.repeat(43);
const publicNotice = {publicId:id, status:'pending', expiresAt:'2026-10-27T00:00:00Z', purpose:'future_notice', contentAvailable:false};
const owner = {...publicNotice, personPublicId:person, emailHint:'n***@example.test', acknowledgedAt:null, version:1};
const received = {publicId:id, ownerName:'Synthetic planner', status:'acknowledged', version:2, purpose:'future_notice', contentAvailable:false};

test('future notice responses cannot carry contents or elevate permissions', () => {
  for (const [value, kind] of [[publicNotice,'public'],[owner,'owner'],[received,'received']]) {
    assert.deepEqual(validateFutureNotice(value,kind),value);
    for (const patch of [{matters:[]},{title:'Private'},{grants:[]},{contentAvailable:true},{purpose:'planner_directed'}]) {
      assert.throws(()=>validateFutureNotice({...value,...patch},kind), e=>e.code==='invalid_future_notice');
    }
  }
  assert.throws(()=>validateFutureNotice({...publicNotice,ownerName:'Unexpected identity'},'public'));
  assert.throws(()=>validateFutureNoticeEnvelope({notice:received,invitationUrl:'https://app.rillora.xyz/future-invite#invitation='+token},'received'));
  assert.throws(()=>validateFutureNoticeList({notices:[received,received],contentAvailable:false}));
  assert.throws(()=>validateFutureNoticeList({notices:[{...received,status:'pending'}],contentAvailable:false}));
  assert.throws(()=>validateFutureNoticeDecision({result:{publicId:id,status:'acknowledged',version:2,contentAvailable:true}}));
  assert.throws(()=>validateFutureNoticeLeave({left:true,contentAvailable:true}));
});

test('notice invitations use an exact trusted path and a single fragment token', () => {
  const base='https://app.rillora.xyz/future-invite';
  assert.equal(futureNoticeTokenFromUrl(`${base}?lang=zh-CN#invitation=${token}`),token);
  for(const url of [`http://app.rillora.xyz/future-invite#invitation=${token}`,
    `https://app.rillora.xyz.evil.test/future-invite#invitation=${token}`,
    `https://user@app.rillora.xyz/future-invite#invitation=${token}`,
    `${base}?invitation=${token}`,`${base}/other#invitation=${token}`,`${base}#invitation=${token}&invitation=${token}`,
    `${base}?returnTo=evil#invitation=${token}`,`${base}?lang=zh-CN&lang=en#invitation=${token}`]) {
    assert.equal(futureNoticeTokenFromUrl(url),null,url);
  }
});

test('Web mutations carry version checks and never add sharing grants', async () => {
  const calls=[];
  const api=createApiClient({devPlannerId:person,csrfProvider:()=> 'synthetic-csrf',fetchImpl:async(url,options)=>{
    calls.push({url,options,body:options.body?JSON.parse(options.body):null});
    const value=url.endsWith('/invitations/respond')?{result:{publicId:id,status:'acknowledged',version:2,contentAvailable:false}}
      :url.includes('/received/')?{left:true,contentAvailable:false}
      :url.includes('/invitations/resolve')?{notice:publicNotice}:{notice:owner};
    return new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
  }});
  await api.createFutureNotice({personPublicId:person,email:'notice@example.test',acknowledgedNoAccess:true});
  await api.resolveFutureNotice(token);
  await api.respondFutureNotice({invitationToken:token,action:'acknowledge',expectedVersion:1});
  await api.revokeFutureNotice(id,2);
  await api.leaveFutureNotice(id,2);
  assert.deepEqual(Object.keys(calls[0].body).sort(),['acknowledgedNoAccess','email','personPublicId']);
  assert.equal(calls[1].url,'/api/future-notices/invitations/resolve');
  assert.ok(calls.every(c=>!c.url.includes(token)&&!c.url.includes('/sharing/')));
  assert.equal(calls[3].options.headers.get('if-match'),'2');
  assert.equal(calls[4].options.headers.get('if-match'),'2');
});

test('both languages cover the same arrangement contract without English fallback', () => {
  assert.deepEqual(Object.keys(en).sort(),Object.keys(zhCN).sort());
  for(const [key,value] of Object.entries(zhCN)) {
    assert.match(value,/[\u3400-\u9fff]/,key);
    assert.notEqual(value,en[key]);
  }
});
