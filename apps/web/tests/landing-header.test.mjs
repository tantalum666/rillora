import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import { en, zhCN } from '../src/i18n/messages/public.js';
const source = relative => readFile(new URL(relative, import.meta.url), 'utf8');

test('landing header layout has one owner, no historical competing selectors', async () => {
  for (const file of ['landing-base.css', 'landing-responsive.css', 'landing-pages.css', 'landing-i18n.css']) {
    const css = postcss.parse(await source(`../src/landing/${file}`));
    css.walkRules(rule => assert.doesNotMatch(rule.selector, /\.lp-(?:header|nav|menu-toggle)(?![\w-])/, `${file}: ${rule.selector}`));
  }
  const header = await source('../src/landing/landing-header.css');
  assert.match(header, /grid-template-columns: minmax\(0, 1fr\) max-content minmax\(0, 1fr\)/);
  assert.match(header, /@media \(max-width: 767px\)/);
  assert.doesNotMatch(header, /max-width: 1400px/);
  const component = await source('../src/landing/LandingChrome.jsx');
  assert.match(component, /LanguageControl className="lp-language" compact/);
  assert.match(component, /aria-expanded=\{open\}/);
  assert.match(component, /aria-controls="lp-navigation"/);
});

test('public Apple channel note is bilingual and has no invented quotation', async () => {
  for (const catalog of [en, zhCN]) {
    assert.match(catalog['public.price.appleNote'], /Apple/);
    assert.doesNotMatch(catalog['public.price.appleNote'], /\d/);
  }
  assert.match(en['public.price.appleNote'], /final amount.*confirm/);
  assert.match(zhCN['public.price.appleNote'], /最终金额.*购买确认/);
  const pricing = await source('../src/landing/PlanSection.jsx');
  assert.match(pricing, /lp-channel-price-note.*public\.price\.appleNote/);
  assert.match(pricing, /formatMoney\(catalog\.annual\.amountMinor, catalog\.currency\)/);
});
