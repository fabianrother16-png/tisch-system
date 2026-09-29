import { useEffect, useRef, useState } from 'react';
import { onFx, useStore } from '../lib/net.js';
import { announce, play, startHoldMusic, stopHoldMusic } from '../lib/sound.js';
import { euro } from '../lib/hooks.js';
import { ProofCard } from './Cards.jsx';

let nextId = 1;

// Globale Effekte: Geldregen, AUFGELEGT, Chaos-Karten, Beweise – plus die passenden Sounds.
export function FxLayer() {
  const { view } = useStore();
  const viewRef = useRef(view);
  viewRef.current = view;
  const [overlays, setOverlays] = useState([]);

  useEffect(() => {
    const show = (kind, data, ms) => {
      const id = nextId++;
      setOverlays((list) => [...list.filter((o) => o.kind !== kind), { id, kind, data }]);
      setTimeout(() => setOverlays((list) => list.filter((o) => o.id !== id)), ms);
    };
    const nameOf = (id) => viewRef.current?.players.find((p) => p.id === id)?.name ?? 'Jemand';
    return onFx((fx) => {
      switch (fx.type) {
        case 'transfer':
          play('kaching');
          show('transfer', { amount: fx.amount, to: nameOf(fx.callerId), all: fx.all }, 2800);
          if (fx.all) announce('Wahnsinn. Das Opfer hat alles überwiesen!');
          break;
        case 'callEnd':
          stopHoldMusic();
          if (fx.reason === 'hangup') {
            play('busy');
            show('hangup', { name: nameOf(fx.callerId) }, 2800);
            announce('Aufgelegt!');
          } else if (fx.reason === 'timeout') {
            play('buzzer');
          }
          break;
        case 'chaos':
          play('chaos');
          show('chaos', fx.chaos, 6500);
          announce(`Chaos-Karte! ${fx.chaos.text}`);
          break;
        case 'proof':
          play('paper');
          show('proof', { proof: fx.proof, from: nameOf(fx.callerId) }, 7000);
          break;
        case 'hold':
          startHoldMusic(Math.max(1, (fx.until - fx.at) / 1000));
          break;
        case 'holdEnd':
          stopHoldMusic();
          break;
        case 'sfx':
          play(fx.id);
          break;
        case 'pause':
          stopHoldMusic();
          break;
        default:
          break;
      }
    });
  }, []);

  const dismiss = (id) => setOverlays((list) => list.filter((o) => o.id !== id));

  return (
    <div className="fx-layer" aria-live="polite">
      {overlays.map((o) => {
        if (o.kind === 'transfer') {
          return (
            <div key={o.id} className="fx fx-transfer">
              <MoneyRain big={o.data.all || o.data.amount >= 500} />
              <div className="fx-transfer-box">
                <div className="fx-transfer-amount">+{euro(o.data.amount)}</div>
                <div className="fx-transfer-to">💸 überwiesen an {o.data.to}</div>
                {o.data.all && <div className="fx-transfer-all">ALLES!!!</div>}
              </div>
            </div>
          );
        }
        if (o.kind === 'hangup') {
          return (
            <div key={o.id} className="fx fx-hangup" onClick={() => dismiss(o.id)}>
              <div className="fx-hangup-box">
                <div className="fx-hangup-icon">📵</div>
                <div className="fx-hangup-text">AUFGELEGT!</div>
                <div className="fx-hangup-sub">tuut … tuut … tuut … ({o.data.name})</div>
              </div>
            </div>
          );
        }
        if (o.kind === 'chaos') {
          return (
            <div key={o.id} className="fx fx-chaos" onClick={() => dismiss(o.id)}>
              <div className="fx-chaos-card">
                <div className="fx-chaos-label">⚡ CHAOS-KARTE ⚡</div>
                <div className="fx-chaos-emoji">{o.data.emoji}</div>
                <div className="fx-chaos-text">{o.data.text}</div>
              </div>
            </div>
          );
        }
        if (o.kind === 'proof') {
          return (
            <div key={o.id} className="fx fx-proof" onClick={() => dismiss(o.id)}>
              <ProofCard proof={o.data.proof} from={o.data.from} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function MoneyRain({ big }) {
  const [drops] = useState(() =>
    Array.from({ length: big ? 42 : 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 1.4 + Math.random() * 1.1,
      emoji: ['💸', '💶', '💰', '🪙'][i % 4],
      size: 1.4 + Math.random() * 1.6,
    })),
  );
  return (
    <div className="money-rain" aria-hidden="true">
      {drops.map((d) => (
        <span
          key={d.id}
          style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, fontSize: `${d.size}rem` }}
        >
          {d.emoji}
        </span>
      ))}
    </div>
  );
}

// Fliegende Emoji-Reaktionen von Spielern und Zuschauern.
export function ReactionLayer() {
  const [items, setItems] = useState([]);
  useEffect(
    () =>
      onFx((fx) => {
        if (fx.type !== 'reaction') return;
        const id = nextId++;
        const item = { id, emoji: fx.emoji, name: fx.name, color: fx.color, audience: fx.audience, left: 6 + Math.random() * 82, drift: Math.random() * 60 - 30 };
        setItems((list) => [...list.slice(-40), item]);
        setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 2600);
      }),
    [],
  );
  return (
    <div className="reaction-layer" aria-hidden="true">
      {items.map((r) => (
        <div key={r.id} className="reaction-float" style={{ left: `${r.left}%`, '--drift': `${r.drift}px` }}>
          <span className="reaction-emoji">{r.emoji}</span>
          <span className="reaction-name" style={{ background: r.audience ? '#ffffff' : r.color }}>
            {r.audience ? '👀 ' : ''}
            {r.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Toasts() {
  const [toasts, setToasts] = useState([]);
  useEffect(
    () =>
      onFx((fx) => {
        if (fx.type !== 'toast') return;
        const id = nextId++;
        setToasts((list) => [...list.slice(-3), { id, text: fx.text, kind: fx.kind || 'info' }]);
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
      }),
    [],
  );
  return (
    <div className="toasts" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
