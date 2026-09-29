import { useEffect, useRef, useState } from 'react';
import { act, onFx } from '../lib/net.js';
import { play } from '../lib/sound.js';
import { euro, useCountUp, useNow } from '../lib/hooks.js';
import { Avatar } from '../components/Avatar.jsx';
import { MascheCard, PersonaCard, VoiceCard } from '../components/Cards.jsx';
import { Timer } from '../components/Timer.jsx';
import { ReactionBar } from '../components/Reactions.jsx';

const SOUNDBOARD = [
  { id: 'airhorn', label: 'Airhorn', emoji: '📯' },
  { id: 'kaching', label: 'Ka-Ching', emoji: '💰' },
  { id: 'typing', label: 'Tippen', emoji: '⌨️' },
  { id: 'modem', label: 'Modem', emoji: '📠' },
  { id: 'drumroll', label: 'Trommel', emoji: '🥁' },
  { id: 'sad', label: 'Traurig', emoji: '🎺' },
  { id: 'ding', label: 'Richtig', emoji: '🔔' },
  { id: 'buzzer', label: 'Falsch', emoji: '❌' },
  { id: 'boing', label: 'Boing', emoji: '🌀' },
];

const TRUST_LEVELS = [
  { max: 15, label: 'Eiskalt misstrauisch', emoji: '🧊' },
  { max: 35, label: 'Skeptisch', emoji: '🤨' },
  { max: 60, label: 'Unentschlossen', emoji: '😐' },
  { max: 85, label: 'Überzeugt', emoji: '🙂' },
  { max: 101, label: 'Komplett verliebt', emoji: '😍' },
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
  const lvl = trustLevel(value);
  return (
    <div className="trust">
      <div className="trust-head">
        <span>VERTRAUENS-O-METER</span>
        <span className="trust-state">
          {lvl.emoji} {lvl.label}
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
  return (
    <div className="soundboard">
      {SOUNDBOARD.map((s) => (
        <button key={s.id} type="button" className="sound-btn" onClick={() => act('sound', { id: s.id })} title={s.label}>
          <span>{s.emoji}</span>
          <small>{s.label}</small>
        </button>
      ))}
    </div>
  );
}

function VictimControls({ view, call, trust, setTrust }) {
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
      <div className="controls-title">📱 DEIN TELEFON</div>
      <div className="trust-control">
        <button type="button" className="btn btn-sq" onClick={() => changeTrust(trust - 15)} disabled={ringing} aria-label="Weniger Vertrauen">
          👎
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={trust}
          disabled={ringing}
          onChange={(e) => changeTrust(Number(e.target.value))}
          aria-label="Vertrauen"
        />
        <button type="button" className="btn btn-sq" onClick={() => changeTrust(trust + 15)} disabled={ringing} aria-label="Mehr Vertrauen">
          👍
        </button>
      </div>

      <div className="transfer">
        <div className="transfer-head">
          <span>💸 Überweisen</span>
          <span className="transfer-balance">Konto: {euro(g.budgetLeft)}</span>
        </div>
        <div className="chips">
          {view.chips.map((c) => (
            <button key={c} type="button" className="chip" disabled={ringing || g.budgetLeft <= 0} onClick={() => act('transfer', { amount: c })}>
              +{euro(c)}
            </button>
          ))}
          <button
            type="button"
            className="chip chip-all"
            disabled={ringing || g.budgetLeft <= 0}
            onClick={() => window.confirm(`Wirklich ALLES (${euro(g.budgetLeft)}) überweisen?`) && act('transfer', { amount: 'all' })}
          >
            ALLES!
          </button>
        </div>
      </div>

      <div className="victim-buttons">
        <button type="button" className="btn btn-purple" disabled={ringing || call.holdUsed} onClick={() => act('hold')}>
          🎵 {holdActive ? 'In der Warteschleife …' : call.holdUsed ? 'Warteschleife benutzt' : 'Warteschleife'}
        </button>
        <button type="button" className="btn btn-hangup" disabled={ringing || hangupIn > 0} onClick={() => act('hangup')}>
          📵 {hangupIn > 0 && !ringing ? `AUFLEGEN (in ${hangupIn})` : 'AUFLEGEN'}
        </button>
      </div>
      <details className="soundboard-wrap">
        <summary>🎛️ Soundboard</summary>
        <Soundboard />
      </details>
    </div>
  );
}

function CallerControls({ view, call }) {
  const card = view.game.myCard;
  return (
    <div className="panel controls caller-controls">
      <div className="controls-title">{card.isCop ? '🚔 DU BIST DRAN, COP!' : '😈 DU BIST DRAN!'}</div>
      {card.isCop && <div className="cop-rule">🚫 Verboten: GELD · EURO · ZAHLEN · ÜBERWEISEN</div>}
      <MascheCard masche={card.masche} />
      <button type="button" className="btn btn-yellow" disabled={call.proofSent || view.phase === 'ring'} onClick={() => act('proof')}>
        📎 {call.proofSent ? 'Beweis verschickt' : `Fake-Beweis schicken: „${card.masche.proof.title}“`}
      </button>
      <details className="soundboard-wrap" open>
        <summary>🎛️ Soundboard</summary>
        <Soundboard />
      </details>
    </div>
  );
}

