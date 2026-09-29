import { useEffect, useRef, useState } from 'react';
import { act, onFx } from '../lib/net.js';
import { play } from '../lib/sound.js';
import { useCountUp, useNow } from '../lib/hooks.js';
import { money, useT } from '../lib/i18n.js';
import { Avatar } from '../components/Avatar.jsx';
import { MascheCard, PersonaCard, VoiceCard } from '../components/Cards.jsx';
import { Timer } from '../components/Timer.jsx';
import { ReactionBar } from '../components/Reactions.jsx';

const SOUNDBOARD = [
  { id: 'airhorn', emoji: '📯' },
  { id: 'kaching', emoji: '💰' },
  { id: 'typing', emoji: '⌨️' },
  { id: 'modem', emoji: '📠' },
  { id: 'drumroll', emoji: '🥁' },
  { id: 'sad', emoji: '🎺' },
  { id: 'ding', emoji: '🔔' },
  { id: 'buzzer', emoji: '❌' },
  { id: 'boing', emoji: '🌀' },
];

const TRUST_LEVELS = [
  { max: 15, key: 'ice', emoji: '🧊' },
  { max: 35, key: 'skeptic', emoji: '🤨' },
  { max: 60, key: 'undecided', emoji: '😐' },
  { max: 85, key: 'convinced', emoji: '🙂' },
  { max: 101, key: 'love', emoji: '😍' },
];

function trustLevel(v) {
  return TRUST_LEVELS.find((l) => v < l.max) || TRUST_LEVELS[2];
}

// Vertrauen kommt live per Effekt-Event (ohne kompletten State-Refresh).
function useLiveTrust(callKey, initial) {
  const [trust, setTrust] = useState(initial);
  useEffect(() => setTrust(initial), [callKey, initial]);
  useEffect(() => onFx((fx) => fx.type === 'trust' && setTrust(fx.value)), []);
  return [trust, setTrust];
}

export function TrustMeter({ value }) {
  const t = useT();
  const lvl = trustLevel(value);
  return (
    <div className="trust">
      <div className="trust-head">
        <span>{t('call.trustMeter')}</span>
        <span className="trust-state">
          {lvl.emoji} {t(`call.trust.${lvl.key}`)}
        </span>
      </div>
      <div className="trust-track">
        <div className="trust-fill" style={{ width: `${value}%` }} />
        <div className="trust-needle" style={{ left: `${value}%` }}>
          {lvl.emoji}
        </div>
      </div>
    </div>
  );
}

function Soundboard() {
  const t = useT();
  return (
    <div className="soundboard">
      {SOUNDBOARD.map((s) => (
        <button key={s.id} type="button" className="sound-btn" onClick={() => act('sound', { id: s.id })} title={t(`sound.${s.id}`)}>
          <span>{s.emoji}</span>
          <small>{t(`sound.${s.id}`)}</small>
        </button>
      ))}
    </div>
  );
}

