import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// Schriften lokal eingebunden (kein Google-CDN nötig – DSGVO-freundlich und offline-fähig).
import '@fontsource/bungee/400.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/900.css';
import './styles.css';

// Kein StrictMode: Er würde in der Entwicklung alle Effekte doppelt auslösen – und damit jeden Sound zweimal abspielen.
createRoot(document.getElementById('root')).render(<App />);
