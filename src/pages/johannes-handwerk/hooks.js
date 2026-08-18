import { useEffect, useRef, useState } from 'react';

// Dezente Scroll-Reveal-Animation per IntersectionObserver.
// Gibt ein ref + Klassenname-Helfer zurück, der die Klasse "is-visible"
// erst dann anhängt, wenn das Element in den Viewport scrollt.
export function useReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return [ref, visible];
}

// Einfacher animierter Zähler (z. B. für Erfahrungsjahre / Kennzahlen).
export function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = null;
    let frame;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

// Persistiert die Theme-Wahl (hell/dunkel) in localStorage und respektiert
// die System-Einstellung (prefers-color-scheme) als Startwert.
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('jh-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.getElementById('jh-root');
    if (!root) return;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('jh-theme', theme);
  }, [theme]);

  return [theme, setTheme];
}
