import { useEffect, useRef } from 'react';
import { useCountdown } from '../lib/hooks.js';
import { useT } from '../lib/i18n.js';
import { play } from '../lib/sound.js';

export function Timer({ endsAt, timerKey, tickFrom = 0, big = false, label }) {
  const t = useT();
  const { seconds, progress } = useCountdown(endsAt, timerKey);
  const lastTick = useRef(null);
  useEffect(() => {
    if (!tickFrom || !endsAt) return;
    if (seconds > 0 && seconds <= tickFrom && lastTick.current !== seconds) {
      lastTick.current = seconds;
      play('tick');
    }
  }, [seconds, tickFrom, endsAt]);
  if (!endsAt) return null;
  const r = 26;
  const circ = 2 * Math.PI * r;
  const danger = seconds <= 5;
  return (
    <div className={`timer ${big ? 'timer-big' : ''} ${danger ? 'is-danger' : ''}`} role="timer" aria-label={t('timer.seconds', { n: seconds })}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="timer-track" />
        <circle cx="32" cy="32" r={r} className="timer-bar" strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} />
      </svg>
      <span className="timer-num">{seconds}</span>
      {label && <span className="timer-label">{label}</span>}
    </div>
  );
}

export function TimerBar({ endsAt, timerKey }) {
  const { progress } = useCountdown(endsAt, timerKey);
  if (!endsAt) return null;
  return (
    <div className="timer-strip" aria-hidden="true">
      <div className="timer-strip-fill" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
