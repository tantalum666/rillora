import { createTranslator } from "./i18n/core.js";
import { en, zhCN } from "./i18n/messages/forms.js";

const english = createTranslator("en", { en, "zh-CN": zhCN });

export const firstUseStates = Object.freeze({
  available: "available",
  guideInProgress: "guide_in_progress",
  guidePaused: "guide_paused",
  completed: "completed",
});

export function normalizeFirstUse(plan) {
  const state = Object.values(firstUseStates).includes(plan?.firstUseState)
    ? plan.firstUseState
    : firstUseStates.available;
  const rawStep = Number.isInteger(plan?.firstUseStep) ? plan.firstUseStep : 0;
  return { state, step: Math.min(2, Math.max(0, rawStep)) };
}

export function shouldShowFirstUsePanel(plan) {
  const { state } = normalizeFirstUse(plan);
  return state !== firstUseStates.completed;
}

export function guideActionLabel(plan, t = english) {
  const { state, step } = normalizeFirstUse(plan);
  return state === firstUseStates.guideInProgress || state === firstUseStates.guidePaused || step > 0
    ? t("forms.firstUse.resume")
    : t("forms.firstUse.optionalGuide");
}
