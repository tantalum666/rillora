/** Public, locale-addressable pages only. Never add account or invitation routes. */
export const PUBLIC_ORIGIN = "https://www.rillora.xyz";
export const PUBLIC_LOCALES = ["en", "zh-CN"];
export const publicPages = {
  "/": { title: "public.seo.homeTitle", description: "public.seo.home" },
  "/product": { title: "public.title.product", description: "public.seo.product" },
  "/security": { title: "public.title.security", description: "public.seo.security" },
  "/pricing": { title: "public.title.pricing", description: "public.seo.pricing" },
  "/support": { title: "public.title.support", description: "public.seo.support" },
  "/legal": { title: "public.title.legal", description: "public.seo.legal" },
  "/legal/licenses": { title: "public.title.notices", description: "public.seo.notices" },
  "/learn": { title: "public.learn.title", description: "public.seo.learn" },
  "/learn/digital-legacy-checklist": { title: "public.learn.checklist.title", description: "public.learn.checklist.description" },
  "/learn/password-manager-and-digital-legacy": { title: "public.learn.passwords.title", description: "public.learn.passwords.description" },
};

export function publicRoute(pathname = "/") {
  const match = /^\/(en|zh-CN)(\/|$)/.exec(pathname);
  const locale = match?.[1] ?? null;
  const path = (locale ? pathname.slice(locale.length + 1) : pathname).replace(/\/+$/, "") || "/";
  return { path, locale };
}

export function publicPath(href, locale = "en") {
  // Only known same-site public paths receive a language prefix.
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//") || /[\\\u0000-\u001f]/.test(href)) return href;
  const url = new URL(href, PUBLIC_ORIGIN);
  const { path } = publicRoute(url.pathname);
  if (!Object.hasOwn(publicPages, path)) return href;
  const language = PUBLIC_LOCALES.includes(locale) ? locale : "en";
  url.searchParams.delete("lang");
  url.searchParams.delete("langHint");
  return `/${language}${path === "/" ? "/" : path}${url.search}${url.hash}`;
}

export function publicPageFile(path, locale) {
  if (!Object.hasOwn(publicPages, path) || !PUBLIC_LOCALES.includes(locale)) throw new Error("Unknown public page");
  return `pages/${locale}${path === "/" ? "/index" : path}.html`;
}
