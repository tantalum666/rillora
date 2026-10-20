import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTranslator, createFormatters, mergeCatalogs, validateCatalogs } from "../src/i18n/core.js";
import { errorMessage } from "../src/i18n/errors.js";
import * as common from "../src/i18n/messages/common.js";
import * as forms from "../src/i18n/messages/forms.js";
import * as sharing from "../src/i18n/messages/sharing.js";
import { connectionStatus, savedCopyLabel, sharedFieldLabels, sharedFieldValue, sharedCategoryLabel, sharingMessage, sharingLevels } from "../src/sharing.js";
import { reviewTaskLabel, reviewStates, reviewReasons } from "../src/familyMaintenance.js";

const catalogs = mergeCatalogs(common, forms, sharing);
const en = createTranslator("en", catalogs);
const zh = createTranslator("zh-CN", catalogs);
const panelNames = ["SharingPanels", "StartHerePanel", "FamilyMaintenancePanel", "AccountDataPanel", "AccountDeletionStatus", "SavedCopyReader", "DisclosureRehearsalPanel", "RoleAssignmentPolicyPanel"];

test("sharing catalogs have matching keys and interpolation variables", () => {
  assert.deepEqual(validateCatalogs(catalogs), []);
  for (const name of panelNames) {
    const source = readFileSync(new URL(`../src/${name}.jsx`, import.meta.url), "utf8");
    for (const [, key] of source.matchAll(/["'](sharing\.[A-Za-z0-9_.]+)["']/g)) {
      assert.ok(Object.hasOwn(sharing.en, key), `${name}: missing ${key}`);
    }
  }
});

test("sharing names and status follow the render locale without changing grant values", () => {
  assert.deepEqual(sharingLevels.map(level => level.value), ["name", "directions", "details"]);
  assert.deepEqual(sharingLevels.map(level => zh(`sharing.level.${level.value}`)), ["名称", "查找指引", "详细资料"]);
  const paused = { status: "accepted", access: { mode: "saved" } };
  assert.equal(connectionStatus(paused), "Updates paused");
  assert.equal(connectionStatus(paused, zh), "更新已暂停");
  assert.equal(connectionStatus({ status: "revoked", access: { mode: "saved" } }, zh), "已停止共享");
  assert.equal(connectionStatus(null, zh), "尚未邀请");
});

test("shared and saved fields translate only known labels and enum values", () => {
  for (const key of Object.keys(sharedFieldLabels)) assert.ok(Object.hasOwn(sharing.zhCN, `sharing.field.${key}`));
  assert.equal(sharedFieldValue("desiredOutcome", "never_disclose", zh), "永不披露");
  assert.equal(sharedFieldValue("cryptoCustody", "self_custody", zh), "链上钱包");
  for (const key of ["notes", "institutionName", "locationHint", "walletAddress", "accountHint", "deviceModel", "assetType"]) {
    assert.equal(sharedFieldValue(key, "Saved English · 原始文字 · 0x123", zh), "Saved English · 原始文字 · 0x123");
  }
  assert.equal(sharedFieldValue("desiredOutcome", "future_value", zh), "future_value");
  assert.equal(sharedCategoryLabel("account", zh), "在线账号");
  assert.equal(sharedCategoryLabel("future_category", zh), "future_category");
});

test("saved-copy labels format dates in the chosen locale with a truthful paid-period fallback", () => {
  const item = { accessMode: "saved", savedAt: "2026-09-15T12:00:00Z" };
  assert.equal(savedCopyLabel(item, zh, createFormatters("zh-CN").formatDate), "更新已暂停 · 保存于2026年9月15日");
  assert.equal(savedCopyLabel({ ...item, savedAt: null }, zh, createFormatters("zh-CN").formatDate), "更新已暂停 · 保存于付费期间");
  assert.equal(savedCopyLabel({ ...item, savedAt: "invalid" }, zh, createFormatters("zh-CN").formatDate), "更新已暂停 · 保存于付费期间");
  assert.equal(savedCopyLabel({ ...item, accessMode: "live" }, zh, createFormatters("zh-CN").formatDate), "");
});

test("persistent notices and errors resolve again when the user changes language", () => {
  const notice = { key: "sharing.account.imported", params: { count: 2 } };
  const failure = { cause: new Error("unrecognized English server detail"), key: "sharing.contact.saveError" };
  for (const translate of [en, zh]) {
    const localError = (error, fallback) => errorMessage(error, translate, fallback);
    assert.equal(sharingMessage(notice, translate, localError), translate(notice.key, notice.params));
    assert.equal(sharingMessage(failure, translate, localError), translate(failure.key));
    assert.ok(!sharingMessage(failure, translate, localError).includes("unrecognized English"));
  }
  assert.equal(en("sharing.copy.matterCount", { count: 1 }), "1 matter in this copy");
  assert.equal(en("sharing.copy.matterCount", { count: 2 }), "2 matters in this copy");
  assert.equal(zh("sharing.copy.matterCount", { count: 2 }), "此副本包含 2 个事项");
});

test("review labels preserve scope-change and stale checks in either locale", () => {
  assert.equal(reviewTaskLabel({ scopeAvailable: false }, zh), "共享已更改");
  assert.equal(reviewTaskLabel({ scopeAvailable: true, isStale: true }, zh), "重新复核");
  for (const state of Object.keys(reviewStates)) {
    assert.equal(reviewTaskLabel({ scopeAvailable: true, isStale: false, state }, zh), zh(`sharing.review.state.${state}`));
  }
  for (const reason of Object.keys(reviewReasons)) assert.ok(Object.hasOwn(sharing.zhCN, `sharing.review.reason.${reason}`));
});

test("translation retains deletion confirmation, local key protection and export language boundaries", () => {
  const deletion = readFileSync(new URL("../src/AccountDataPanel.jsx", import.meta.url), "utf8");
  const exportPanel = readFileSync(new URL("../src/StartHerePanel.jsx", import.meta.url), "utf8");
  const reader = readFileSync(new URL("../src/SavedCopyReader.jsx", import.meta.url), "utf8");
  assert.match(deletion, /deleteWord!==expectedDeleteWord/);
  assert.equal(zh("sharing.account.typeDelete"), "输入“删除”以确认");
  assert.match(exportPanel, /createPrintableStartHere\(preview\.export\.publicId, locale\)/);
  assert.match(exportPanel, /sharing\.copy\.exitWarning/);
  assert.match(exportPanel, /beforeunload/);
  assert.match(reader, /\{copy\.text\}/);
  assert.doesNotMatch(reader, /t\(copy\.text\)/);
});
