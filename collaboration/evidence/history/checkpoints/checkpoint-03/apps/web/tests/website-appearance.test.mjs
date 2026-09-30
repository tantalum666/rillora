import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { withAppearance } from "../src/appearanceLink.js";
import test from "node:test";
import assert from "node:assert/strict";
const source = await readFile(
  new URL("../src/websiteAppearance.js", import.meta.url),
  "utf8",
);
const key = "rillora.website.appearance.v1";
function browser({ saved = null, dark = false, blocked = false, url = "https://app.staging.rillora.xyz/" } = {}) {
  const values = new Map(saved ? [[key, saved]] : []),
    writes = [],
    events = {};
  const media = {
    matches: dark,
    addEventListener(type, listener) {
      this.listener = listener;
    },
  };
  const document = {
    documentElement: { dataset: {} },
    querySelectorAll: () => [],
  };
  const window = {
    location: { href: url },
    history: { state: { audit: true }, replaceState: (state, title, path) => { window.location.href = new URL(path, url).href; } },
    matchMedia: () => media,
    localStorage: {
      getItem: (k) => {
        if (blocked) throw Error("blocked");
        return values.get(k) ?? null;
      },
      setItem: (k, v) => {
        if (blocked) throw Error("blocked");
        values.set(k, v);
        writes.push([k, v]);
      },
      removeItem: (k) => {
        if (blocked) throw Error("blocked");
        values.delete(k);
        writes.push([k, null]);
      },
    },
    addEventListener: (name, fn) => (events[name] = fn),
  };
  runInNewContext(source, { window, document, URL });
  return {
    window,
    document,
    values,
    writes,
    media,
    events,
    store: window.rilloraWebsiteAppearance,
  };
}
test("system appearance follows changes without writing a preference", () => {
  const b = browser({ dark: true });
  assert.equal(b.store.getSnapshot().resolved, "dark");
  b.media.matches = false;
  b.media.listener();
  assert.equal(b.store.getSnapshot().resolved, "light");
  assert.equal(b.writes.length, 0);
});
test("saved manual mode wins over system and System clears it", () => {
  const b = browser({ saved: "light", dark: true });
  assert.equal(b.document.documentElement.dataset.appearance, "light");
  b.store.setPreference("dark");
  assert.equal(b.values.get(key), "dark");
  b.media.matches = false;
  b.media.listener();
  assert.equal(b.store.getSnapshot().resolved, "dark");
  b.store.setPreference("system");
  assert.equal(b.values.has(key), false);
  assert.equal(b.store.getSnapshot().resolved, "light");
});
test("invalid saved/input values cannot introduce arbitrary state", () => {
  const b = browser({ saved: "<script>bad</script>" });
  assert.equal(b.store.getSnapshot().preference, "system");
  b.store.setPreference("invalid");
  assert.equal(b.writes.length, 0);
});
test("blocked browser storage still permits current-page switching", () => {
  const b = browser({ blocked: true });
  b.store.setPreference("dark");
  assert.equal(b.store.getSnapshot().resolved, "dark");
  assert.equal(b.store.getSnapshot().persistenceAvailable, false);
});
test("other tabs synchronize only the appearance key; bootstrap is idempotent", () => {
  const b = browser();
  const store = b.store;
  runInNewContext(source, { window: b.window, document: b.document });
  assert.equal(store, b.window.rilloraWebsiteAppearance);
  b.events.storage({ key: "unrelated", newValue: "dark" });
  assert.equal(store.getSnapshot().preference, "system");
  b.events.storage({ key, newValue: "dark" });
  assert.equal(store.getSnapshot().resolved, "dark");
  b.events.storage({ key, newValue: null });
  assert.equal(store.getSnapshot().preference, "system");
});

test("appearance handoff preserves invitation context and fragment", () => {
  const url = "https://app.staging.rillora.xyz/invite/example?from=shared&appearance=light#key=sample";
  const b = browser({ saved:"dark", url });
  assert.equal(b.store.getSnapshot().preference, "light");
  assert.equal(b.values.get(key), "light");
  assert.equal(b.window.location.href, "https://app.staging.rillora.xyz/invite/example?from=shared#key=sample");
});
test("system handoff clears only the appearance value; malformed hints are ignored", () => {
  const b = browser({ saved:"dark", dark:false, url:"https://app.staging.rillora.xyz/account?appearance=system&intent=matter" });
  assert.equal(b.values.has(key), false);
  assert.equal(b.store.getSnapshot().resolved, "light");
  assert.equal(b.window.location.href, "https://app.staging.rillora.xyz/account?intent=matter");
  const invalid = browser({ saved:"dark", url:"https://app.staging.rillora.xyz/?appearance=invalid" });
  assert.equal(invalid.store.getSnapshot().preference, "dark");
  assert.equal(invalid.writes.length, 0);
});
test("public links carry display choice only to known app origins", () => {
  assert.equal(withAppearance("https://app.rillora.xyz/account?intent=matter#saved", "dark"), "https://app.rillora.xyz/account?intent=matter&appearance=dark#saved");
  assert.equal(withAppearance("https://example.test/account", "light"), "https://example.test/account");
  assert.equal(withAppearance("/security", "light"), "/security");
});
