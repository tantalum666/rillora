import { guideIdentifiers } from "./guideIdentifiers.js";

export function isGuideRequest(search = "", pathname = "") {
  const query = new URLSearchParams(search);
  const path = pathname.replace(/\/+$/, "");
  if (path === "/guides") return true;
  return (
    ["", "/account"].includes(path) &&
    (query.get("next") === "guides" ||
      query.get("view") === "guides" ||
      query.get("task") === "provider-guide")
  );
}

export function requestedGuideKey(search = "") {
  const query = new URLSearchParams(search);
  const candidate = query.get("service") || query.get("provider");
  return guideIdentifiers.includes(candidate) ? candidate : null;
}

export function guideWorkspacePath(search = "") {
  const key = requestedGuideKey(search);
  return key
    ? `/?view=guides&task=provider-guide&provider=${encodeURIComponent(key)}`
    : "/?view=guides";
}
