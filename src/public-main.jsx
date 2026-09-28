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

createRoot(document.getElementById('root')).render(<React.StrictMode><PublicWebsite /></React.StrictMode>);
