import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/legal-index.js";

function assets() {
  const calls = [];
  return {
    calls,
    binding: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname;
        calls.push(pathname);
        return new Response(pathname === "/legal.html" || pathname.startsWith("/assets/") ? "asset" : "missing", {
          status: pathname === "/legal.html" || pathname.startsWith("/assets/") ? 200 : 404,
        });
      },
    },
  };
}

test("redirects the publication root to Terms", async () => {
  const assetState = assets();
  const response = await worker.fetch(new Request("https://legal.example.test/"), {
    ASSETS: assetState.binding,
  });

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://legal.example.test/terms");
  assert.deepEqual(assetState.calls, []);
});

test("serves only allowlisted legal routes through the app shell", async () => {
  const assetState = assets();
  const response = await worker.fetch(
    new Request("https://legal.example.test/privacy", { headers: { accept: "text/html" } }),
    { ASSETS: assetState.binding },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(assetState.calls, []);
  assert.match(response.headers.get("content-security-policy"), /connect-src 'none'/);
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300, must-revalidate");
});

test("preserves only a supported language at the legal-site root", async () => {
  for (const [query, expected] of [["?lang=zh-CN&private=discard", "?lang=zh-CN"], ["?lang=en", "?lang=en"], ["?lang=unknown", ""]]) {
    const response = await worker.fetch(new Request(`https://legal.example.test/${query}`), { ASSETS: assets().binding });
    assert.equal(response.headers.get("location"), `https://legal.example.test/terms${expected}`);
  }
});

test("rejects account, API, unknown and write routes", async () => {
  for (const request of [
    new Request("https://legal.example.test/account"),
    new Request("https://legal.example.test/api/auth/session-status"),
    new Request("https://legal.example.test/unknown"),
    new Request("https://legal.example.test/terms", { method: "POST" }),
  ]) {
    const assetState = assets();
    const response = await worker.fetch(request, { ASSETS: assetState.binding });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(assetState.calls, []);
  }
});

test("caches fingerprinted assets immutably", async () => {
  const assetState = assets();
  const response = await worker.fetch(
    new Request("https://legal.example.test/assets/legal-abc123.js"),
    { ASSETS: assetState.binding },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
});

test("emits a legal entry and the Sites package files", async () => {
  const builtWorkerSource = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(builtWorkerSource, /Rillora Legal/);
  assert.match(builtWorkerSource, /Content-Security-Policy/);
  assert.doesNotMatch(builtWorkerSource, /__RILLORA_LEGAL_SHELL__/);
  await assert.rejects(access(new URL("../dist/client/index.html", import.meta.url)));
  await assert.rejects(access(new URL("../dist/client/legal.html", import.meta.url)));
  const scripts = await readFile(new URL("../src/LegalPublicationApp.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(scripts, /api\.|AccountPage|CookieNoticeBanner|localStorage|document\.cookie/);
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});

test("embeds the built legal shell in the deployed Worker", async () => {
  const builtWorker = (await import(`../dist/server/index.js?test=${Date.now()}`)).default;
  const response = await builtWorker.fetch(new Request("https://legal.example.test/terms"), {
    ASSETS: assets().binding,
  });

  assert.equal(response.status, 200);
  assert.match(await response.text(), /Rillora Legal/);
});

test("keeps the legal artifact inside its performance and content budgets", async () => {
  const assetDirectory = new URL("../dist/client/assets/", import.meta.url);
  const files = await readdir(assetDirectory);
  const javascriptFiles = files.filter((file) => file.endsWith(".js"));
  const stylesheetFiles = files.filter((file) => file.endsWith(".css"));

  assert.equal(javascriptFiles.length, 1);
  assert.equal(stylesheetFiles.length, 1);
  // Original type/CSS/JS budget plus the selected logo variants, three icons and font notices.
  assert.ok(files.length <= 18, `Expected no more than 18 legal assets, received ${files.length}`);
  const fontLicenseFile = files.find((file) => /^font-licenses-.*\.txt$/.test(file));
  assert.ok(fontLicenseFile, "Redistributed legal-site fonts must include their licence notices");
  const fontLicenses = await readFile(new URL(fontLicenseFile, assetDirectory), "utf8");
  assert.match(fontLicenses, /Adobe/);
  assert.match(fontLicenses, /Inter Project Authors/);
  assert.match(fontLicenses, /SIL OPEN FONT LICENSE Version 1\.1/);

  const javascript = await readFile(new URL(javascriptFiles[0], assetDirectory));
  const stylesheet = await readFile(new URL(stylesheetFiles[0], assetDirectory));
  assert.ok(gzipSync(javascript).byteLength <= 100 * 1024);
  assert.ok(gzipSync(stylesheet).byteLength <= 20 * 1024);

  const source = javascript.toString("utf8");
  for (const forbidden of [
    "Create my private map",
    "Opening secure sign in",
    "/api/auth/session-status",
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replaceAll("/", "\\/")));
  }
});
