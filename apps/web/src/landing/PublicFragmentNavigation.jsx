import { useLayoutEffect } from "react";
import { publicPath, publicRoute } from "../publicSeo.js";

const movedHomeSections = {
  "#how-it-works": "/product#how-it-works",
  "#your-control": "/security#your-control",
  "#plans": "/pricing",
  "#guidance": "/guides",
};
const sectionIds = new Set([
  "people",
  "sharing",
  "how-it-works",
  "your-control",
  "lp-main",
  "appearance",
]);

// Mount after the selected page module is loaded. Old bookmarks keep their locale.
export function PublicFragmentNavigation() {
  useLayoutEffect(() => {
    function followFragment() {
      const { pathname, hash } = window.location;
      const { path, locale } = publicRoute(pathname);
      if (path === "/" && movedHomeSections[hash]) {
        const target = movedHomeSections[hash];
        window.location.replace(target === "/guides" && locale ? `${target}?lang=${locale}` : publicPath(target, locale));
        return;
      }
      const id = hash.slice(1);
      if (!sectionIds.has(id)) return;
      const target = document.getElementById(id);
      target?.scrollIntoView({ block: "start", behavior: "auto" });
      target?.focus({ preventScroll: true });
    }
    followFragment();
    window.addEventListener("hashchange", followFragment);
    return () => window.removeEventListener("hashchange", followFragment);
  }, []);
  return null;
}
