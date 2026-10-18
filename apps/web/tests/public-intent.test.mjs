import test from "node:test";
import assert from "node:assert/strict";
import { accountPathForMatter, authenticationReturnPath, requestedMatterCategory } from "../src/publicIntent.js";

test("a chosen matter category survives the account and callback routes", () => {
  for (const category of ["account", "document", "device", "financial_asset", "debt", "subscription", "crypto_asset"]) {
    const account = new URL(accountPathForMatter(category), "https://rillora.invalid");
    assert.equal(account.pathname, "/account");
    const callback = new URL(authenticationReturnPath(account.search), account.origin);
    assert.equal(callback.origin, account.origin);
    assert.equal(callback.pathname, "/");
    assert.equal(requestedMatterCategory(callback.search), category);
  }
});

test("ordinary account entry does not create a deferred editor", () => {
  assert.equal(authenticationReturnPath(""), "/");
  assert.equal(authenticationReturnPath("?category=document"), "/");
  assert.equal(requestedMatterCategory("?state=cancelled"), null);
});

test('AI connection returns to account settings without forwarding protocol secrets', () => {
  assert.equal(authenticationReturnPath('?next=ai-connect&code=secret&return_to=https://example.invalid'), '/?view=settings');
});

test('guide sign-in returns to the selected guide without private or external parameters', () => {
  assert.equal(authenticationReturnPath('?next=guides&service=binance&token=private&return_to=https://example.invalid'), '/?view=guides&task=provider-guide&provider=binance');
  assert.equal(authenticationReturnPath('?service=apple', '/guides'), '/?view=guides&task=provider-guide&provider=apple');
  assert.equal(authenticationReturnPath('?next=guides&service=unknown'), '/?view=guides');
  assert.equal(authenticationReturnPath('?view=guides&task=provider-guide&provider=google'), '/?view=guides&task=provider-guide&provider=google');
  assert.equal(authenticationReturnPath('?next=guides', '/terms'), '/');
});

test("a review link returns to the receiving inbox without carrying private identifiers", () => {
  assert.equal(authenticationReturnPath("?next=reviews"), "/?view=maintenance&inbox=received");
  assert.equal(authenticationReturnPath("?next=reviews&owner=private&token=secret"), "/?view=maintenance&inbox=received");
  assert.equal(requestedMatterCategory(authenticationReturnPath("?next=reviews")), null);
});

test("unknown categories and external targets cannot become a continuation", () => {
  for (const value of ["https://example.invalid", "//example.invalid", "unknown", "document&admin=true"]) {
    assert.equal(authenticationReturnPath(`?next=add-matter&category=${encodeURIComponent(value)}`), "/");
    assert.equal(requestedMatterCategory(`?compose=${encodeURIComponent(value)}`), null);
    assert.equal(accountPathForMatter(value), "/account?next=add-matter&category=account");
  }
});
