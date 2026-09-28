import { useLayoutEffect } from "react";

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
]);

// Mount inside the page's Suspense boundary, after its lazy content exists.
// Native fragment scrolling can run before that content is in the document.
export function PublicFragmentNavigation() {
  useLayoutEffect(() => {
    function followFragment() {
      const { pathname, hash } = window.location;
      if (pathname === "/" && movedHomeSections[hash]) {
        window.location.replace(movedHomeSections[hash]);
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