function VictimControls({ view, call, trust, setTrust }) {
  const t = useT();
  const g = view.game;
  const now = useNow(250);
  const sendTimer = useRef(null);
  const lastSent = useRef(0);
  const holdActive = call.holdUntil && call.holdUntil > now;
  const hangupIn = Math.max(0, Math.ceil((call.hangupFrom - now) / 1000));
  const ringing = view.phase === 'ring';

  const changeTrust = (v) => {
    const value = Math.max(0, Math.min(100, v));
    setTrust(value);
    // Gedrosselt senden, damit alle die Nadel schon beim Ziehen wackeln sehen.
    clearTimeout(sendTimer.current);
    const wait = 120 - (Date.now() - lastSent.current);
    const send = () => {
      lastSent.current = Date.now();
      act('trust', { value });
    };
    if (wait <= 0) send();
    else sendTimer.current = setTimeout(send, wait);
  };

  return (
    <div className="panel controls victim-controls">
      <div className="controls-title">📱 {t('call.yourPhone')}</div>
      <div className="trust-control">
        <button type="button" className="btn btn-sq" onClick={() => changeTrust(trust - 15)} disabled={ringing} aria-label={t('call.lessTrust')}>
          👎
        </button>
        <input type="range" min="0" max="100" value={trust} disabled={ringing} onChange={(e) => changeTrust(Number(e.target.value))} aria-label={t('call.trustMeter')} />
        <button type="button" className="btn btn-sq" onClick={() => changeTrust(trust + 15)} disabled={ringing} aria-label={t('call.moreTrust')}>
          👍
        </button>
      </div>

      <div className="transfer">
        <div className="transfer-head">
          <span>💸 {t('call.transfer')}</span>
          <span className="transfer-balance">{t('call.balance', { amount: money(g.budgetLeft) })}</span>
        </div>
        <div className="chips">
          {view.chips.map((c) => (
            <button key={c} type="button" className="chip" disabled={ringing || g.budgetLeft <= 0} onClick={() => act('transfer', { amount: c })}>
              +{money(c)}
            </button>
          ))}
          <button
            type="button"
            className="chip chip-all"
            disabled={ringing || g.budgetLeft <= 0}
            onClick={() => window.confirm(t('call.confirmAll', { amount: money(g.budgetLeft) })) && act('transfer', { amount: 'all' })}
          >
            {t('call.all')}
          </button>
        </div>
      </div>

      <div className="victim-buttons">
        <button type="button" className="btn btn-purple" disabled={ringing || call.holdUsed} onClick={() => act('hold')}>
          🎵 {holdActive ? t('call.holdActive') : call.holdUsed ? t('call.holdUsed') : t('call.hold')}
        </button>
        <button type="button" className="btn btn-hangup" disabled={ringing || hangupIn > 0} onClick={() => act('hangup')}>
          📵 {hangupIn > 0 && !ringing ? t('call.hangupIn', { n: hangupIn }) : t('call.hangup')}
        </button>
      </div>
      <details className="soundboard-wrap">
        <summary>🎛️ {t('call.soundboard')}</summary>
        <Soundboard />
      </details>
    </div>
  );
}

function CallerControls({ view, call }) {
  const t = useT();
  const card = view.game.myCard;
  return (
    <div className="panel controls caller-controls">
      <div className="controls-title">{card.isCop ? `🚔 ${t('call.yourTurnCop')}` : `😈 ${t('call.yourTurn')}`}</div>
      {card.isCop && <div className="cop-rule">🚫 {t('call.copForbidden')}</div>}
      <MascheCard masche={card.masche} />
      <button type="button" className="btn btn-yellow" disabled={call.proofSent || view.phase === 'ring'} onClick={() => act('proof')}>
        📎 {call.proofSent ? t('call.proofSent') : t('call.sendProof', { title: card.masche.proof.title })}
      </button>
      <details className="soundboard-wrap" open={view.settings.callMode !== 'chat'}>
        <summary>🎛️ {t('call.soundboard')}</summary>
        <Soundboard />
      </details>
    </div>
  );
}

function SpectatorPanel({ view }) {
  const t = useT();
  const g = view.game;
  const [marks, setMarks] = useState({});
  const byId = (id) => view.players.find((p) => p.id === id);
  const others = g.callOrder.filter((id) => id !== view.me?.id);
  return (
    <div className="panel controls spectator-controls">
      <div className="controls-title">{g.myRole === 'audience' ? `👀 ${t('call.audience')}` : `🎧 ${t('call.listening')}`}</div>
      <p className="muted small">{t('call.reactHint')}</p>
      <ReactionBar />
      {g.hasCop && (
        <div className="suspects">
          <div className="suspects-title">🕵️ {t('call.notes')}</div>
          <div className="suspects-row">
            {others.map((id) => {
              const p = byId(id);
              const m = marks[id] || 0;
              return (
                <button
                  key={id}
                  type="button"
                  className={`suspect-mark mark-${m}`}
                  onClick={() => setMarks((x) => ({ ...x, [id]: ((x[id] || 0) + 1) % 3 }))}
                  title={t('call.notesTip')}
                >
                  <Avatar player={p} size="sm" headset={false} />
                  <span>{m === 1 ? '🚔?' : m === 2 ? '😈' : '·'}</span>
                </button>
              );
            })}
          </div>
          <div className="muted small">{t('call.notesHint')}</div>
        </div>
      )}
    </div>
  );
}

