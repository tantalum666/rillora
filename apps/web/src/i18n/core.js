/** Locale is a display preference only. Never use it for markets or permissions. */
export const SUPPORTED_LOCALES = Object.freeze(["en", "zh-CN"]);
export const DEFAULT_LOCALE = "en";
export const isSupportedLocale = (value) => SUPPORTED_LOCALES.includes(value);

export function browserLocale(languages = []) {
  for (const language of languages) {
    if (typeof language !== "string") continue;
    if (/^zh(?:-|$)/i.test(language)) return "zh-CN";
    if (/^en(?:-|$)/i.test(language)) return "en";
  }
  return DEFAULT_LOCALE;
}

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const placeholder = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

/** Pure, dependency-free lookup; React escapes the returned text at the view boundary. */
export function createTranslator(requestedLocale, catalogs) {
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : DEFAULT_LOCALE;
  const number = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const englishPlural = new Intl.PluralRules(DEFAULT_LOCALE);
  return function t(key, params = {}) {
    const localized = catalogs[locale] ?? {};
    const english = catalogs.en ?? {};
    const localizedMessage = hasOwn(localized, key);
    let message = localizedMessage ? localized[key] : hasOwn(english, key) ? english[key] : undefined;
    if (message === undefined) return key;
    if (typeof message === "object" && message !== null) {
      const rules = localizedMessage ? plural : englishPlural;
      const category = Number.isFinite(params.count) ? rules.select(params.count) : "other";
      message = message[category] ?? message.other;
    }
    if (typeof message !== "string") return key;
    return message.replace(placeholder, (token, name) => {
      if (!hasOwn(params, name)) return token;
      const value = params[name];
      return typeof value === "number" && Number.isFinite(value) ? number.format(value) : String(value ?? "");
    });
  };
}

export function createFormatters(locale = DEFAULT_LOCALE) {
  const resolved = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  return {
    formatNumber: (value, options = {}) => new Intl.NumberFormat(resolved, options).format(value),
    formatDate: (value, options = { dateStyle: "medium" }) => {
      if (value === null || value === undefined || value === "") return "—";
      const date = value instanceof Date ? value : new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat(resolved, options).format(date);
    },
    formatMoney: (amountMinor, currencyCode = "USD", minorUnitExponent = 2) => {
      if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new TypeError("Invalid minor-unit amount");
      if (!Number.isInteger(minorUnitExponent) || minorUnitExponent < 0 || minorUnitExponent > 3) throw new TypeError("Invalid minor-unit exponent");
      return new Intl.NumberFormat(resolved, {
        style: "currency", currency: currencyCode, currencyDisplay: "code",
        minimumFractionDigits: minorUnitExponent, maximumFractionDigits: minorUnitExponent,
      }).format(amountMinor / (10 ** minorUnitExponent));
    },
  };
}

/** Catalog checks run in Node tests, not while displaying private data. */
export function validateCatalogs(catalogs) {
  const errors = [];
  const english = catalogs.en ?? {};
  const keys = Object.keys(english).sort();
  const variables = (message) => {
    const forms = typeof message === "string" ? [message] : Object.values(message ?? {});
    return [...new Set(forms.flatMap((form) => typeof form === "string" ? [...form.matchAll(placeholder)].map((match) => match[1]) : []))].sort().join(",");
  };
  for (const locale of SUPPORTED_LOCALES) {
    const catalog = catalogs[locale] ?? {};
    for (const key of keys) {
      const value = catalog[key];
      if (!hasOwn(catalog, key)) { errors.push(`${locale}: missing ${key}`); continue; }
      if (typeof value !== "string" && (!value || typeof value !== "object" || typeof value.other !== "string")) {
        errors.push(`${locale}: invalid message ${key}`); continue;
      }
      const forms = typeof value === "string" ? [value] : Object.values(value);
      if (forms.some((form) => typeof form !== "string" || !form.trim())) errors.push(`${locale}: empty message ${key}`);
      if (variables(value) !== variables(english[key])) errors.push(`${locale}: placeholder mismatch ${key}`);
    }
    for (const key of Object.keys(catalog)) if (!hasOwn(english, key)) errors.push(`${locale}: unknown ${key}`);
  }
  return errors;
}

export function mergeCatalogs(...namespaces) {
  const catalogs = { en: {}, "zh-CN": {} };
  for (const namespace of namespaces) {
    for (const locale of SUPPORTED_LOCALES) {
      const messages = locale === "en" ? namespace.en : namespace.zhCN;
      for (const [key, value] of Object.entries(messages ?? {})) {
        if (hasOwn(catalogs[locale], key)) throw new Error(`Duplicate translation key: ${key}`);
        catalogs[locale][key] = value;
      }
    }
  }
  return catalogs;
}
