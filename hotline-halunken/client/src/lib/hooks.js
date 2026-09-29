import { useEffect, useRef, useState } from 'react';
import { serverNow, useStore } from './net.js';

// Tickt regelmäßig und liefert die (mit dem Server synchronisierte) aktuelle Zeit.
export function useNow(interval = 250) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

// Countdown bis endsAt. total = beim ersten Sehen verbleibende Zeit (für Fortschrittsbalken).
export function useCountdown(endsAt, key) {
  const { view } = useStore();
  const now = useNow(200);
  const totals = useRef({});
  const paused = view?.paused;
  const remaining = paused ? view.pausedRemaining ?? 0 : endsAt ? Math.max(0, endsAt - now) : 0;
  const k = key ?? endsAt;
  if (endsAt && totals.current[k] == null) totals.current[k] = Math.max(remaining, 1);
  const total = totals.current[k] || 1;
  return { remaining, total, progress: Math.min(1, remaining / total), seconds: Math.ceil(remaining / 1000) };
}

// Millisekunden, seit ein bestimmter Schlüssel (z. B. Phase) zum ersten Mal gesehen wurde.
export function useSince(key, interval = 100) {
  const startRef = useRef({ key: null, at: 0 });
  if (startRef.current.key !== key) startRef.current = { key, at: Date.now() };
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
  return Date.now() - startRef.current.at;
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


// Animiertes Hochzählen einer Zahl.
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return undefined;
    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, duration]);
  return value;
}
