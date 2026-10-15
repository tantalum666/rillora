import { getBrowserLocaleStore } from "./i18n/localeStore.js";
import { publicPages, publicPath, publicRoute } from "./publicSeo.js";

export function staticPublicLocaleStore(locale) {
  const snapshot = Object.freeze({ locale, preference: null, persistenceAvailable: true });
  return { getSnapshot: () => snapshot, subscribe: () => () => {} };
}

/** URL locale wins on public pages; App locale/session behavior stays independent. */
export function publicLocaleStore() {
  const route = publicRoute(window.location.pathname);
  const browser = getBrowserLocaleStore();
  const server = staticPublicLocaleStore(route.locale ?? "en");
  let prior, snapshot;
  const getSnapshot = () => {
    const state = browser.getSnapshot();
    if (state !== prior) {
      prior = state;
      const locale = route.locale ?? "en";
      snapshot = Object.freeze({ locale, persistenceAvailable: state.persistenceAvailable,
        preference: state.preference === locale ? locale : null });
    }
    return snapshot;
  };
  const navigate = (locale) => window.location.assign(publicPath(`${route.path}${window.location.search}${window.location.hash}`, locale));
  return {
    getSnapshot,
    getServerSnapshot: server.getSnapshot,
    subscribe: browser.subscribe,
    setLocale(locale) { if (browser.setLocale(locale)) navigate(locale); },
    // Only old unprefixed bookmarks use the existing saved/browser preference.
    canonicalize() {
      if (route.locale || !Object.hasOwn(publicPages, route.path)) return false;
      window.location.replace(publicPath(`${route.path}${window.location.search}${window.location.hash}`, browser.getSnapshot().locale));
      return true;
    },
  };
}
