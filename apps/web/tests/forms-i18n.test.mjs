import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createTranslator, validateCatalogs } from "../src/i18n/core.js";
import { en, zhCN } from "../src/i18n/messages/forms.js";
import { guideActionLabel } from "../src/firstUse.js";
import { applicableDetails, matterCategories, matterDraftChanged, matterFields, matterPayload, matterValidation, matterValidationIssue, providerTitle, locationTitle, toMatterDraft } from "../src/matterForm.js";

const catalogs = { en, "zh-CN": zhCN };
const english = createTranslator("en", catalogs);
const chinese = createTranslator("zh-CN", catalogs);
const source = name => readFile(new URL(`../src/${name}`, import.meta.url), "utf8");

test("forms catalogs cover the same stable keys and interpolation parameters", () => {
  assert.deepEqual(validateCatalogs(catalogs), []);
  assert.ok(Object.keys(en).length > 200);
  assert.ok(Object.keys(en).every(key => key.startsWith("forms.")));
  assert.equal(chinese("forms.name"), "名称");
  assert.equal(chinese("forms.directions"), "查找指引");
  assert.equal(chinese("forms.details"), "详细资料");
  assert.equal(chinese("forms.guides.title"), "账号身后处理指南");
  assert.equal(chinese("forms.invitation.invited", { name: "Alex & <Friend>" }), "Alex & <Friend> 邀请了你");
});

test("form labels localize while machine field names and requirements are unchanged", () => {
  assert.deepEqual(matterCategories.map(([key]) => key), ["account", "financial_asset", "debt", "document", "device", "subscription", "crypto_asset"]);
  for (const [category] of matterCategories) {
    for (const cryptoCustody of ["exchange", "self_custody"]) {
      const draft = toMatterDraft({ category, details: { cryptoCustody } });
      const fields = matterFields(draft);
      const localized = matterFields(draft, chinese);
      assert.deepEqual(localized.map(({ key, required, max }) => ({ key, required, max })), fields.map(({ key, required, max }) => ({ key, required, max })));
      for (const field of localized) {
        assert.equal(field.label, chinese(field.labelKey));
        assert.equal(field.placeholder, chinese(field.placeholderKey));
      }
    }
  }
  assert.equal(providerTitle("account"), "Provider");
  assert.equal(providerTitle("financial_asset", chinese), "金融机构");
  assert.equal(locationTitle("document"), "Document location");
  assert.equal(locationTitle("document", chinese), "文件存放位置");
});

test("validation produces language-independent issues and keeps English defaults", () => {
  const draft = toMatterDraft();
  assert.deepEqual(matterValidationIssue(draft), { messageKey: "forms.validation.name", params: {} });
  assert.equal(matterValidation(draft), "Add a name.");
  assert.equal(matterValidation(draft, chinese), "请填写名称。");
  draft.title = "Original name 名称";
  assert.equal(matterValidation(draft), "Add the provider.");
  assert.equal(matterValidation(draft, chinese), "请填写服务方。");
  draft.category = "crypto_asset";
  assert.equal(matterValidation(draft), "Choose an exchange or an on-chain wallet.");
  draft.details.cryptoCustody = "self_custody";
  assert.equal(matterValidation(draft), "Add the blockchain network.");
  assert.equal(matterValidation(draft, chinese), "请填写区块链网络。");
  draft.details.network = "Ethereum";
  assert.equal(matterValidation(draft, chinese), "请填写公开钱包地址。");
  draft.details.walletAddress = "0x12 34";
  assert.equal(matterValidation(draft, chinese), "请填写不含空格的公开钱包地址。");
  draft.details.walletAddress = "0x1234";
  assert.equal(matterValidation(draft), null);
  assert.equal(matterValidation(draft, chinese), null);
  draft.notes = "n".repeat(2001);
  assert.equal(matterValidation(draft), "Notes must be 2,000 characters or fewer.");
  assert.equal(matterValidation(draft, chinese), "备注不能超过 2,000 个字符。");
});

test("locale switches cannot mutate saved values, eligibility, or hidden-field filtering", () => {
  const draft = toMatterDraft({ title: "中文名称 with English", category: "crypto_asset", institutionName: "Private exchange", notes: "Original notes 保持原文", desiredOutcome: "never_disclose", details: { cryptoCustody: "self_custody", network: "Ethereum", walletAddress: "0x1234", walletLabel: "Hardware wallet", assetType: "Hidden" } });
  draft.initialValues = structuredClone(draft);
  const before = structuredClone(draft);
  const payload = matterPayload(draft);
  for (const t of [english, chinese, english]) {
    matterFields(draft, t);
    assert.equal(matterValidation(draft, t), null);
    assert.deepEqual(matterPayload(draft), payload);
    assert.equal(matterDraftChanged(draft), false);
    assert.deepEqual(draft, before);
  }
  assert.equal(payload.institutionName, null);
  assert.equal(payload.title, before.title);
  assert.equal(payload.notes, before.notes);
  assert.equal(payload.desiredOutcome, "never_disclose");
  assert.equal(applicableDetails(draft).assetType, undefined);
});

test("first-use helper keeps paused/resumed semantics across locales", () => {
  assert.equal(guideActionLabel({ firstUseState: "guide_paused", firstUseStep: 0 }), "Resume the guide");
  assert.equal(guideActionLabel({ firstUseState: "guide_paused", firstUseStep: 0 }, chinese), "继续引导");
  assert.equal(guideActionLabel({ firstUseState: "available", firstUseStep: 0 }, chinese), "可选引导");
});

test("invitation consent uses selected-language copy with explicit acceptance gates", async () => {
  const invitation = await source("InvitationPage.jsx");
  assert.match(invitation, /useState\(false\)/);
  assert.match(invitation, /if \(!acceptedLegal \|\| busy \|\| !invitation\) return/);
  assert.equal((invitation.match(/disabled=\{!acceptedLegal \|\| busy\}/g) ?? []).length, 2);
  assert.match(invitation, /<RegistrationConsentText external \/>/);
  assert.match(invitation, /legalAcceptance: \{ \.\.\.LEGAL_CONTRACT, acceptedTerms: true, acknowledgedPrivacy: true, acceptedElectronicRecords: true \}/);
  assert.match(invitation, /accepted: true/);
  assert.match(invitation, /<LanguageControl \/>/);
});

test("provider bodies use the resolved content locale without changing review provenance", async () => {
  const panels = await source("TaskPanels.jsx");
  assert.doesNotMatch(panels, /t\("forms\.guides\.english"\)/);
  assert.match(panels, /<ul lang=\{guide\.contentLocale\}>\{guide\.requirements/);
  assert.match(panels, /<p lang=\{guide\.contentLocale\}>\{guide\.boundary\}/);
  assert.match(panels, /className="guide-current-step" lang=\{guide\.contentLocale\}/);
  assert.match(panels, /<span lang=\{guide\.contentLocale\}>\{link\.title\}/);
  assert.match(panels, /timeZone: "UTC"/);
});
