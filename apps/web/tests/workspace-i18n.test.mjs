import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createTranslator, createFormatters, validateCatalogs } from '../src/i18n/core.js';
import { en, zhCN } from '../src/i18n/messages/workspace.js';
import { getTrustedContactEvidence } from '../src/contactEvidence.js';
import { matterStatusLabel, readMatterDraft, writeMatterDraft } from '../src/matterDraftStorage.js';
import { billingStateLabel, commercialFeatureLabel, commercialPlanLabel } from '../src/commercialAccess.js';
import { mobilePrimaryNavigation, mobileMoreDestinationDefinitions } from '../src/mobileNavigation.js';
import { readWorkspaceRoute, workspaceURL } from '../src/workspaceNavigation.js';
import { toMatterDraft } from '../src/matterForm.js';
import { webAnnualOffer, webAnnualPriceLabel } from '../src/productionBilling.js';

const catalogs = { en, 'zh-CN': zhCN };
const english = createTranslator('en', catalogs);
const chinese = createTranslator('zh-CN', catalogs);

test('workspace catalogs have complete keys, matching parameters and localized counts', () => {
  assert.deepEqual(validateCatalogs(catalogs), []);
  assert.equal(english('workspace.overview.matterCount', { count: 1, total: 1 }), '1 matter');
  assert.equal(english('workspace.overview.matterCount', { count: 2, total: 2 }), '2 matters');
  assert.equal(chinese('workspace.overview.matterCount', { count: 2, total: 2 }), '2 个事项');
  assert.equal(chinese('workspace.nav.shared'), '与我共享');
});

test('desktop and mobile route identities have render-time labels without translated URLs', () => {
  const ids = [...new Set([...mobilePrimaryNavigation, ...mobileMoreDestinationDefinitions].map(({id}) => id))];
  for (const id of ids) {
    assert.ok(en[`workspace.nav.${id}`]);
    assert.ok(zhCN[`workspace.nav.${id}`]);
    assert.notEqual(chinese(`workspace.nav.${id}`), english(`workspace.nav.${id}`));
    const route = readWorkspaceRoute(`/?view=${id}`);
    assert.equal(readWorkspaceRoute(workspaceURL(route)).view, id);
  }
  for (const {id} of mobileMoreDestinationDefinitions) assert.ok(zhCN[`workspace.navDetail.${id}`]);
});

test('localized matter and contact labels preserve evidence, statuses and legacy defaults', () => {
  assert.equal(matterStatusLabel({ recordStatus: 'ready' }), 'Directions added');
  assert.equal(matterStatusLabel({ recordStatus: 'ready' }, chinese), '已添加查找指引');
  assert.equal(matterStatusLabel({ recordStatus: 'draft', status: 'added' }, chinese), '草稿');
  assert.equal(matterStatusLabel({ recordStatus: 'needs_review' }, chinese), '待复核');
  assert.equal(matterStatusLabel({ recordStatus: 'archived' }, chinese), '已归档');
  const source = Object.freeze({ invitationStatus: 'accepted', confirmationMode: 'simulation' });
  const result = getTrustedContactEvidence(source, chinese);
  assert.deepEqual(result, { label: '模拟接受', accepted: false, simulated: true });
  assert.deepEqual(getTrustedContactEvidence(source), { label: 'Simulated acceptance', accepted: false, simulated: true });
  assert.equal(getTrustedContactEvidence({ invitationStatus: 'accepted', confirmationMode: 'real' }, chinese).accepted, true);
  assert.equal(getTrustedContactEvidence({ status: 'revoked', invitationStatus: 'accepted' }, chinese).accepted, false);
});

