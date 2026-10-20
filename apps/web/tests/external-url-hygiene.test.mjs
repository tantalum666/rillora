import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const gptHost = (host) => /(^|\.)(chatgpt\.com|chat\.openai\.com|chatgpt\.site)$/.test(host);

// Audit authored links, never sanitize runtime auth/payment URLs or user content.
function assertCleanURL(raw) {
  assert.doesNotMatch(raw, /[\s\u0000-\u001f\u007f\\]/, `Malformed raw URL: ${raw}`);
  const url = new URL(raw);
  assert.doesNotMatch(url.hostname, /(^|\.)chatgpt\.site$/, `Sites URL exposed: ${raw}`);
  const parameters = [...url.searchParams, ...new URLSearchParams(url.hash.slice(1))];
  for (const [key, value] of parameters) {
    if (/^(utm_.+|ref|referrer|source|from)$/i.test(key)) {
      assert.doesNotMatch(value, /chatgpt|chat\.openai|^gpt$/i, `GPT tracking suffix: ${raw}`);
    }
  }
  if (gptHost(url.hostname)) {
    assert.doesNotMatch(url.pathname, /(^|\/)(redirect|out|link)(\/|$)/i, `GPT intermediary: ${raw}`);
    for (const [key, value] of parameters) {
      assert.ok(!/^(url|u|to|target|redirect|redirect_url|redirect_to|redirectTo)$/i.test(key) || !/^(https?:)?\/\//i.test(value), `GPT intermediary: ${raw}`);
    }
  }
}

function sourceURLs(source) {
  // Also inspect JSON-escaped slashes and JS/JSON unicode escapes in source.
  const decoded = source.replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\//g, "/").replace(/&amp;/g, "&");
  return decoded.match(/https?:\/\/[^\s<>"'`{}\\)]+/g) ?? [];
}

test("link guard rejects GPT tracking and intermediary routes before publication", () => {
  for (const raw of [
    "https://legal.rillora.xyz/privacy?utm_source=chatgpt.com",
    "https://support.apple.com/en-us/102631?ref=ChatGPT",
    "https://legal.rillora.xyz/terms#utm_source=chatgpt.com",
    "https://chatgpt.com/redirect?url=https%3A%2F%2Flegal.rillora.xyz%2Fterms",
    "https://chat.openai.com/?target=https%3A%2F%2Fexample.com",
    "https://example.chatgpt.site/privacy",
    "https://chatgpt.com/?target=%2F%2Fexample.com",
    "https://chatgpt.com/?redirect_to=https%3A%2F%2Fexample.com",
    "https://support.apple.com/\narticle",
  ]) assert.throws(() => assertCleanURL(raw), raw);
  const escaped = String.raw`{"url":"https:\/\/example.com\/help?utm_source=\u0063hatgpt.com"}`;
  assert.equal(sourceURLs(escaped).length, 1);
  assert.throws(() => assertCleanURL(sourceURLs(escaped)[0]));
});

test("link guard preserves official references and functional query parameters", () => {
  for (const raw of [
    "https://help.openai.com/en/articles/6825453-chatgpt-release-notes",
    "https://platform.openai.com/docs/guides/authentication",
    "https://www.binance.com/en/my/risk/appeal?templateId=T192d41590",
    "https://support.google.com/accounts/troubleshooter/6357590?hl=en",
    "https://login.rillora.xyz/authorize?state=opaque&code_challenge=opaque&redirect_uri=https%3A%2F%2Fapp.rillora.xyz%2Fcallback",
    "https://app.rillora.xyz/account?next=guides&service=binance_us&lang=zh-CN",
  ]) assert.doesNotThrow(() => assertCleanURL(raw), raw);
});

test("authored Web, native, guide, attribution and legal integration URLs stay clean", () => {
  const extensions = new Set([".js", ".jsx", ".ts", ".tsx", ".swift", ".json", ".xcstrings", ".txt", ".html", ".plist", ".cjs", ".svg"]);
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && extensions.has(extname(child))) files.push(child);
    }
  }
  for (const path of ["apps/web/src", "apps/web/worker", "apps/ios/Rillora"]) visit(join(root, path));
  files.push(...[
    "config/provider-guides.json", "config/app-store-listing.en-US.json",
    "apps/api/src/legal-contract.ts", "infra/auth0/hosted-consent/form.json",
    "infra/auth0/universal-login/branding.json",
  ].map(path => join(root, path)));
  let count = 0;
  for (const path of files) {
    for (const raw of sourceURLs(readFileSync(path, "utf8"))) {
      assert.doesNotThrow(() => assertCleanURL(raw), `${relative(root, path)}: ${raw}`);
      count += 1;
    }
  }
  assert.ok(count > 100, "The cross-client source inventory must not silently become empty");
  const catalog = JSON.parse(readFileSync(join(root, "config/provider-guides.json"), "utf8"));
  for (const guide of catalog.guides) {
    for (const link of guide.links) assertCleanURL(link.urlString);
  }
});
