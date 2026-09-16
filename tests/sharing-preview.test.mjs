import test from "node:test";
import assert from "node:assert/strict";
import { validateSharingPreview } from "../src/sharing.js";
const id = "11111111-1111-4111-8111-111111111111";
const response = fields => ({items:[{matterPublicId:id,detailLevel:"name",fields}],readOnly:true,purpose:"planner_directed",preview:true});
const grants = [{matterPublicId:id,detailLevel:"name"}];
test("preview is bound to the exact selected matter and level", () => {
  const preview = response({title:"Document",category:"document"});
  assert.equal(validateSharingPreview(preview,grants),preview);
  assert.throws(() => validateSharingPreview(preview,[]));
  assert.throws(() => validateSharingPreview({...preview,items:[{...preview.items[0],detailLevel:"details"}]},grants));
});
test("preview rejects additional private fields", () => {
  assert.throws(() => validateSharingPreview(response({title:"Document",category:"document",notes:"Private"}),grants));
});
test("preview never implies a write or event-conditioned disclosure", () => {
  assert.throws(() => validateSharingPreview({...response({title:"Document",category:"document"}),readOnly:false},grants));
  assert.throws(() => validateSharingPreview({...response({title:"Document",category:"document"}),purpose:"death_release"},grants));
});
