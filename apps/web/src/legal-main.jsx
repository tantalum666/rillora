import React from "react";
import { createRoot } from "react-dom/client";
import { LegalPublicationApp } from "./LegalPublicationApp.jsx";
import { I18nStoreProvider } from "./i18n/I18nProvider.jsx";
import { createLocaleStore } from "./i18n/localeStore.js";
import "./styles.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/source-serif-4/latin-500.css";
import "@fontsource/source-serif-4/latin-600.css";

// Legal pages carry a display language in the URL and never read or write storage.
const legalLocaleStore = createLocaleStore({ getStorage: () => null,
  languages: navigator.languages?.length ? navigator.languages : [navigator.language],
  location: window.location, history: window.history, document: window.document });

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nStoreProvider store={legalLocaleStore}><LegalPublicationApp /></I18nStoreProvider>
  </React.StrictMode>,
);
