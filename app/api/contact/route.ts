import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.message !== "string" ||
    !body.name.trim() ||
    !body.message.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
  ) {
    return NextResponse.json(
      { error: "Bitte alle Felder gültig ausfüllen." },
      { status: 400 }
    );
  }

  // TODO: Produktiv an einen E-Mail-/CRM-Dienst anbinden (z. B. Resend, Postmark
  // oder ein CRM-Webhook). Aktuell wird die Anfrage nur serverseitig geloggt,
  // damit das Formular ohne zusätzliche Zugangsdaten deploy-fertig bleibt.
  console.log("Neue Kontaktanfrage:", {
    name: body.name,
    email: body.email,
    message: body.message,
  });

  return NextResponse.json({ ok: true });
}
