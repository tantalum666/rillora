import assert from "node:assert/strict";
import test from "node:test";
import { readFile, access } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { PUBLIC_ORIGIN, PUBLIC_LOCALES, publicPages, publicPath, publicPageFile, publicRoute } from "../src/publicSeo.js";
import { publicCatalogs } from "../src/i18n/publicCatalogs.js";
import { validateCatalogs, createTranslator } from "../src/i18n/core.js";

const router = runInNewContext(`${await readFile(new URL('../worker/public-router.js', import.meta.url), 'utf8')}; handler`);
const request = (uri, querystring = {}, method = 'GET') => router({ request: { uri, querystring, method } });

test('public discovery metadata and original education are complete in both languages', () => {
  assert.deepEqual(validateCatalogs(publicCatalogs), []);
  for (const locale of PUBLIC_LOCALES) {
    const t = createTranslator(locale, publicCatalogs);
    for (const meta of Object.values(publicPages)) for (const key of Object.values(meta)) assert.notEqual(t(key), key);
  }
});

test('canonical language links preserve fragments without rewriting external or private destinations', () => {
  assert.equal(publicPath('/product#sharing', 'zh-CN'), '/zh-CN/product#sharing');
  assert.equal(publicPath('/zh-CN/product?lang=zh-CN#sharing', 'en'), '/en/product#sharing');
  assert.deepEqual(publicRoute('/zh-CN/'), { locale: 'zh-CN', path: '/' });
  for (const input of ['/account', '/api/v1', '//evil.test/product', 'https://evil.test/product', 'javascript:alert(1)', '/\\evil.test']) assert.equal(publicPath(input, 'zh-CN'), input);
});

test('edge chooses locale-specific cache objects and preserves old public and guide bookmarks', () => {
  for (const path of Object.keys(publicPages)) for (const locale of PUBLIC_LOCALES) {
    assert.equal(request(publicPath(path, locale)).uri, '/' + publicPageFile(path, locale));
    assert.equal(request(publicPath(path, locale), {}, 'HEAD').uri, '/' + publicPageFile(path, locale));
  }
  assert.equal(request('/pricing', { lang: { value: 'zh-CN' }, token: { value: 'do-not-forward' } }).headers.location.value, '/zh-CN/pricing');
  assert.equal(request('/en/product', { lang: { value: 'zh-CN' }, appearance: { value: 'dark' } }).headers.location.value, '/zh-CN/product?appearance=dark');
  assert.equal(request('/product', { lang: { value: 'zh-CN&evil=1' } }).uri, '/pages/en/product.html');
  assert.equal(request('/zh-CN/guides', { service: { value: 'google' } }).headers.location.value, 'https://app.rillora.xyz/account?next=guides&service=google&langHint=zh-CN');
  for (const file of ['/robots.txt', '/sitemap.xml']) assert.equal(request(file).uri, file);
  for (const privatePath of ['/zh-CN/account', '/en/api/auth/start', '/pages/en/index.html', '/zh-CN/.env', '/en/../account', '/zh-CN/unknown']) assert.equal(request(privatePath).statusCode, 404);
  assert.equal(request('/zh-CN/product', {}, 'POST').statusCode, 405);
});

// Run after build:public in the packaging/browser job; source-only tests still run without artifacts.
if (process.env.RILLORA_TEST_PUBLIC_BUILD === '1') {
  test('built HTML has actual locale-specific body, metadata and no blocked inline styles', async () => {
    const root = new URL('../dist-public/', import.meta.url);
    for (const locale of PUBLIC_LOCALES) for (const path of Object.keys(publicPages)) {
      const html = await readFile(new URL(publicPageFile(path, locale), root), 'utf8');
      assert.ok(html.includes(`<html lang="${locale}"`));
      assert.ok(html.includes('<div id="root" data-prerendered="true">'));
      assert.match(html, /<h1[^>]*>[^<]+/);
      assert.ok(html.includes(`rel="canonical" href="${PUBLIC_ORIGIN}${publicPath(path, locale)}"`));
      assert.match(html, /hreflang="en"/); assert.match(html, /hreflang="zh-CN"/);
      assert.doesNotMatch(html, / style="|(?:src|href|srcSet)="\/src\/|\$R[CX]\(|Switch to client rendering/);
      const structured = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
      assert.equal(structured['@graph'][2].inLanguage, locale);
      assert.equal(structured['@graph'][2].url, PUBLIC_ORIGIN + publicPath(path, locale));
      for (const [, asset] of html.matchAll(/(?:src|href|srcSet)="(\/assets\/[^"?#]+)"/g)) await access(new URL('.' + asset, root));
      const text = html.split('data-prerendered="true">')[1];
      if (locale === 'zh-CN') assert.match(text, /事项|服务|第三方|密码/);
      else assert.doesNotMatch(text.replace(/<option[\s\S]*?<\/option>/g, '').replace(/aria-label="[^"]*"/g, ''), /我们|事项|数字遗产/);
    }
    const security = await readFile(new URL(publicPageFile('/security', 'en'), root), 'utf8');
    assert.match(security, /<details class="lp-faq-item"/);
    assert.ok(security.includes(publicCatalogs.en['public.control.revoke.answer'].replaceAll('&', '&amp;').replaceAll("'", '&#x27;')));
    const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
    assert.equal([...sitemap.matchAll(/<loc>/g)].length, 20);
    assert.doesNotMatch(sitemap, /\/guides|\/account|\/invite|\/api\//);
    assert.match(await readFile(new URL('robots.txt', root), 'utf8'), /Sitemap: https:\/\/www\.rillora\.xyz\/sitemap\.xml/);
  });
}
