import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { en, zhCN } from "../src/i18n/messages/public.js";
import { createTranslator, createFormatters, mergeCatalogs, validateCatalogs } from "../src/i18n/core.js";
import { demoPeople, sharedDemoMatters } from "../src/landing/landingModel.js";
import { matterExamples } from "../src/landing/matterExamples.js";
import catalog from "../../../config/product-catalog.json" with { type: "json" };

const catalogs = mergeCatalogs({ en, zhCN });
const english = createTranslator("en", catalogs);
const chinese = createTranslator("zh-CN", catalogs);
const source = async (file) => readFile(new URL(`../src/${file}`, import.meta.url), "utf8");

test("every public semantic message has complete English and Chinese forms and matching interpolation", () => {
  assert.deepEqual(validateCatalogs(catalogs), []);
  assert.ok(Object.keys(en).length >= 250);
  assert.ok(Object.keys(en).every((key) => key.startsWith("public.")));
});

test("all public UI and example-data message references resolve in both languages", async () => {
  const landingFiles = (await readdir(new URL("../src/landing/", import.meta.url))).filter((file) => /\.jsx?$/.test(file));
  const files = [...landingFiles.map((file) => `landing/${file}`), "PublicWebsite.jsx", "PublicExperience.jsx", "PublicHome.jsx", "ContinuityExplorer.jsx"];
  for (const file of files) {
    for (const [, key] of (await source(file)).matchAll(/["'](public\.[a-zA-Z0-9.]+)["']/g)) {
      assert.ok(Object.hasOwn(en, key), `${file}: English ${key}`);
      assert.ok(Object.hasOwn(zhCN, key), `${file}: Chinese ${key}`);
    }
  }
});

test("demonstration content is translated before rendering without widening recipient visibility", () => {
  assert.deepEqual(sharedDemoMatters("mum").map((item) => chinese(item.titleKey)), ["保险", "房屋文件"]);
  assert.deepEqual(sharedDemoMatters("alex").map((item) => english(item.titleKey)), ["Crypto account"]);
  assert.deepEqual(sharedDemoMatters("unknown"), []);
  assert.equal(chinese(demoPeople[0].nameKey), "妈妈");
  assert.equal(chinese(demoPeople[1].nameKey), "Alex");
  for (const example of matterExamples) {
    for (const key of [example.labelKey, example.titleKey, example.typeKey, example.noteKey, ...example.fields.flat()]) {
      assert.notEqual(chinese(key), key);
      assert.notEqual(english(key), key);
    }
  }
});

test("shared-count grammar and name interpolation form complete locale-specific sentences", () => {
  assert.equal(english("public.sharing.count", { count: 1 }), "1 matter shared. Everything else stays private.");
  assert.equal(english("public.sharing.count", { count: 2 }), "2 matters shared. Everything else stays private.");
  assert.equal(chinese("public.sharing.count", { count: 2 }), "已共享 2 个事项，其余内容仍保持私密。");
  assert.equal(chinese("public.sharing.sharedWith", { name: "Alex" }), "与Alex共享");
});

test("display locale never converts or changes the locked Web annual price and plan limits", async () => {
  assert.equal(catalog.currency, "USD");
  assert.equal(catalog.annual.amountMinor, 8899);
  for (const locale of ["en", "zh-CN"]) assert.match(createFormatters(locale).formatMoney(8899, "USD"), /USD\s*88\.99/);
  assert.equal(english("public.price.onePerson"), "1 person");
  assert.equal(chinese("public.price.fivePeople"), "最多 5 人");
  const pricing = await source("landing/PlanSection.jsx");
  assert.match(pricing, /formatMoney\(catalog\.annual\.amountMinor, catalog\.currency\)/);
  assert.doesNotMatch(pricing, /CNY|exchangeRate|conversion/i);
});

test("legal references identify English originals while consent and licence bodies stay original", async () => {
  for (const key of ["terms", "privacy", "subscriptions", "refunds", "acceptable", "cookies", "notice"]) assert.match(chinese(`public.legal.${key}`), /英文正式文本/);
  const account = await source("PublicExperience.jsx");
  assert.match(account, /<span lang="en">I agree to the <a href=\{publicRoutes\.terms\} target="_blank" rel="noreferrer">Terms<\/a>, acknowledge the <a href=\{publicRoutes\.privacy\} target="_blank" rel="noreferrer">Privacy Policy<\/a>, and consent to electronic records\.<\/span>/);
  assert.match(account, /useState\(false\)/);
  assert.match(account, /disabled=\{!hasAccepted \|\| Boolean\(workingIntent\)\}/);
  assert.match(account, /locale === "zh-CN".*public\.account\.consentTranslation/);
  const legal = await source("landing/LegalInformation.jsx");
  assert.match(legal, /className="lp-license-text" lang="en"/);
  assert.match(legal, /<p key=\{index\}>\{paragraph\}<\/p>/);
  assert.doesNotMatch(legal, /t\(paragraph\)/);
});

test("both public headers keep language selection before the far-right appearance control", async () => {
  for (const [file, appearance] of [["landing/LandingChrome.jsx", "<AppearanceControl"], ["PublicExperience.jsx", "<AppAppearanceControl"]]) {
    const content = await source(file);
    assert.ok(content.indexOf("<LanguageControl") < content.indexOf(appearance));
  }
  const website = await source("PublicWebsite.jsx");
  assert.match(website, /document\.title = t\(titleKey\)/);
  assert.match(website, /const guideTarget = withLocale\(.+localePreference, locale\)/);
  assert.match(await source("PublicExperience.jsx"), /\[view, t\]/);
});

test("Chinese sample download stays synthetic and separate from real export contracts", async () => {
  const control = await source("landing/ControlSection.jsx");
  assert.match(control, /locale === "zh-CN" \? chineseExample : example/);
  const sample = await source("landing/rillora-sharing-example-zh-CN.txt");
  assert.match(sample, /虚构示例/);
  assert.match(sample, /无法远程收回/);
  assert.match(sample, /不要在 Rillora 中保存密码、助记词、私钥或完整恢复码/);
});
