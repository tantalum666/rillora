import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createFormatters, createTranslator, mergeCatalogs } from "./core.js";
import { getBrowserLocaleStore } from "./localeStore.js";
import { errorMessage } from "./errors.js";
import * as common from "./messages/common.js";

const defaultCatalogs = mergeCatalogs(common);
const makeValue = (locale, catalogs, store, persistenceAvailable, localePreference = null) => {
  const t = createTranslator(locale, catalogs);
  return {
    locale, t, ...createFormatters(locale), persistenceAvailable, localePreference,
    setLocale: store?.setLocale ?? (() => false),
    errorMessage: (error, fallbackKey) => errorMessage(error, t, fallbackKey),
  };
};
// Legal-only publication has no provider: it remains English, without reading storage.
const I18nContext = createContext(makeValue("en", defaultCatalogs, null, false));

export function I18nProvider({ children, catalogs = defaultCatalogs, store = getBrowserLocaleStore(), locale: controlledLocale }) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const locale = controlledLocale ?? snapshot.locale;
  const value = useMemo(() => makeValue(locale, catalogs, store, snapshot.persistenceAvailable, snapshot.preference), [locale, catalogs, store, snapshot.persistenceAvailable, snapshot.preference]);
  useEffect(() => { if (typeof document !== "undefined") document.documentElement.lang = locale; }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
