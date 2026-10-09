const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const form = JSON.parse(fs.readFileSync(path.join(__dirname, "form.json"), "utf8"));
const source = fs.readFileSync(path.join(__dirname, "post-login-action.cjs"), "utf8")
  .replaceAll("__RILLORA_IOS_CLIENT_ID__", "test-native-client")
  .replaceAll("__RILLORA_FORM_ID__", "ap_testconsentform")
  .replaceAll("__RILLORA_FORM_ZH_ID__", "ap_testchineseform");
const context = { exports: {} };
vm.runInNewContext(source, context);
const action = context.exports;
const bundle = source.match(/bundleSha256: "([a-f0-9]{64})"/)[1];

function fixture() {
  const calls = { render: [], denied: [], claims: [] };
  return {
    calls,
    event: {
      client: { client_id: "test-native-client" },
      request: { query: { rillora_auth_ui: "single-hosted-v1" } },
      prompt: {
        id: "ap_testconsentform",
        fields: { rillora_legal_accepted: true },
        vars: { rillora_legal_bundle: bundle },
      },
    },
    api: {
      prompt: { render: (...args) => calls.render.push(args) },
      access: { deny: (reason) => calls.denied.push(reason) },
      accessToken: { setCustomClaim: (...args) => calls.claims.push(args) },
    },
  };
}

test("hosted entry starts unchecked and creates no receipt before submission", async () => {
  const f = fixture();
  await action.onExecutePostLogin(f.event, f.api);
  assert.equal(f.calls.render.length, 1);
  assert.equal(f.calls.render[0][1].fields.rillora_legal_accepted, false);
  assert.equal(f.calls.render[0][1].vars.rillora_legal_bundle, bundle);
  assert.equal(f.calls.claims.length, 0);
});

test("a checked, current form produces the exact API contract", async () => {
  const f = fixture();
  await action.onContinuePostLogin(f.event, f.api);
  assert.equal(f.calls.denied.length, 0);
  assert.equal(f.calls.claims[0][0], "https://rillora.xyz/legal-acceptance");
  const proof = f.calls.claims[0][1];
  const swift = fs.readFileSync(path.join(__dirname, "../../../apps/ios/Rillora/Core/Authentication/LegalConsentContract.swift"), "utf8");
  const apiContract = fs.readFileSync(path.join(__dirname, "../../../apps/api/src/legal-contract.ts"), "utf8");
  for (const value of Object.values(proof).filter((v) => typeof v === "string")) {
    assert.ok(swift.includes(value));
    assert.ok(apiContract.includes(value));
  }
  assert.equal(Object.keys(proof).length, 7);
  assert.equal(proof.acceptedTerms, true);
  assert.equal(proof.acknowledgedPrivacy, true);
  assert.equal(proof.acceptedElectronicRecords, true);
});

test("unchecked, missing and coerced values cannot produce a receipt", async () => {
  for (const value of [false, undefined, null, "true", 1, [true]]) {
    const f = fixture();
    f.event.prompt.fields.rillora_legal_accepted = value;
    await action.onContinuePostLogin(f.event, f.api);
    assert.equal(f.calls.denied.length, 1);
    assert.equal(f.calls.claims.length, 0);
  }
});

test("a different form or stale server-side contract is rejected", async () => {
  for (const mutate of [
    (e) => { e.prompt.id = "ap_otherform"; },
    (e) => { e.prompt.vars.rillora_legal_bundle = "stale"; },
    (e) => { delete e.prompt; },
  ]) {
    const f = fixture(); mutate(f.event);
    await action.onContinuePostLogin(f.event, f.api);
    assert.equal(f.calls.denied.length, 1);
    assert.equal(f.calls.claims.length, 0);
  }
});

test("other applications are not changed by this iOS migration", async () => {
  const f = fixture(); f.event.client.client_id = "other-client";
  await action.onExecutePostLogin(f.event, f.api);
  await action.onContinuePostLogin(f.event, f.api);
  assert.equal(f.calls.render.length + f.calls.denied.length + f.calls.claims.length, 0);
});

test("existing iOS versions are not given an extra hosted consent step", async () => {
  const f = fixture(); delete f.event.request;
  await action.onExecutePostLogin(f.event, f.api);
  assert.equal(f.calls.render.length + f.calls.denied.length + f.calls.claims.length, 0);
});

test("form contains only one required legal field and the ordinary continue action", () => {
  const step = form.nodes[0];
  assert.equal(form.nodes.length, 1);
  assert.equal(step.config.components.filter((c) => c.category === "FIELD").length, 1);
  assert.equal(step.config.components.filter((c) => c.type === "NEXT_BUTTON").length, 1);
  const field = step.config.components.find((c) => c.category === "FIELD");
  assert.equal(field.type, "LEGAL");
  assert.equal(field.required, true);
  assert.equal(field.id, "rillora_legal_accepted");
  assert.ok(field.config.text.includes("https://legal.rillora.xyz/terms"));
  assert.ok(field.config.text.includes("https://legal.rillora.xyz/privacy"));
  assert.equal(form.ending.resume_flow, true);
});

test('Chinese form has the same required acceptance and produces the same versioned proof',async()=>{
 const zh=JSON.parse(fs.readFileSync(path.join(__dirname,'form.zh-CN.json'),'utf8'));
 const field=zh.nodes[0].config.components.find(c=>c.type==='LEGAL');
 assert.equal(field.required,true);assert.equal(field.id,'rillora_legal_accepted');
 assert.match(field.config.text,/我同意/);assert.doesNotMatch(field.config.text,/I agree|English|英文|参考/);
 const f=fixture();f.event.transaction={locale:'zh-CN'};
 await action.onExecutePostLogin(f.event,f.api);assert.equal(f.calls.render[0][0],'ap_testchineseform');
 assert.equal(f.calls.render[0][1].fields.rillora_legal_accepted,false);
 f.event.prompt.id='ap_testchineseform';await action.onContinuePostLogin(f.event,f.api);assert.equal(f.calls.claims.length,1);
});
