import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFamilyMaintenance,isReviewResolved,reviewTaskLabel,reviewShareUrl} from '../src/familyMaintenance.js';
const id='11111111-1111-4111-8111-111111111111';
const task=()=>({publicId:id,matterPublicId:id,connectionPublicId:id,state:'confirmed',version:2,
  fields:{institutionName:'Archive',locationHint:'Blue folder'},proposal:null,scopeAvailable:true,
  isStale:false,canRespond:true,canSuggest:false,canManage:false});
const payload=()=>({contractVersion:'family-maintenance-v1',access:{mode:'preview',canCreate:true},settings:{cadenceDays:90},
  eligible:[],rounds:[],incoming:[task()],history:[],boundaries:{ownerApprovalRequired:true,recipientScopeEnforced:true,externalNotificationsSent:false,billingActivated:false}});
test('a review link is an account destination without capability tokens or private fields',()=>{
  assert.equal(reviewShareUrl('https://app.staging.rillora.xyz/account?next=reviews'),'https://app.staging.rillora.xyz/account?next=reviews');
  assert.equal(reviewShareUrl('https://app.staging.rillora.xyz/account?next=reviews&token=[REDACTED_CAPABILITY]
  assert.equal(reviewShareUrl('javascript:alert(1)'),null);
  assert.equal(reviewShareUrl('http://untrusted.invalid/account?next=reviews'),null);
});
test('a dated check stops counting as resolved when its source changes',()=>{
  assert.equal(isReviewResolved(task()),true);const stale={...task(),isStale:true};
  assert.equal(isReviewResolved(stale),false);assert.equal(reviewTaskLabel(stale),'Check again');
  assert.equal(isReviewResolved({...task(),scopeAvailable:false}),false);
});
test('hidden fields and unscoped suggestions never render as review directions',()=>{
  for(const key of ['accountHint','desiredOutcome','password']){
    const body=payload();body.incoming[0].fields[key]='private';assert.throws(()=>validateFamilyMaintenance(body));
    const proposal=payload();proposal.incoming[0].proposal={[key]:'private'};assert.throws(()=>validateFamilyMaintenance(proposal));
  }
});
test('incoming data cannot grant owner control or bypass a changed scope',()=>{
  const body=payload();assert.equal(validateFamilyMaintenance(body),body);
  body.incoming[0].canManage=true;assert.throws(()=>validateFamilyMaintenance(body));
  body.incoming[0].canManage=false;body.incoming[0].scopeAvailable=false;assert.throws(()=>validateFamilyMaintenance(body));
});
test('preview cannot pretend to bill or send external messages',()=>{
  for(const key of ['billingActivated','externalNotificationsSent']){
    const body=payload();body.boundaries[key]=true;assert.throws(()=>validateFamilyMaintenance(body));
  }
  const unavailable=payload();unavailable.access.mode='unavailable';assert.throws(()=>validateFamilyMaintenance(unavailable));
  unavailable.access.canCreate=false;assert.doesNotThrow(()=>validateFamilyMaintenance(unavailable));
});
