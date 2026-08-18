import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Services from './components/Services.jsx';
import WhyUs from './components/WhyUs.jsx';
import Testimonials from './components/Testimonials.jsx';
import Gallery from './components/Gallery.jsx';
import Booking from './components/Booking.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import Chatbot from './components/Chatbot.jsx';
import MobileActionBar from './components/MobileActionBar.jsx';
import { useTheme } from './hooks.js';
import { COMPANY } from './data.js';

const PAGE_TITLE = `${COMPANY.name} München | ${COMPANY.slogan}`;
const PAGE_DESCRIPTION =
  'Johannes-Handwerk in München: Außenanlagen, Sanierung, Pflasterarbeiten und Instandsetzungen. Kostenloser Kostenvoranschlag innerhalb von 24h, Festpreisgarantie.';

// -----------------------------------------------------------------------
// SEO-Grundgerüst (Demo-Hinweis):
// In einer echten Produktions-Anwendung (SSR/Static-Export, z. B. Next.js
// oder vorgerenderte HTML-Datei) würden Title, Meta-Description und das
// strukturierte LocalBusiness-Schema bereits serverseitig im <head> der
// Seite ausgeliefert – wichtig für Suchmaschinen-Crawler, die kein
// JavaScript ausführen. Da dies hier eine reine Client-Side-React-Demo ist,
// setzen wir Title/Meta/JSON-LD zur Veranschaulichung per useEffect.
// Für den produktiven Einsatz sollte das gleiche LocalBusiness-Schema fest
// in index.html (oder serverseitig) eingebettet werden.
// -----------------------------------------------------------------------
const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: COMPANY.name,
  description: PAGE_DESCRIPTION,
  slogan: COMPANY.slogan,
  telephone: COMPANY.phone1,
  email: COMPANY.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.address.street,
    postalCode: COMPANY.address.zip,
    addressLocality: COMPANY.address.city,
    addressCountry: 'DE',
  },
  areaServed: COMPANY.serviceArea,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:30',
      closes: '18:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '4',
    // Platzhalter-Bewertung für die Demo – vor Live-Schaltung durch echte
    // Google-Bewertungen bzw. deren strukturierte Daten ersetzen.
  },
};

function useSeoTags() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;

    const metaDescription = ensureMetaTag('name', 'description');
    const previousDescription = metaDescription.getAttribute('content');
    metaDescription.setAttribute('content', PAGE_DESCRIPTION);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'jh-local-business-schema';
    script.text = JSON.stringify(LOCAL_BUSINESS_SCHEMA);
    document.head.appendChild(script);

    return () => {
      document.title = previousTitle;
      if (previousDescription === null) metaDescription.remove();
      else metaDescription.setAttribute('content', previousDescription);
      script.remove();
    };
  }, []);
}

function ensureMetaTag(attr, value) {
  let tag = document.head.querySelector(`meta[${attr}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, value);
    document.head.appendChild(tag);
  }
  return tag;
}

export default function JohannesHandwerk() {
  const [theme, setTheme] = useTheme();
  useSeoTags();

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div id="jh-root" className="scroll-smooth font-body">
      <div className="min-h-screen bg-sand-50 pb-14 text-ink-900 dark:bg-ink-950 dark:text-sand-50 sm:pb-0">
        <a
          href="#leistungen"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-clay-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Zum Inhalt springen
        </a>
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main>
          <Hero />
          <Services />
          <WhyUs />
          <Testimonials />
          <Gallery />
          <Booking />
          <Contact />
        </main>
        <Footer />
        <Chatbot />
        <MobileActionBar />
      </div>
    </div>
  );
}
