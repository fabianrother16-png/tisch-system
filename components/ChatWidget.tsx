"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { company } from "@/lib/content";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text: `Hallo! Ich bin der Chat-Assistent von ${company.name}. Fragen Sie mich gerne zu Preisen, Referenzen oder Terminen.`,
  },
];

const quickReplies = ["Was kostet ein Bad?", "Referenzen ansehen", "Termin anfragen"];

// ---------------------------------------------------------------------------
// Chat-Widget – aktuell an /api/chat angebunden, das regelbasiert antwortet
// (siehe lib/chatResponses.ts). Die API-Route lässt sich später 1:1 gegen
// eine echte KI-Anbindung austauschen, ohne dass sich an dieser Komponente
// etwas ändern muss.
// ---------------------------------------------------------------------------
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply ?? "Entschuldigung, da ist etwas schiefgelaufen.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Entschuldigung, der Chat ist gerade nicht erreichbar. Rufen Sie uns gerne direkt an: ${company.phone}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl2 border border-charcoal/10 bg-white shadow-soft">
          <div className="flex items-center justify-between bg-slate-700 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-white">{company.name}</p>
              <p className="text-xs text-slate-300">Antwortet meist sofort</p>
            </div>
            <button
              type="button"
              aria-label="Chat schließen"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sand-50 px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-white text-charcoal shadow-sm"
                    : "ml-auto bg-terracotta-500 text-white"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="flex w-fit items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2.5 text-slate-400 shadow-sm">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">tippt …</span>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-charcoal/5 bg-white px-3 py-2.5">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-charcoal/10 px-3 py-1.5 text-xs text-charcoal-light hover:bg-sand-100"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-charcoal/10 bg-white p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ihre Nachricht …"
              className="flex-1 rounded-full border border-charcoal/15 bg-sand-50 px-4 py-2.5 text-sm outline-none focus:border-terracotta-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Nachricht senden"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-500 text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chat schließen" : "Chat öffnen"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-500 text-white shadow-soft transition-transform hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
