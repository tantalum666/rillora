import test from "node:test";
import assert from "node:assert/strict";
import { invitationTokenFromUrl, validateSharedResponse } from "../src/sharing.js";

const connection = "11111111-1111-4111-8111-111111111111";
const matter = "22222222-2222-4222-8222-222222222222";
function payload(level, fields) { return { readOnly:true, purpose:"planner_directed", connections:[{publicId:connection,ownerName:"A",readOnly:true}], items:[{connectionPublicId:connection,matterPublicId:matter,ownerName:"A",detailLevel:level,fields}] }; }
test("invitation URLs carry a bounded fragment capability", () => {
  const token = "x".repeat(43);
  assert.equal(invitationTokenFromUrl(`https://app.rillora.xyz/invite#invitation=${token}`), token);
  assert.equal(invitationTokenFromUrl(`rillora://invite#invitation=${token}`), token);
  assert.equal(invitationTokenFromUrl(`javascript:alert(1)#invitation=${token}`), null);
  assert.equal(invitationTokenFromUrl(`https://app.rillora.xyz/invite?invitation=${token}`), null);
});
test("name-level views reject accidental location disclosure", () => {
  assert.doesNotThrow(() => validateSharedResponse(payload("name",{title:"Document",category:"document"})));
  assert.throws(() => validateSharedResponse(payload("name",{title:"Document",category:"document",locationHint:"Private folder"})));
});
test("directions exclude masked hints and fields from unrelated connections", () => {
  assert.throws(() => validateSharedResponse(payload("directions",{title:"Account",category:"account",accountHint:"ending 42"})));
  const value=payload("directions",{title:"Account",category:"account",locationHint:"Safe folder"});
  value.items[0].connectionPublicId="33333333-3333-4333-8333-333333333333";
  assert.throws(() => validateSharedResponse(value));
});
test("a recipient response never grants writes or event-conditioned release", () => {
  const value=payload("details",{title:"Account",category:"account",accountHint:"ending 42"});
  assert.doesNotThrow(() => validateSharedResponse(value));
  assert.throws(() => validateSharedResponse({...value,readOnly:false}));
  assert.throws(() => validateSharedResponse({...value,purpose:"death_release"}));
});
