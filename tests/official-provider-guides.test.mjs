import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  getOfficialProviderGuide,
  officialProviderGuides,
  selfReportedProviderKeys, guideInitialPart, guideLinksForPart, guideMatchesQuery, suggestedAccountGuides,
} from "../src/officialProviderGuides.js";

test("suggestions honor visible fields, regional specificity and false-positive limits", () => {
  const cases = JSON.parse(readFileSync(new URL("../../ios/RilloraTests/Fixtures/provider-guide-match-cases.json", import.meta.url), "utf8"));
  for (const value of cases) assert.deepEqual(suggestedAccountGuides(value.fields).map(guide => guide.key), value.expected, value.name);
});

test("official provider catalog covers the curated common platforms", () => {
  assert.equal(officialProviderGuides.length, 18);
  assert.equal(new Set(officialProviderGuides.map((guide) => guide.key)).size, 18);
  assert.deepEqual(
    new Set(selfReportedProviderKeys),
    new Set(["apple", "google", "meta", "github", "password_manager"]),
  );

  for (const key of [
    "apple", "google", "meta", "github", "password_manager",
    "microsoft", "linkedin", "x", "paypal", "coinbase", "binance",
    "instagram", "binance_us", "dropbox", "adobe", "yahoo", "netflix", "steam",
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
    "www.facebook.com", "help.instagram.com",
    "docs.github.com",
    "bitwarden.com",
    "support.1password.com",
    "support.microsoft.com",
    "www.linkedin.com",
    "help.x.com", "help.twitter.com", "survey.adobe.com",
    "www.paypal.com",
    "help.coinbase.com",
    "www.binance.com",
    "support.binance.us",
    "help.dropbox.com", "helpx.adobe.com", "help.yahoo.com", "en-global.help.yahoo.com",
    "help.netflix.com", "store.steampowered.com", "help.steampowered.com",
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
  assert.equal(guide.kindCode, "estateRequest");
  assert.equal(guideInitialPart(guide), "later");
  assert.match(guide.later[0], /your own Binance account/);
  assert.ok(guide.links.some(([, href]) => href === "https://www.binance.com/en/my/risk/appeal?templateId=T192d41590"));
});


test("aliases, regional requirements and task-specific links stay accurate", () => {
  assert.deepEqual(officialProviderGuides.filter(g => guideMatchesQuery(g, "币安")).map(g => g.key), ["binance", "binance_us"]);
  assert.ok(guideMatchesQuery(getOfficialProviderGuide("google"), "Gmail"));
  assert.ok(getOfficialProviderGuide("binance_us").requirements.some(value => /selfie video/i.test(value)));
  assert.match(getOfficialProviderGuide("yahoo").boundary, /non-U.S./);
  const apple = getOfficialProviderGuide("apple");
  assert.ok(guideLinksForPart(apple, "now").every(link => link.phase !== "afterDeath"));
  assert.ok(guideLinksForPart(apple, "later").every(link => link.phase !== "prepare"));
});
