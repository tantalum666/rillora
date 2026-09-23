import assert from "node:assert/strict";
import test from "node:test";
import { clearMatterDraft, readMatterDraft, writeMatterDraft, matterStatusLabel } from "../src/matterDraftStorage.js";
import { toMatterDraft } from "../src/matterForm.js";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const store = () => { const values=new Map(); return { values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k) }; };
const draft = () => ({ type:"matter-create", ...toMatterDraft({title:"Unfinished wallet",category:"crypto_asset",details:{cryptoCustody:"self_custody"},notes:"Keep this note"}), initialValues:toMatterDraft() });
test("an incomplete draft survives reload only for its verified account",()=>{
 const s=store(),d=draft();assert.equal(writeMatterDraft(A,d,s,1000),true);
 assert.equal(readMatterDraft(B,s,1100),null);
 assert.equal(readMatterDraft(A,s,1100).notes,d.notes);
 assert.deepEqual(readMatterDraft(A,s,1100).details,{cryptoCustody:"self_custody"});
 assert.equal(readMatterDraft(A,s,1100).type,"matter-create");
});
test("recovered edits retain the reviewed version, not an automatic overwrite",()=>{
 const s=store(),d={...draft(),type:"matter",id:B,expectedVersion:3,sessionToken:"never persist"};
 writeMatterDraft(A,d,s,1000);const read=readMatterDraft(A,s,1200);
 assert.equal(read.expectedVersion,3);assert.equal(read.id,B);assert.equal(read.sessionToken,undefined);
 assert.equal([...s.values.values()][0].includes("never persist"),false);
});
test("expiry and explicit discard remove the retained values",()=>{
 const s=store();writeMatterDraft(A,draft(),s,1000);assert.equal(readMatterDraft(A,s,1000+24*60*60*1000),null);assert.equal(s.values.size,0);
 writeMatterDraft(A,draft(),s,1000);clearMatterDraft(A,s);assert.equal(readMatterDraft(A,s,1100),null);
});
test("malformed, oversized and mismatched stored drafts are rejected",()=>{
 for(const change of [x=>({...x,owner:B}),x=>({...x,fields:{...x.fields,notes:{bad:true}}}),x=>({...x,type:"settings"}),x=>({...x,expiresAt:Infinity})]){
  const s=store();writeMatterDraft(A,draft(),s,1000);const key=[...s.values.keys()][0];s.setItem(key,JSON.stringify(change(JSON.parse(s.getItem(key)))));assert.equal(readMatterDraft(A,s,1200),null);assert.equal(s.values.size,0);
 }
});
test("unavailable storage is a recoverable condition",()=>{
 const s={getItem(){throw Error("disabled")},setItem(){throw Error("disabled")},removeItem(){throw Error("disabled")}};
 assert.equal(writeMatterDraft(A,draft(),s),false);assert.equal(readMatterDraft(A,s),null);assert.doesNotThrow(()=>clearMatterDraft(A,s));
});
test("stored existence is independent of preparation status",()=>{
 assert.equal(matterStatusLabel({recordStatus:"draft",status:"missing"}),"Draft");
 assert.equal(matterStatusLabel({recordStatus:"ready",status:"added"}),"Directions added");
 assert.equal(matterStatusLabel({recordStatus:"needs_review"}),"Needs review");
});