function SystemMessage({ m }) {
  const t = useT();
  let text;
  if (m.kind === 'transfer') text = `💸 ${t('chat.sys.transfer', { amount: money(m.amount) })}`;
  else if (m.kind === 'hold') text = `🎵 ${t('chat.sys.hold')}`;
  else if (m.kind === 'proof') text = `📎 ${t('chat.sys.proof', { title: m.title })}`;
  else if (m.kind === 'chaos') text = `⚡ ${m.text}`;
  else text = m.text || '';
  return <div className={`sys-msg sys-${m.kind}`}>{text}</div>;
}

// Messenger für den Chat-Modus: Alle lesen mit, nur Anrufer und Opfer schreiben.
function Messenger({ view, call, onHold }) {
  const t = useT();
  const g = view.game;
  const caller = view.players.find((p) => p.id === call.callerId);
  const isCaller = view.me?.id === call.callerId;
  const isVictim = g.myRole === 'victim';
  const canWrite = (isCaller || isVictim) && view.phase === 'call';
  const mySide = isCaller ? 'caller' : 'victim';
  const [text, setText] = useState('');
  const [typing, setTyping] = useState({});
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const lastTyping = useRef(0);
  useNow(400); // lässt die Tipp-Anzeige rechtzeitig verschwinden
  const messages = call.messages || [];

  useEffect(
    () =>
      onFx((fx) => {
        if (fx.type === 'typing') setTyping((x) => ({ ...x, [fx.from]: Date.now() + 2500 }));
        if (fx.type === 'chat') setTyping((x) => ({ ...x, [fx.from]: 0 }));
      }),
    [],
  );

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await act('chat', { text });
    setSending(false);
    if (res.ok) setText('');
  };

  const onType = (value) => {
    setText(value);
    if (Date.now() - lastTyping.current > 1500) {
      lastTyping.current = Date.now();
      act('typing', {}, { quiet: true });
    }
  };

  const typingSides = ['caller', 'victim'].filter((s) => (typing[s] || 0) > Date.now() && !(canWrite && s === mySide));

  return (
    <div className="messenger">
      <div className="messenger-head">
        <span className="messenger-avatar">{g.persona.emoji}</span>
        <div>
          <b>{g.numbers[call.callerId]}</b>
          <div className="small">
            {t('chat.chatWith', { name: g.persona.name })}
            {typingSides.length > 0 && <span className="messenger-typing"> · {t('chat.typing')}</span>}
          </div>
        </div>
      </div>
      <div className="messenger-body" ref={listRef}>
        {messages.length === 0 && <div className="messenger-empty">{view.phase === 'ring' ? t('chat.ringing') : t('chat.empty')}</div>}
        {messages.map((m) =>
          m.from === 'system' ? (
            <SystemMessage key={m.id} m={m} />
          ) : (
            <div key={m.id} className={`bubble from-${m.from} ${m.from === mySide ? 'is-right' : 'is-left'}`} style={m.from === 'caller' ? { '--c': caller?.color } : undefined}>
              <div className="bubble-name">{m.from === 'caller' ? `📞 ${caller?.name}` : `${g.persona.emoji} ${g.persona.name}`}</div>
              <div className="bubble-text">{m.text}</div>
            </div>
          ),
        )}
        {typingSides.map((s) => (
          <div key={s} className={`bubble from-${s} is-typing ${s === mySide ? 'is-right' : 'is-left'}`}>
            <span className="typing-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
        ))}
      </div>
      {canWrite ? (
        <form className="messenger-input" onSubmit={send}>
          <input
            value={text}
            maxLength={view.limits.chat}
            disabled={isCaller && onHold}
            placeholder={isCaller && onHold ? t('chat.onHold') : isCaller ? t('chat.placeholderCaller') : t('chat.placeholderVictim')}
            onChange={(e) => onType(e.target.value)}
            aria-label={t('chat.message')}
          />
          <button type="submit" className="btn btn-yellow" disabled={!text.trim() || sending || (isCaller && onHold)} aria-label={t('chat.send')}>
            ➤
          </button>
        </form>
      ) : (
        <div className="messenger-readonly">👀 {t('chat.readonly')}</div>
      )}
    </div>
  );
}

