import test from 'node:test';
import assert from 'node:assert/strict';
import {planProgress} from '../src/planProgress.js';
test('a completed first matter leads to another matter instead of reopening it',()=>{
 const item={publicId:'one',status:'ready'};
 assert.deepEqual(planProgress([item]),{completed:1,total:5,remaining:4,action:{kind:'add'}});
 assert.equal(item.status,'ready');
});
test('the actual unfinished matter is named without changing its state',()=>{
 const matters=[{id:'ready',recordStatus:'ready',status:'added'},{id:'draft',recordStatus:'draft',status:'missing'}];
 const result=planProgress(matters);assert.equal(result.action.kind,'review');assert.strictEqual(result.action.matter,matters[1]);
 assert.equal(matters[1].recordStatus,'draft');
});
test('an empty map starts with creation and a finished map opens its list',()=>{
 assert.equal(planProgress([]).action.kind,'add');
 const done=Array.from({length:6},()=>({status:'ready'}));assert.deepEqual(planProgress(done),{completed:6,total:6,remaining:0,action:{kind:'view'}});
});
