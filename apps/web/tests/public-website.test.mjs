import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
import guideCatalog from "../../../config/provider-guides.json" with { type: "json" };
import entry from "../../../config/public-entry.json" with { type: "json" };
import { guideIdentifiers } from "../src/guideIdentifiers.js";

test("public route identifiers match the private catalog without shipping guide bodies", () => {
  assert.deepEqual(
    [...guideIdentifiers].sort(),
    guideCatalog.guides.map((item) => item.id).sort(),
  );
});

const source = await readFile(
  new URL("../worker/public-router.js", import.meta.url),
  "utf8",
);
const handler = runInNewContext(`${source}; handler`);
const request = (uri, method = "GET") => handler({ request: { uri, method } });

test("public routing serves only public pages and fixed asset paths", () => {
  for (const path of [
    "/",
    "/product",
    "/product/",
    "/security",
    "/pricing",
    "/support",
    "/legal",
    "/legal/licenses",
    "/legal/licenses/",
  ])
    assert.equal(request(path).uri, "/index.html");
  assert.equal(request("/assets/logo-123.svg").uri, "/assets/logo-123.svg");
  for (const extension of ["jpg", "jpeg", "webp"]) {
    const uri = `/assets/folio-fixture.${extension}`;
    assert.equal(request(uri).uri, uri);
  }
  for (const path of [
    "/api/auth/start",
    "/account",
    "/accept/secret",
    "/.env",
    "/public-build.json",
    "/assets/../index.html",
    "/unknown",
  ]) {
    assert.equal(request(path).statusCode, 404);
    assert.equal(request(path).headers["cache-control"].value, "no-store");
  }
});
test("public guide bookmarks continue through sign-in on the chosen app only", () => {
  for (const guide of guideCatalog.guides) {
    const result = handler({
      request: {
        uri: "/guides",
        method: "GET",
        querystring: {
          service: { value: guide.id },
          token: { value: "private" },
          return_to: { value: "https://example.invalid" },
        },
      },
    });
    assert.equal(result.statusCode, 302);
    assert.equal(
      result.headers.location.value,
      `${entry.appOrigin}/account?next=guides&service=${guide.id}`,
    );
    assert.equal(result.headers["cache-control"].value, "no-store");
  }
  const unknown = handler({
    request: {
      uri: "/guides/",
      method: "HEAD",
      querystring: { service: { value: "private-token" } },
    },
  });
  assert.equal(
    unknown.headers.location.value,
    `${entry.appOrigin}/account?next=guides`,
  );
});
test("public routing rejects writes without an API or account fallback", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    assert.equal(request("/", method).statusCode, 405);
    assert.equal(request("/assets/logo-123.svg", method).statusCode, 405);
  }
});


test("guide redirects retain only an explicitly supported language enum", () => {
  for (const language of ["en", "zh-CN", "zh-HK", "javascript:alert(1)", "zh-CN&return_to=https://evil.test", "", undefined]) {
    const result = handler({ request: { uri: "/guides", method: "GET", querystring: {
      service: { value: "google" }, lang: { value: language },
      token: { value: "private" }, return_to: { value: "https://evil.test" },
    } } });
    const expected = `${entry.appOrigin}/account?next=guides&service=google${["en", "zh-CN"].includes(language) ? `&lang=${language}` : ""}`;
    assert.equal(result.headers.location.value, expected);
    assert.equal(result.headers["cache-control"].value, "no-store");
  }
});

test('guide redirects pass only a safe automatic hint and explicit selection wins',()=>{
  const redirect=querystring=>handler({request:{uri:'/guides',method:'GET',querystring}}).headers.location.value;
  assert.equal(redirect({langHint:{value:'zh-CN'}}),`${entry.appOrigin}/account?next=guides&langHint=zh-CN`);
  assert.equal(redirect({langHint:{value:'zh-CN'},lang:{value:'en'}}),`${entry.appOrigin}/account?next=guides&lang=en`);
  assert.equal(redirect({langHint:{value:'zh-CN&token=secret'}}),`${entry.appOrigin}/account?next=guides`);
});