export function Call({ view }) {
  const t = useT();
  const g = view.game;
  const call = g.call;
  const byId = (id) => view.players.find((p) => p.id === id);
  const caller = byId(call.callerId);
  const victim = byId(g.victimId);
  const ringing = view.phase === 'ring';
  const role = g.myRole;
  const isVictim = role === 'victim';
  const isCaller = view.me?.id === call.callerId;
  const chatMode = view.settings.callMode === 'chat';
  const callKey = `${g.round}:${call.index}`;
  const [trust, setTrust] = useLiveTrust(callKey, call.trust);
  const now = useNow(250);
  const onHold = call.holdUntil && call.holdUntil > now;
  const transferred = useCountUp(call.transferred, 700);
  const voice = g.voices[call.callerId];

  useEffect(() => {
    if (ringing) play(chatMode ? 'pling' : 'ring');
  }, [ringing, callKey, chatMode]);

  const roleControls = (
    <>
      {isVictim && <VictimControls view={view} call={call} trust={trust} setTrust={setTrust} />}
      {isCaller && g.myCard && <CallerControls view={view} call={call} />}
      {!isVictim && !isCaller && <SpectatorPanel view={view} />}
    </>
  );

  return (
    <div className={`call ${ringing ? 'is-ringing' : ''} ${onHold ? 'is-hold' : ''} ${chatMode ? 'is-chat' : ''}`}>
      <div className="screen-head">
        <div>
          <div className="eyebrow">{t('call.eyebrow', { n: call.index + 1, total: g.callOrder.length, round: g.round })}</div>
          <h1 className="screen-title">{ringing ? t('call.ringing') : onHold ? t('call.onHold') : chatMode ? t('call.liveChat') : t('call.live')}</h1>
        </div>
        {!ringing && <Timer endsAt={view.phaseEndsAt} timerKey={`call:${callKey}`} tickFrom={5} big />}
      </div>

      <div className="call-stage">
        <div className="call-party">
          <Avatar player={caller} size="xl" className={ringing ? 'is-shaking' : 'is-talking'} />
          <div className="call-party-name">{caller?.name}</div>
          <div className="caller-id">
            📞 {t('call.unknownNumber')}
            <br />
            <b>{g.numbers[call.callerId]}</b>
          </div>
        </div>
        <div className="call-line" aria-hidden="true">
          {ringing ? (
            <div className="ring-text">{chatMode ? t('call.pling') : t('call.riing')}</div>
          ) : onHold ? (
            <div className="hold-text">♪ ♫ {t('call.pleaseWait')} ♫ ♪</div>
          ) : (
            <div className="waves">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          )}
        </div>
        <div className="call-party">
          <div className="persona-bubble">{g.persona.emoji}</div>
          <div className="call-party-name">{g.persona.name}</div>
          <div className="caller-id">
            {t('card.playedBy')}
            <br />
            <b>
              {victim?.avatar} {victim?.name}
            </b>
          </div>
        </div>
      </div>

      <div className="call-info">
        {voice && <VoiceCard voice={voice} owner={caller?.name} small chat={chatMode} />}
        <div className="money-box">
          <div className="money-label">{t('call.loot')}</div>
          <div className="money-value">{money(transferred)}</div>
          <div className="money-sub">{t('call.accountOf', { name: g.persona.name, amount: money(g.budgetLeft) })}</div>
        </div>
      </div>

      <TrustMeter value={trust} />

      {call.chaos && (
        <div className="chaos-pinned">
          <span className="chaos-pinned-label">⚡ {t('call.chaos')}</span> {call.chaos.emoji} {call.chaos.text}
        </div>
      )}

      {chatMode ? (
        <div className="call-controls chat-layout">
          <Messenger view={view} call={call} onHold={onHold} />
          <div className="side-col">
            {roleControls}
            <PersonaCard persona={g.persona} player={victim} budget={g.budget} budgetLeft={g.budgetLeft} compact showSecret={isVictim} />
          </div>
        </div>
      ) : (
        <div className="call-controls">
          {roleControls}
          <PersonaCard persona={g.persona} player={victim} budget={g.budget} budgetLeft={g.budgetLeft} compact showSecret={isVictim} />
        </div>
      )}
      {(isVictim || isCaller) && (
        <div className="float-reactions">
          <ReactionBar compact />
        </div>
      )}
    </div>
  );
}
