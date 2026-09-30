import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// Schriften lokal eingebunden (kein Google-CDN nötig – DSGVO-freundlich und offline-fähig).
import '@fontsource/bungee/latin-400.css';
import '@fontsource/bungee/latin-ext-400.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-500.css';
import '@fontsource/rubik/latin-700.css';
import '@fontsource/rubik/latin-900.css';
import '@fontsource/rubik/latin-ext-400.css';
import '@fontsource/rubik/latin-ext-700.css';
import './styles.css';

// Kein StrictMode: Er würde in der Entwicklung alle Effekte doppelt auslösen – und damit jeden Sound zweimal abspielen.
createRoot(document.getElementById('root')).render(<App />);
