import { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, User, Loader2, ArrowRight } from 'lucide-react';
import { getBotAnswer } from '../chatbot-engine.js';
import { BOT_QUICK_REPLIES, COMPANY } from '../data.js';

const GREETING = {
  role: 'bot',
  text: `Servus! 👋 Ich bin der Assistent von ${COMPANY.name}. Fragen Sie mich gerne zu Leistungen, Einsatzgebiet oder wie ein Kostenvoranschlag abläuft.`,
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, open]);

  // Escape-Taste schließt den Chat (Tastaturbedienbarkeit)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setInput('');
    setThinking(true);
    const { text: answer, suggestContact } = await getBotAnswer(trimmed);
    setMessages((m) => [...m, { role: 'bot', text: answer, suggestContact }]);
    setThinking(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const scrollToContact = () => {
    setOpen(false);
    document.querySelector('#kontakt')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Chat mit Johannes-Handwerk"
          className="flex h-[min(28rem,70vh)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-ink-800/10 bg-white shadow-soft dark:border-sand-100/10 dark:bg-ink-900"
        >
          <div className="flex items-center gap-3 bg-ink-900 px-4 py-3.5 text-sand-50 dark:bg-ink-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-500">
              <Bot size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{COMPANY.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-sand-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-400" /> antwortet meist sofort
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chat schließen"
              className="flex h-8 w-8 items-center justify-center rounded-full text-sand-200 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sand-50 px-4 py-4 dark:bg-ink-950">
            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} onGoToContact={scrollToContact} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2 text-xs text-ink-400 dark:text-ink-200">
                <Loader2 size={14} className="animate-spin" /> tippt…
              </div>
            )}

            {messages.length <= 1 && !thinking && (
              <div className="flex flex-wrap gap-2 pt-1">
                {BOT_QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-clay-500/30 bg-clay-500/10 px-3 py-1.5 text-xs font-medium text-clay-700 transition-colors hover:bg-clay-500/20 dark:text-clay-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-800/10 bg-white p-3 dark:border-sand-100/10 dark:bg-ink-900">
            <label htmlFor="jh-chat-input" className="sr-only">
              Ihre Nachricht an Johannes-Handwerk
            </label>
            <input
              id="jh-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ihre Frage eingeben…"
              className="flex-1 rounded-full border border-ink-800/10 bg-sand-50 px-4 py-2 text-sm text-ink-900 outline-none focus:border-clay-500 dark:border-sand-100/10 dark:bg-ink-950 dark:text-sand-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Nachricht senden"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-500 text-white transition-opacity disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Chat schließen' : 'Chat öffnen'}
        aria-expanded={open}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-clay-500 text-white shadow-soft transition-transform hover:scale-105 active:scale-95 ${
          open ? '' : 'animate-pulse-soft'
        }`}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>
    </div>
  );
}

function ChatBubble({ message, onGoToContact }) {
  const isBot = message.role === 'bot';
  return (
    <div className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isBot ? 'bg-clay-500/15 text-clay-600 dark:text-clay-300' : 'bg-ink-800/10 text-ink-600 dark:bg-sand-100/10 dark:text-sand-100'
        }`}
      >
        {isBot ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isBot
              ? 'bg-white text-ink-800 dark:bg-ink-800 dark:text-sand-50'
              : 'bg-clay-500 text-white'
          }`}
        >
          {message.text}
        </div>
        {isBot && message.suggestContact && (
          <button
            onClick={onGoToContact}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-clay-600 dark:text-clay-300"
          >
            Zum Kontaktformular <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
