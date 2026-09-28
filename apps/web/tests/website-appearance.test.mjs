import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
const source = await readFile(
  new URL("../src/websiteAppearance.js", import.meta.url),
  "utf8",
);
const key = "rillora.website.appearance.v1";
function browser({ saved = null, dark = false, blocked = false } = {}) {
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
  runInNewContext(source, { window, document });
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
