import assert from "node:assert/strict";
import test from "node:test";

import {
  getOfficialProviderGuide,
  officialProviderGuides,
  selfReportedProviderKeys,
} from "../src/officialProviderGuides.js";

test("official provider catalog covers the curated common platforms", () => {
  assert.equal(officialProviderGuides.length, 11);
  assert.equal(new Set(officialProviderGuides.map((guide) => guide.key)).size, 11);
  assert.deepEqual(
    new Set(selfReportedProviderKeys),
    new Set(["apple", "google", "meta", "github", "password_manager"]),
  );

  for (const key of [
    "apple", "google", "meta", "github", "password_manager",
    "microsoft", "linkedin", "x", "paypal", "coinbase", "binance",
  ]) {
    const guide = getOfficialProviderGuide(key);
    assert.ok(guide, `missing ${key}`);
    assert.ok(guide.doNow.length > 0);
    assert.ok(guide.later.length > 0);
    assert.ok(guide.links.length > 0);
  }
});

test("every provider link is HTTPS and uses an official host", () => {
  const allowedHosts = new Set([
    "support.apple.com",
    "digital-legacy.apple.com",
    "myaccount.google.com",
    "support.google.com",
    "www.facebook.com",
    "docs.github.com",
    "bitwarden.com",
    "support.1password.com",
    "support.microsoft.com",
    "www.linkedin.com",
    "help.x.com",
    "www.paypal.com",
    "help.coinbase.com",
    "www.binance.com",
    "support.binance.us",
  ]);

  for (const guide of officialProviderGuides) {
    for (const [, href] of guide.links) {
      const url = new URL(href);
      assert.equal(url.protocol, "https:");
      assert.ok(allowedHosts.has(url.hostname), `${guide.key}: ${url.hostname}`);
    }
  }
});

test("Binance is described as a regional estate request, not a legacy contact", () => {
  const guide = getOfficialProviderGuide("binance");
  assert.equal(guide.kind, "Estate request");
  assert.match(guide.boundary, /No public global Binance Legacy Contact switch was verified/);
  assert.ok(guide.links.some(([, href]) => href === "https://www.binance.com/en/chat"));
});
