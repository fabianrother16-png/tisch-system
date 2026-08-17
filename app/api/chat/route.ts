import { NextRequest, NextResponse } from "next/server";
import { getRuleBasedReply } from "@/lib/chatResponses";

// ---------------------------------------------------------------------------
// API-Route für das Chat-Widget
// ---------------------------------------------------------------------------
// Beantwortet Nachrichten aktuell regelbasiert (siehe lib/chatResponses.ts).
// Um eine echte KI-Anbindung zu ergänzen, z.B. die Anthropic API:
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//   const response = await anthropic.messages.create({
//     model: "claude-sonnet-5",
//     max_tokens: 400,
//     system: "Du bist der Chat-Assistent von Fliesen Khalil ...",
//     messages: [{ role: "user", content: message }],
//   });
//
// Den API-Key als Umgebungsvariable in Vercel hinterlegen und die Funktion
// `getRuleBasedReply()` unten gegen den Modellaufruf austauschen – die
// Client-Komponente (components/ChatWidget.tsx) muss dafür nicht angepasst
// werden, solange die Route weiterhin { reply: string } zurückgibt.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: { message?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const message = (body.message ?? "").toString().slice(0, 1000); // einfache Längenbegrenzung

  if (!message.trim()) {
    return NextResponse.json({ reply: "Wie kann ich Ihnen helfen?" });
  }

  const reply = getRuleBasedReply(message);

  return NextResponse.json({ reply });
}