test('commercial rendering adapters localize known metadata without changing access or unknown values', () => {
  const access = Object.freeze({ available: true, currentAccessLabel: 'Rillora Free · Test access', currentAccess: Object.freeze({ planCode: 'free' }), validationOnly: true, billingOpen: false });
  assert.equal(commercialPlanLabel(access), access.currentAccessLabel);
  assert.equal(commercialPlanLabel(access, chinese), 'Rillora 免费版 · 测试权限');
  assert.equal(access.billingOpen, false);
  assert.equal(billingStateLabel('active', chinese), '家庭版已启用');
  assert.equal(billingStateLabel('unknown_future_state', chinese), '家庭版订阅');
  assert.equal(commercialFeatureLabel('Matter map', chinese), '事项地图');
  assert.equal(commercialFeatureLabel('Matter map'), 'Matter map');
  assert.equal(commercialFeatureLabel('Unknown capability from server', chinese), 'Unknown capability from server');
  assert.equal(commercialPlanLabel({ ...access, currentAccessLabel: 'Future plan', currentAccess: { planCode: 'future' } }, chinese), 'Future plan');
});

test('annual USD 88.99 and historic currency amounts survive locale formatting unchanged', () => {
  const before = structuredClone(webAnnualOffer);
  assert.equal(webAnnualOffer.amountMinor, 8899);
  assert.equal(webAnnualOffer.currency, 'USD');
  assert.equal(webAnnualPriceLabel, 'US$88.99/year');
  for (const locale of ['en', 'zh-CN']) {
    const {formatMoney, formatDate} = createFormatters(locale);
    assert.match(formatMoney(webAnnualOffer.amountMinor, webAnnualOffer.currency, 2), /USD\s*88\.99/);
    assert.match(formatMoney(999, 'USD', 2), /USD\s*9\.99/);
    assert.match(formatMoney(69800, 'CNY', 2), /CNY\s*698\.00/);
    assert.notEqual(formatDate('2026-10-04T12:30:00Z'), '—');
  }
  assert.deepEqual(webAnnualOffer, before);
});

test('display localization never rewrites user names, record drafts or route filters', () => {
  const title = 'Bank account / 私人记录';
  assert.equal(chinese('workspace.contact.shareWith', { name: title }), `与${title}共享`);
  const values = new Map();
  const store = { setItem: (k,v) => values.set(k,v), getItem: k => values.get(k), removeItem: k => values.delete(k) };
  const owner = '11111111-1111-4111-8111-111111111111';
  const draft = { type: 'matter-create', ...toMatterDraft({ title, category: 'account', institution: 'Apple', desiredOutcome: 'never_disclose', notes: 'English 中文' }), initialValues: toMatterDraft() };
  assert.equal(writeMatterDraft(owner, draft, store, 1000), true);
  const before = readMatterDraft(owner, store, 1100);
  matterStatusLabel({ recordStatus: 'draft' }, chinese);
  getTrustedContactEvidence(null, chinese);
  assert.deepEqual(readMatterDraft(owner, store, 1100), before);
  assert.equal(before.title, title);
  assert.equal(before.desiredOutcome, 'never_disclose');
  const route = readWorkspaceRoute('/?view=matters&q=Apple&filter=review&task=matter-create&category=account');
  assert.deepEqual(readWorkspaceRoute(workspaceURL(route)), route);
});

test('all static workspace message references resolve in both locales', async () => {
  for (const file of ['App.jsx','SharingMotion.jsx','ProductionBillingControls.jsx','TestBillingControls.jsx','commercialAccess.js','contactEvidence.js','matterDraftStorage.js']) {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
    for (const [,key] of source.matchAll(/["'](workspace\.[A-Za-z0-9_.]+)["']/g)) {
      assert.ok(Object.hasOwn(en,key), `${file}: ${key} in English`);
      assert.ok(Object.hasOwn(zhCN,key), `${file}: ${key} in Chinese`);
    }
  }
});

test('production purchase acceptance retains its versioned English text and unchecked state', async () => {
  const source = await readFile(new URL('../src/ProductionBillingControls.jsx', import.meta.url), 'utf8');
  assert.ok(source.includes('<span lang="en">I agree to the <a href={publicRoutes.subscriptions} target="_blank" rel="noopener noreferrer">Subscription Terms</a> and <a href={publicRoutes.refunds} target="_blank" rel="noopener noreferrer">Refund Policy</a>, including yearly renewal and cancellation.</span>'));
  assert.match(source, /\[accepted, setAccepted\] = useState\(false\)/);
  assert.match(source, /purchaseProof\(quote, accepted\)/);
  assert.match(source, /commerce\.billingOpen && commerce\.offers\.some/);
});
