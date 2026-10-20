import { browserLocale, isSupportedLocale } from "./core.js";

export const LOCALE_STORAGE_KEY = "rillora.locale.v1";
const appOrigins = new Set(["https://app.staging.rillora.xyz", "https://app.rillora.xyz"]);

/** Carry only a supported display enum to the two already-authorized app origins. */
export function withLocale(href, locale, fallbackLocale) {
  if (!isSupportedLocale(locale) && !isSupportedLocale(fallbackLocale)) return href;
  try {
    const url = new URL(href);
    if (!appOrigins.has(url.origin) || url.username || url.password) return href;
    url.searchParams.set(isSupportedLocale(locale) ? "lang" : "langHint", isSupportedLocale(locale) ? locale : fallbackLocale);
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
  const updateURL = () => {
    if (!location?.href) return;
    try {
      const url = new URL(location.href);
      if (preference && !persistenceAvailable) url.searchParams.set("lang", preference);
      else url.searchParams.delete("lang");
      if (preference) url.searchParams.delete("langHint");
      history?.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    } catch { /* Display choice still works if the History API is unavailable. */ }
  };
  try {
    const url = location?.href ? new URL(location.href) : null;
    const incoming = url?.searchParams.get("lang");
    if (isSupportedLocale(incoming)) {
      locale = incoming;
      preference = incoming;
      try { storage?.setItem(LOCALE_STORAGE_KEY, locale); persistenceAvailable = Boolean(storage); } catch { persistenceAvailable = false; }
      // Preserve the route, all unrelated query values, invitation fragment, and history state.
      updateURL();
    } else if (!preference && isSupportedLocale(url?.searchParams.get("langHint"))) {
      // A website's inferred language must never replace an explicit App preference.
      locale = url.searchParams.get("langHint");
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
      updateURL();
      notify();
      return true;
    },
    reset: () => {
      try { storage?.removeItem(LOCALE_STORAGE_KEY); } catch { persistenceAvailable = false; }
      preference = null;
      try {
        const url = new URL(location.href); url.searchParams.delete("lang"); url.searchParams.delete("langHint");
        history?.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
      } catch { /* Reset remains available without a browser URL. */ }
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

/** Preserve display language through a full-page sign-in return, never an external URL. */
export function withLocalePath(path, locale, preference = null) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) return path;
  if (!isSupportedLocale(locale)) return path;
  const url = new URL(path, "https://rillora.invalid");
  url.searchParams.delete("lang"); url.searchParams.delete("langHint");
  url.searchParams.set(isSupportedLocale(preference) ? "lang" : "langHint", locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Keep transient URL preferences while the workspace rewrites its navigation query. */
export function preserveTransientLocale(path) {
  if (typeof window === "undefined") return path;
  const snapshot = getBrowserLocaleStore().getSnapshot();
  const hint = new URLSearchParams(window.location.search).get("langHint");
  return !snapshot.persistenceAvailable || (!snapshot.preference && isSupportedLocale(hint))
    ? withLocalePath(path, snapshot.locale, snapshot.preference) : path;
}
