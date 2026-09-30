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
  return state === firstUseStates.available || state === firstUseStates.guideInProgress;
}

export function guideActionLabel(plan) {
  const { state, step } = normalizeFirstUse(plan);
  return state === firstUseStates.guideInProgress || step > 0
    ? "Resume the guide"
    : "Optional guide";
}
