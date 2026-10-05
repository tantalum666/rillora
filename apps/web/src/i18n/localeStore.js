import { browserLocale, isSupportedLocale } from "./core.js";

export const LOCALE_STORAGE_KEY = "rillora.locale.v1";
const appOrigins = new Set(["https://app.staging.rillora.xyz", "https://app.rillora.xyz"]);

/** Carry only a supported display enum to the two already-authorized app origins. */
export function withLocale(href, locale) {
  if (!isSupportedLocale(locale)) return href;
  try {
    const url = new URL(href);
    if (!appOrigins.has(url.origin) || url.username || url.password) return href;
    url.searchParams.set("lang", locale);
    return url.href;
  } catch { return href; }
}

/** Injectable browser adapter keeps preference behavior testable without a DOM. */
export function createLocaleStore({ getStorage = () => null, languages = [], location, history, eventTarget, document } = {}) {
  let storage, persistenceAvailable = true, saved = null;
  try { storage = getStorage(); saved = storage?.getItem(LOCALE_STORAGE_KEY); persistenceAvailable = Boolean(storage); }
  catch { persistenceAvailable = false; }
  let preference = isSupportedLocale(saved) ? saved : null;
  let locale = preference ?? browserLocale(languages);
  try {
    const url = location?.href ? new URL(location.href) : null;
    const incoming = url?.searchParams.get("lang");
    if (isSupportedLocale(incoming)) {
      locale = incoming;
      preference = incoming;
      try { storage?.setItem(LOCALE_STORAGE_KEY, locale); } catch { persistenceAvailable = false; }
      // Preserve the route, all unrelated query values, invitation fragment, and history state.
      url.searchParams.delete("lang");
      history?.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch { /* An invalid URL or unavailable History API must not block the app. */ }
  const listeners = new Set();
  let snapshot = Object.freeze({ locale, persistenceAvailable, preference });
  const notify = () => {
    document?.documentElement?.setAttribute("lang", locale);
    snapshot = Object.freeze({ locale, persistenceAvailable, preference });
    listeners.forEach((listener) => listener());
  };
  document?.documentElement?.setAttribute("lang", locale);
  const onStorage = (event) => {
    if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return;
    if (event.storageArea && storage && event.storageArea !== storage) return;
    preference = isSupportedLocale(event.newValue) ? event.newValue : null;
    locale = preference ?? browserLocale(languages);
    notify();
  };
  eventTarget?.addEventListener("storage", onStorage);
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    setLocale: (nextLocale) => {
      if (!isSupportedLocale(nextLocale)) return false;
      locale = nextLocale;
      preference = nextLocale;
      try { storage?.setItem(LOCALE_STORAGE_KEY, locale); persistenceAvailable = Boolean(storage); }
      catch { persistenceAvailable = false; }
      notify();
      return true;
    },
    reset: () => {
      try { storage?.removeItem(LOCALE_STORAGE_KEY); } catch { persistenceAvailable = false; }
      preference = null;
      locale = browserLocale(languages); notify();
    },
    dispose: () => { eventTarget?.removeEventListener("storage", onStorage); listeners.clear(); },
  };
}

let browserStore;
export function getBrowserLocaleStore() {
  if (typeof window === "undefined") return createLocaleStore();
  browserStore ??= createLocaleStore({
    getStorage: () => window.localStorage,
    languages: window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language],
    location: window.location, history: window.history, eventTarget: window, document: window.document,
  });
  return browserStore;
}
