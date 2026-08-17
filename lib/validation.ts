// ---------------------------------------------------------------------------
// Validierung des Kontaktformulars
// ---------------------------------------------------------------------------
// Wird sowohl im Client (components/ContactForm.tsx) als auch in der API-Route
// (app/api/contact/route.ts) verwendet, damit Client- und Server-Validierung
// garantiert übereinstimmen.
// ---------------------------------------------------------------------------

export interface ContactFormData {
  name: string;
  zipCity: string; // PLZ / Ort, z.B. "44369 Dortmund"
  email: string;
  phone: string;
  message: string;
  // Honeypot-Feld gegen einfache Spam-Bots. Bleibt für Menschen unsichtbar
  // und muss leer bleiben, damit die Anfrage als gültig gilt.
  website?: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Deutsche Telefonnummern: optional führendes +, Ziffern, Leerzeichen, Klammern, Bindestriche
const PHONE_REGEX = /^[+0][0-9\s()/-]{5,20}$/;
// PLZ (5-stellig) gefolgt von einem Ortsnamen, z.B. "44369 Dortmund"
const ZIP_CITY_REGEX = /^\d{5}\s+.{2,}$/;

export function validateContactForm(data: ContactFormData): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "Bitte geben Sie Ihren vollständigen Namen ein.";
  }

  if (!data.zipCity || !ZIP_CITY_REGEX.test(data.zipCity.trim())) {
    errors.zipCity = "Bitte im Format „PLZ Ort“ angeben, z. B. 44369 Dortmund.";
  }

  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }

  if (!data.phone || !PHONE_REGEX.test(data.phone.trim())) {
    errors.phone = "Bitte geben Sie eine gültige Telefonnummer ein.";
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = "Bitte beschreiben Sie Ihr Anliegen in mindestens 10 Zeichen.";
  }

  if (data.website && data.website.trim().length > 0) {
    // Honeypot wurde ausgefüllt -> vermutlich ein Bot
    errors.website = "Ungültige Übermittlung.";
  }

  return errors;
}

export function isContactFormValid(errors: ContactFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
