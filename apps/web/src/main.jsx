import { I18nProvider } from "./i18n/I18nProvider.jsx";
import { appCatalogs } from "./i18n/appCatalogs.js";
import { getBrowserLocaleStore } from "./i18n/localeStore.js";
import "./i18n/i18n.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./surface-motion.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/source-serif-4/500.css";
import "@fontsource/source-serif-4/600.css";

getBrowserLocaleStore();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider catalogs={appCatalogs}><App /></I18nProvider>
  </React.StrictMode>,
);
