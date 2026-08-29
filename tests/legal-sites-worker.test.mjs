import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
        return new Response(pathname === "/index.html" || pathname.startsWith("/assets/") ? "asset" : "missing", {
          status: pathname === "/index.html" || pathname.startsWith("/assets/") ? 200 : 404,
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
  assert.deepEqual(assetState.calls, ["/privacy", "/index.html"]);
  assert.match(response.headers.get("content-security-policy"), /connect-src 'none'/);
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300, must-revalidate");
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
  const index = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  assert.match(index, /Rillora Legal/);
  const scripts = await readFile(new URL("../src/LegalPublicationApp.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(scripts, /api\.|AccountPage|CookieNoticeBanner|localStorage|document\.cookie/);
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
