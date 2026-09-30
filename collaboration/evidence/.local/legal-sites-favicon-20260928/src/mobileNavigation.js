export const mobilePrimaryNavigation = Object.freeze([
  Object.freeze({ id: "overview", label: "Overview" }),
  Object.freeze({ id: "matters", label: "Matters" }),
  Object.freeze({ id: "more", label: "More" }),
]);

export const mobileMoreDestinationDefinitions = Object.freeze([
  Object.freeze({ id: "access", label: "Plan & access", detail: "Current access and future Family capabilities" }),
  Object.freeze({ id: "plan", label: "My plan", detail: "Progress, roles and Start Here" }),
  Object.freeze({ id: "contacts", label: "Trusted contacts", detail: "People, roles and invitation evidence" }),
  Object.freeze({ id: "shared", label: "Shared with me", detail: "Read-only items from people you know" }),
  Object.freeze({ id: "maintenance", label: "Shared reviews", detail: "Check directions and review suggested updates" }),
  Object.freeze({ id: "guides", label: "Account inheritance", detail: "Preparation & after-death guidance" }),
  Object.freeze({ id: "activity", label: "Activity", detail: "Your private plan history" }),
  Object.freeze({ id: "settings", label: "Settings", detail: "Preferences, setup and account sessions" }),
]);

const moreRouteIds = new Set([
  "more",
  ...mobileMoreDestinationDefinitions.map(({ id }) => id),
]);

export function isMobilePrimaryActive(primaryId, activeRouteId) {
  if (primaryId === "more") return moreRouteIds.has(activeRouteId);
  return primaryId === activeRouteId;
}
