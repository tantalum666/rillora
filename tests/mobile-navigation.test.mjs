import assert from "node:assert/strict";
import test from "node:test";
import {
  isMobilePrimaryActive,
  mobileMoreDestinationDefinitions,
  mobilePrimaryNavigation,
} from "../src/mobileNavigation.js";

test("mobile keeps three primary destinations", () => {
  assert.deepEqual(
    mobilePrimaryNavigation.map(({ id }) => id),
    ["overview", "matters", "more"],
  );
});

test("desktop-only destinations remain reachable through More", () => {
  assert.deepEqual(
    mobileMoreDestinationDefinitions.map(({ id }) => id),
    ["access", "plan", "contacts", "guides", "activity", "settings"],
  );

  for (const { id } of mobileMoreDestinationDefinitions) {
    assert.equal(isMobilePrimaryActive("more", id), true);
  }
  assert.equal(isMobilePrimaryActive("more", "more"), true);
  assert.equal(isMobilePrimaryActive("more", "matters"), false);
});
