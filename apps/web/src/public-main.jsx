import { I18nProvider } from "./i18n/I18nProvider.jsx";
import { publicCatalogs } from "./i18n/publicCatalogs.js";
import { getBrowserLocaleStore } from "./i18n/localeStore.js";
import "./i18n/i18n.css";
import "./websiteAppearance.js";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PublicWebsite } from './PublicWebsite.jsx';
import './styles.css';
import './surface-motion.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/source-serif-4/latin-500.css';
import '@fontsource/source-serif-4/latin-600.css';
import '@fontsource/source-serif-4/latin-400.css';

getBrowserLocaleStore();

createRoot(document.getElementById('root')).render(<React.StrictMode><I18nProvider catalogs={publicCatalogs}><PublicWebsite /></I18nProvider></React.StrictMode>);
