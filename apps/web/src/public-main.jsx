import { I18nStoreProvider } from "./i18n/I18nProvider.jsx";
import { publicCatalogs } from "./i18n/publicCatalogs.js";
import { publicLocaleStore } from "./publicLocale.js";
import "./i18n/i18n.css";
import "./websiteAppearance.js";
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { PublicWebsite, loadPublicPage } from './PublicWebsite.jsx';
import { publicRoute } from "./publicSeo.js";
import './styles.css';
import './surface-motion.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/source-serif-4/latin-500.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/source-serif-4/latin-400.css';

async function start() {
  const store = publicLocaleStore();
  if (store.canonicalize()) return;
  const Page = await loadPublicPage(publicRoute(window.location.pathname).path);
  const root = document.getElementById('root');
  const app = <React.StrictMode><I18nStoreProvider catalogs={publicCatalogs} store={store}><PublicWebsite Page={Page} /></I18nStoreProvider></React.StrictMode>;
  if (root.dataset.prerendered === "true") hydrateRoot(root, app);
  else createRoot(root).render(app);
}
void start();
