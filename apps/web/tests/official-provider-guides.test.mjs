import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  getOfficialProviderGuide, localizeOfficialProviderGuide,
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


test("every guide has complete Chinese prose without changing routes or evidence", () => {
  for (const source of officialProviderGuides) {
    for (const locale of ["zh-CN", "zh-Hans", "zh_Hans_CN"]) {
      const guide = localizeOfficialProviderGuide(source, locale);
      assert.equal(guide.contentLocale, "zh-Hans", source.key);
      for (const field of ["key", "id", "name", "kindCode", "reviewed", "group"]) assert.equal(guide[field], source[field]);
      for (const field of ["aliases", "matterMatch"]) assert.deepEqual(guide[field], source[field]);
      for (const field of ["doNow", "later", "requirements"]) {
        assert.equal(guide[field].length, source[field].length);
        guide[field].forEach(value => assert.match(value, /\p{Script=Han}/u));
      }
      assert.match(guide.detail, /\p{Script=Han}/u);
      assert.match(guide.boundary, /\p{Script=Han}/u);
      assert.deepEqual(guide.linkDetails.map(({urlString, phase}) => ({urlString, phase})), source.linkDetails.map(({urlString, phase}) => ({urlString, phase})));
      assert.deepEqual(localizeOfficialProviderGuide(guide, "en").doNow, source.doNow);
    }
    assert.deepEqual(localizeOfficialProviderGuide(source, "fr").doNow, source.doNow);
  }
});

test("missing or incomplete translations fall back to the complete English guide", () => {
  const source = getOfficialProviderGuide("apple");
  for (const translations of [undefined, {"zh-Hans": {...source.translations["zh-Hans"], laterSteps: []}}, {"zh-Hans": {...source.translations["zh-Hans"], boundary: " "}}, {"zh-Hans": {...source.translations["zh-Hans"], links: source.links.map(() => null)}}]) {
    const fixture = {...source, key: "synthetic-fallback", id: "synthetic-fallback", translations};
    const actual = localizeOfficialProviderGuide(fixture, "zh-CN");
    assert.equal(actual.contentLocale, "en");
    assert.deepEqual(actual.doNow, source.doNow);
    assert.deepEqual(actual.linkDetails, source.linkDetails);
  }
});


test("Chinese overlays are pinned to exact canonical content, including source order", () => {
  const catalog = JSON.parse(readFileSync(new URL("../../../config/provider-guides.json", import.meta.url), "utf8"));
  for (const { translations, ...source } of catalog.guides) {
    assert.equal(translations["zh-Hans"].sourceDigest, createHash("sha256").update(JSON.stringify(source)).digest("hex"), `${source.id}: review the Chinese overlay after any canonical change`);
  }
});
