import test from "node:test";
import assert from "node:assert/strict";
import { sharedDemoMatters } from "../src/landing/landingModel.js";
import { publicEntry } from "../src/publicEntry.js";

test("recipient demonstration omits unshared matters instead of exposing locked titles", () => {
  assert.deepEqual(
    sharedDemoMatters("mum").map((item) => item.id),
    ["insurance", "home"],
  );
  assert.deepEqual(
    sharedDemoMatters("alex").map((item) => item.id),
    ["crypto"],
  );
  assert.deepEqual(sharedDemoMatters("uninvited"), []);
  assert.ok(sharedDemoMatters("mum").every((item) => !("recipients" in item)));
});

test("public routes retain the production destination during its identity cutover hold", () => {
  assert.equal(publicEntry.preview, true);
  assert.equal(
    publicEntry.accountURL,
    "https://app.rillora.xyz/account",
  );
  assert.equal(
    publicEntry.invitationURL,
    "https://app.rillora.xyz/invite",
  );
});