function SpectatorPanel({ view }) {
  const g = view.game;
  const [marks, setMarks] = useState({});
  const byId = (id) => view.players.find((p) => p.id === id);
  const others = g.callOrder.filter((id) => id !== view.me?.id);
  return (
    <div className="panel controls spectator-controls">
      <div className="controls-title">{g.myRole === 'audience' ? '👀 PUBLIKUM' : '🎧 DU HÖRST MIT'}</div>
      <p className="muted small">Reagiere live – die Emojis fliegen bei allen über den Bildschirm!</p>
      <ReactionBar />
      {g.hasCop && (
        <div className="suspects">
          <div className="suspects-title">🕵️ Deine geheimen Cop-Notizen</div>
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
                  title="Klicken: verdächtig / sicher / neutral"
                >
                  <Avatar player={p} size="sm" headset={false} />
                  <span>{m === 1 ? '🚔?' : m === 2 ? '😈' : '·'}</span>
                </button>
              );
            })}
          </div>
          <div className="muted small">Wer sagt nie „Geld“? Tippe zum Markieren (nur du siehst das).</div>
        </div>
      )}
    </div>
  );
}

export function Call({ view }) {
  const g = view.game;
  const call = g.call;
  const byId = (id) => view.players.find((p) => p.id === id);
  const caller = byId(call.callerId);
  const victim = byId(g.victimId);
  const ringing = view.phase === 'ring';
  const role = g.myRole;
  const isVictim = role === 'victim';
  const isCaller = view.me?.id === call.callerId;
  const callKey = `${g.round}:${call.index}`;
  const [trust, setTrust] = useLiveTrust(callKey, call.trust);
  const now = useNow(250);
  const onHold = call.holdUntil && call.holdUntil > now;
  const transferred = useCountUp(call.transferred, 700);
  const voice = g.voices[call.callerId];

  useEffect(() => {
    if (ringing) play('ring');
  }, [ringing, callKey]);

  return (
    <div className={`call ${ringing ? 'is-ringing' : ''} ${onHold ? 'is-hold' : ''}`}>
      <div className="screen-head">
        <div>
          <div className="eyebrow">
            Anruf {call.index + 1} von {g.callOrder.length} · Runde {g.round}
          </div>
          <h1 className="screen-title">{ringing ? 'Es klingelt …' : onHold ? 'Warteschleife 🎵' : 'Live-Anruf'}</h1>
        </div>
        {!ringing && <Timer endsAt={view.phaseEndsAt} timerKey={`call:${callKey}`} tickFrom={5} big />}
      </div>

      <div className="call-stage">
        <div className="call-party">
          <Avatar player={caller} size="xl" className={ringing ? 'is-shaking' : 'is-talking'} />
          <div className="call-party-name">{caller?.name}</div>
          <div className="caller-id">📞 Unbekannte Nummer<br /><b>{g.numbers[call.callerId]}</b></div>
        </div>
        <div className="call-line" aria-hidden="true">
          {ringing ? (
            <div className="ring-text">RIIING!</div>
          ) : onHold ? (
            <div className="hold-text">♪ ♫ Bitte warten … ♫ ♪</div>
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
            gespielt von<br />
            <b>{victim?.avatar} {victim?.name}</b>
          </div>
        </div>
      </div>

      <div className="call-info">
        {voice && <VoiceCard voice={voice} owner={caller?.name} small />}
        <div className="money-box">
          <div className="money-label">Beute in diesem Anruf</div>
          <div className="money-value">{euro(transferred)}</div>
          <div className="money-sub">Konto von {g.persona.name}: {euro(g.budgetLeft)}</div>
        </div>
      </div>

      <TrustMeter value={trust} />

      {call.chaos && (
        <div className="chaos-pinned">
          <span className="chaos-pinned-label">⚡ CHAOS</span> {call.chaos.emoji} {call.chaos.text}
        </div>
      )}

      <div className="call-controls">
        {isVictim && <VictimControls view={view} call={call} trust={trust} setTrust={setTrust} />}
        {isCaller && g.myCard && <CallerControls view={view} call={call} />}
        {!isVictim && !isCaller && <SpectatorPanel view={view} />}
        <PersonaCard persona={g.persona} player={victim} budget={g.budget} budgetLeft={g.budgetLeft} compact showSecret={isVictim} />
      </div>
      {(isVictim || isCaller) && (
        <div className="float-reactions">
          <ReactionBar compact />
        </div>
      )}
    </div>
  );
}
