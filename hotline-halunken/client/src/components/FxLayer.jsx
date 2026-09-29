import { useEffect, useRef, useState } from 'react';
import { onFx, serverNow, useStore } from '../lib/net.js';
import { announce, play, startHoldMusic, stopHoldMusic } from '../lib/sound.js';
import { money, t as translateNow, translate, useT } from '../lib/i18n.js';
import { ProofCard } from './Cards.jsx';

let nextId = 1;

// Globale Effekte: Geldregen, AUFGELEGT, Chaos-Karten, Beweise – plus die passenden Sounds.
export function FxLayer() {
  const t = useT();
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
    const nameOf = (id) => viewRef.current?.players.find((p) => p.id === id)?.name ?? '???';
    return onFx((fx) => {
      const v = viewRef.current;
      switch (fx.type) {
        case 'transfer':
          play('kaching');
          show('transfer', { amount: fx.amount, to: nameOf(fx.callerId), all: fx.all }, 2800);
          if (fx.all) announce(translateNow('say.allIn'));
          break;
        case 'callEnd':
          stopHoldMusic();
          if (fx.reason === 'hangup') {
            play('busy');
            show('hangup', { name: nameOf(fx.callerId) }, 2800);
            announce(translateNow('say.hungUp'));
          } else if (fx.reason === 'timeout') {
            play('buzzer');
          }
          break;
        case 'chaos':
          play('chaos');
          show('chaos', fx.chaos, 6500);
          {
            // Die Karte ist in der Kartensprache des Raums – also auch so vorlesen.
            const roomLang = v?.settings?.lang;
            announce(`${translate(roomLang, 'say.chaos')} ${fx.chaos.text}`, roomLang);
          }
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
        case 'chat': {
          const myRole = v?.game?.myRole;
          const mine = (fx.from === 'victim' && myRole === 'victim') || (fx.from === 'caller' && v?.game?.call?.callerId === v?.me?.id);
          if (!mine) play('pling');
          break;
        }
        case 'pause':
          stopHoldMusic();
          break;
        case 'resume':
          if (fx.holdUntil && fx.holdUntil > serverNow()) startHoldMusic((fx.holdUntil - serverNow()) / 1000);
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
              <MoneyRain big={o.data.all || o.data.amount >= (view?.chips?.[3] ?? 500)} />
              <div className="fx-transfer-box">
                <div className="fx-transfer-amount">+{money(o.data.amount)}</div>
                <div className="fx-transfer-to">💸 {t('fx.transferTo', { name: o.data.to })}</div>
                {o.data.all && <div className="fx-transfer-all">{t('fx.all')}</div>}
              </div>
            </div>
          );
        }
        if (o.kind === 'hangup') {
          return (
            <div key={o.id} className="fx fx-hangup" onClick={() => dismiss(o.id)}>
              <div className="fx-hangup-box">
                <div className="fx-hangup-icon">📵</div>
                <div className="fx-hangup-text">{t('fx.hungUp')}</div>
                <div className="fx-hangup-sub">{t('fx.busy', { name: o.data.name })}</div>
              </div>
            </div>
          );
        }
        if (o.kind === 'chaos') {
          return (
            <div key={o.id} className="fx fx-chaos" onClick={() => dismiss(o.id)}>
              <div className="fx-chaos-card">
                <div className="fx-chaos-label">⚡ {t('fx.chaosCard')} ⚡</div>
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
        <span key={d.id} style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, fontSize: `${d.size}rem` }}>
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
  const t = useT();
  const [toasts, setToasts] = useState([]);
  useEffect(
    () =>
      onFx((fx) => {
        if (fx.type !== 'toast') return;
        const id = nextId++;
        setToasts((list) => [...list.slice(-3), { id, text: fx.text, key: fx.key, vars: fx.vars, kind: fx.kind || 'info' }]);
        setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
      }),
    [],
  );
  return (
    <div className="toasts" role="status">
      {toasts.map((x) => (
        <div key={x.id} className={`toast toast-${x.kind}`}>
          {x.key ? t(x.key, x.vars) : x.text}
        </div>
      ))}
    </div>
  );
}
