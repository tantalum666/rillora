import React from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { I18nStoreProvider } from "./i18n/I18nProvider.jsx";
import { publicCatalogs } from "./i18n/publicCatalogs.js";
import { staticPublicLocaleStore } from "./publicLocale.js";
import { PublicWebsite, loadPublicPage } from "./PublicWebsite.jsx";
import { publicPath } from "./publicSeo.js";

// Build-time only: wait for all lazy sections so the saved page has real content.
export async function renderPublicPage(path, locale) {
  const errors = [];
  const Page = await loadPublicPage(path);
  const { prelude, postponed } = await prerenderToNodeStream(
    <React.StrictMode><I18nStoreProvider catalogs={publicCatalogs} store={staticPublicLocaleStore(locale)}>
      <PublicWebsite Page={Page} pathname={publicPath(path, locale)} search="" />
    </I18nStoreProvider></React.StrictMode>,
    { signal: AbortSignal.timeout(15000), onError(error) { errors.push(error); } },
  );
  const chunks = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  if (postponed || errors.length) throw new AggregateError(errors, "Public page could not be fully prerendered");
  return Buffer.concat(chunks).toString("utf8");
}
