import assert from "node:assert/strict";
import test from "node:test";
import {
  guideActionLabel,
  normalizeFirstUse,
  shouldShowFirstUsePanel,
} from "../src/firstUse.js";

test("first-use state fails safely to an available non-blocking overview", () => {
  assert.deepEqual(normalizeFirstUse(null), { state: "available", step: 0 });
  assert.deepEqual(normalizeFirstUse({ firstUseState: "unknown", firstUseStep: 99 }), {
    state: "available",
    step: 2,
  });
  assert.equal(shouldShowFirstUsePanel({ firstUseState: "available", firstUseStep: 0 }), true);
});

test("paused guides stay recoverable and completed guides stay dismissed", () => {
  assert.equal(shouldShowFirstUsePanel({ firstUseState: "guide_paused", firstUseStep: 1 }), true);
  assert.equal(shouldShowFirstUsePanel({ firstUseState: "completed", firstUseStep: 2 }), false);
});

test("resume copy follows saved progress without changing readiness", () => {
  assert.equal(guideActionLabel({ firstUseState: "guide_paused", firstUseStep: 0 }), "Resume the guide");
  assert.equal(guideActionLabel({ firstUseState: "available", firstUseStep: 0 }), "Optional guide");
  assert.equal(guideActionLabel({ firstUseState: "guide_in_progress", firstUseStep: 2 }), "Resume the guide");
});
