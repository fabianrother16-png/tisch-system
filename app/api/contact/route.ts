import { NextRequest, NextResponse } from "next/server";
import { validateContactForm, isContactFormValid, type ContactFormData } from "@/lib/validation";
import { company } from "@/lib/content";

// ---------------------------------------------------------------------------
// API-Route für das Kontaktformular
// ---------------------------------------------------------------------------
// Aktuell wird die Anfrage lediglich validiert und geloggt. Um echte E-Mails
// zu versenden, hier einen E-Mail-Dienst einbinden, z.B.:
//
//   - Resend (https://resend.com):
//       import { Resend } from "resend";
//       const resend = new Resend(process.env.RESEND_API_KEY);
//       await resend.emails.send({
//         from: "Fliesen Khalil Website <noreply@fliesen-khalil.de>",
//         to: company.email,
//         subject: `Neue Anfrage von ${data.name}`,
//         text: `...`,
//       });
//
//   - Nodemailer + SMTP-Postfach
//   - SendGrid / Mailgun / Postmark
//
// Benötigte API-Keys als Umgebungsvariablen in Vercel hinterlegen
// (Project Settings -> Environment Variables) und hier über process.env
// auslesen. Bis dahin dient diese Route als funktionsfähiger Platzhalter.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let data: ContactFormData;

  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const errors = validateContactForm(data);
  if (!isContactFormValid(errors)) {
    return NextResponse.json({ error: "Validierung fehlgeschlagen.", errors }, { status: 422 });
  }

  // Honeypot ausgefüllt -> stiller Erfolg vortäuschen, ohne die Nachricht zu verarbeiten
  if (data.website && data.website.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  // TODO: Hier E-Mail-Versand an company.email einbinden (siehe Kommentar oben).
  console.log(`[Kontaktanfrage] Neue Nachricht für ${company.email}:`, {
    name: data.name,
    zipCity: data.zipCity,
    email: data.email,
    phone: data.phone,
    message: data.message,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
