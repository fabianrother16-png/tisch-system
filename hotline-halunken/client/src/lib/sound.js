import { getPrefs } from './prefs.js';

// Alle Sounds werden live mit der Web-Audio-API erzeugt – keine Audiodateien, keine Lizenzen.
let ctx = null;
let master = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    applyVolume();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function applyVolume() {
  if (!master) return;
  const { muted, volume } = getPrefs();
  master.gain.value = muted ? 0 : volume;
}

export function unlockAudio() {
  audio();
}

export function audioLocked() {
  return !ctx || ctx.state !== 'running';
}

function out(bus) {
  return bus || master;
}

function tone({ freq, type = 'sine', at = 0, dur = 0.2, vol = 0.25, attack = 0.005, release = 0.06, slide, vibrato, filter, bus }) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  if (vibrato) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = vibrato.rate;
    depth.gain.value = vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + release);
  }
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  let node = osc;
  if (filter) {
    const f = c.createBiquadFilter();
    f.type = filter.type || 'lowpass';
    f.frequency.value = filter.freq;
    if (filter.q) f.Q.value = filter.q;
    node.connect(f);
    node = f;
  }
  node.connect(gain).connect(out(bus));
  osc.start(t);
  osc.stop(t + dur + release + 0.02);
}

let noiseBuffer = null;
function noise({ at = 0, dur = 0.1, vol = 0.2, type = 'bandpass', freq = 2000, q = 1, sweepTo, bus }) {
  const c = audio();
  if (!c) return;
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(gain).connect(out(bus));
  src.start(t);
  src.stop(t + dur + 0.02);
}

const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, 'G#4': 415.3, A4: 440, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5,
  B3: 246.94, 'C#4': 277.18,
};

// --------------------------------------------------------------- einzelne Sounds
const SFX = {
  pop() {
    tone({ freq: 520, slide: 880, dur: 0.07, vol: 0.18 });
  },
  tick() {
    tone({ freq: 1200, type: 'square', dur: 0.025, vol: 0.06, filter: { freq: 2500 } });
  },
  whoosh() {
    noise({ dur: 0.35, vol: 0.25, freq: 300, sweepTo: 3500, q: 2 });
  },
  ring() {
    // Klassische Telefonklingel: zwei "Rrrring"-Stöße.
    for (const start of [0, 0.55]) {
      for (let i = 0; i < 10; i++) {
        const at = start + i * 0.04;
        tone({ freq: 1180, type: 'triangle', at, dur: 0.02, vol: 0.16, release: 0.015 });
        tone({ freq: 1480, type: 'triangle', at: at + 0.02, dur: 0.02, vol: 0.12, release: 0.015 });
      }
    }
  },
  pickup() {
    noise({ dur: 0.05, vol: 0.3, freq: 1200, q: 0.8 });
    tone({ freq: 700, at: 0.05, dur: 0.06, vol: 0.12 });
  },
  busy() {
    // „Tuut – tuut – tuut“ (425 Hz wie im deutschen Netz)
    for (let i = 0; i < 4; i++) tone({ freq: 425, at: i * 0.42, dur: 0.24, vol: 0.28, release: 0.02 });
  },
  kaching() {
    noise({ dur: 0.08, vol: 0.35, type: 'highpass', freq: 3000 });
    tone({ freq: 1568, at: 0.06, dur: 0.12, vol: 0.2, type: 'triangle' });
    tone({ freq: 2093, at: 0.12, dur: 0.5, vol: 0.2, type: 'triangle', release: 0.4 });
    tone({ freq: 3136, at: 0.12, dur: 0.4, vol: 0.06, release: 0.3 });
  },
  siren() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    osc.type = 'sawtooth';
    f.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.05);
    g.gain.setValueAtTime(0.13, t + 2.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    osc.frequency.setValueAtTime(650, t);
    for (let i = 0; i < 4; i++) {
      osc.frequency.linearRampToValueAtTime(i % 2 ? 650 : 1250, t + (i + 1) * 0.6);
    }
    osc.connect(f).connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 2.7);
  },
  drumroll(seconds = 2.4) {
    const steps = Math.floor(seconds / 0.045);
    for (let i = 0; i < steps; i++) {
      noise({ at: i * 0.045, dur: 0.05, vol: 0.05 + (i / steps) * 0.2, freq: 1800, q: 0.7 });
    }
    SFX.crash(seconds);
  },
  crash(at = 0) {
    noise({ at, dur: 1.3, vol: 0.3, type: 'highpass', freq: 5000 });
    tone({ freq: 60, at, dur: 0.25, vol: 0.4, slide: 40 });
  },
  fanfare() {
    const seq = [['C5', 0], ['E5', 0.12], ['G5', 0.24], ['C6', 0.36]];
    for (const [n, at] of seq) tone({ freq: N[n], type: 'square', at, dur: 0.11, vol: 0.09, filter: { freq: 3000 } });
    for (const n of ['C5', 'E5', 'G5', 'C6']) tone({ freq: N[n], type: 'square', at: 0.5, dur: 0.7, vol: 0.06, filter: { freq: 2500 }, vibrato: { rate: 6, depth: 4 } });
  },
  sad() {
    const seq = [['D4', 0, 0.36], ['C#4', 0.4, 0.36], ['C4', 0.8, 0.36], ['B3', 1.2, 1.1]];
    for (const [n, at, dur] of seq) {
      tone({ freq: N[n], type: 'sawtooth', at, dur, vol: 0.12, filter: { freq: 1100 }, vibrato: n === 'B3' ? { rate: 5, depth: 6 } : null });
    }
  },
  airhorn() {
    for (const [at, dur] of [[0, 0.13], [0.18, 0.13], [0.36, 0.7]]) {
      for (const f of [415, 443, 622]) tone({ freq: f, type: 'sawtooth', at, dur, vol: 0.08, filter: { freq: 2600 }, release: 0.03 });
    }
  },
  typing() {
    let at = 0;
    for (let i = 0; i < 14; i++) {
      noise({ at, dur: 0.02, vol: 0.25, freq: 2500 + Math.random() * 2000, q: 3 });
      at += 0.05 + Math.random() * 0.07;
    }
  },
  modem() {
    tone({ freq: 350, at: 0, dur: 0.3, vol: 0.1 });
    tone({ freq: 440, at: 0, dur: 0.3, vol: 0.1 });
    tone({ freq: 2100, at: 0.35, dur: 0.45, vol: 0.09 });
    for (let i = 0; i < 16; i++) {
      tone({ freq: 900 + Math.random() * 1800, type: 'square', at: 0.85 + i * 0.07, dur: 0.07, vol: 0.05, filter: { freq: 3000 } });
    }
    noise({ at: 1.2, dur: 0.9, vol: 0.12, freq: 1800, q: 0.5 });
  },
  ding() {
    tone({ freq: 1318.5, dur: 0.8, vol: 0.18, release: 0.7 });
    tone({ freq: 1760, at: 0.12, dur: 0.9, vol: 0.14, release: 0.8 });
  },
  buzzer() {
    tone({ freq: 110, type: 'square', dur: 0.55, vol: 0.12, filter: { freq: 900 } });
    tone({ freq: 116, type: 'sawtooth', dur: 0.55, vol: 0.1, filter: { freq: 900 } });
  },
  boing() {
    tone({ freq: 140, slide: 520, dur: 0.18, vol: 0.2, vibrato: { rate: 28, depth: 40 } });
    tone({ freq: 520, slide: 110, at: 0.18, dur: 0.4, vol: 0.18, vibrato: { rate: 22, depth: 30 } });
  },
  chaos() {
    for (let i = 0; i < 6; i++) tone({ freq: i % 2 ? 660 : 990, type: 'square', at: i * 0.09, dur: 0.07, vol: 0.08, filter: { freq: 2800 } });
    noise({ at: 0.55, dur: 0.25, vol: 0.2, freq: 900, sweepTo: 200, q: 3 });
  },
  paper() {
    noise({ dur: 0.25, vol: 0.2, freq: 4000, sweepTo: 1500, q: 1.5 });
    noise({ at: 0.18, dur: 0.2, vol: 0.15, freq: 2500, sweepTo: 5000, q: 1.5 });
  },
  pling() {
    tone({ freq: 988, dur: 0.07, vol: 0.14 });
    tone({ freq: 1480, at: 0.08, dur: 0.12, vol: 0.12, release: 0.1 });
  },
  coins() {
    for (let i = 0; i < 6; i++) tone({ freq: 1800 + i * 180, type: 'triangle', at: i * 0.06, dur: 0.08, vol: 0.08 });
  },
};

export function play(id, ...args) {
  try {
    SFX[id]?.(...args);
  } catch {
    /* Audio nicht verfügbar */
  }
}

// --------------------------------------------------------------- Warteschleifenmusik
// „Für Elise“ (Beethoven, gemeinfrei) als blecherne 8-Bit-Warteschleife.
const ELISE = [
  ['E5', 1], ['D#5', 1], ['E5', 1], ['D#5', 1], ['E5', 1], ['B4', 1], ['D5', 1], ['C5', 1], ['A4', 3],
  ['C4', 1], ['E4', 1], ['A4', 1], ['B4', 3], ['E4', 1], ['G#4', 1], ['B4', 1], ['C5', 3],
  ['E4', 1], ['E5', 1], ['D#5', 1], ['E5', 1], ['D#5', 1], ['E5', 1], ['B4', 1], ['D5', 1], ['C5', 1], ['A4', 3],
  ['C4', 1], ['E4', 1], ['A4', 1], ['B4', 3], ['E4', 1], ['C5', 1], ['B4', 1], ['A4', 4],
];

let holdBus = null;
export function startHoldMusic(seconds = 8) {
  const c = audio();
  if (!c) return;
  stopHoldMusic();
  holdBus = c.createGain();
  holdBus.gain.value = 1;
  holdBus.connect(master);
  const beat = 0.17;
  let at = 0.05;
  while (at < seconds) {
    for (const [n, len] of ELISE) {
      if (at >= seconds) break;
      tone({ freq: N[n], type: 'square', at, dur: beat * len * 0.9, vol: 0.07, filter: { freq: 1400 }, vibrato: { rate: 5, depth: 3 }, bus: holdBus });
      at += beat * len;
    }
    at += beat * 2;
  }
}

export function stopHoldMusic() {
  if (!holdBus || !ctx) return;
  const bus = holdBus;
  holdBus = null;
  bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  setTimeout(() => bus.disconnect(), 400);
}

// --------------------------------------------------------------- Ansager (Text-to-Speech)
export function announce(text, lang = getPrefs().lang) {
  const { announcer, muted } = getPrefs();
  if (!announcer || muted || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const clean = text.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = lang === 'en' ? 'en-US' : 'de-DE';
    u.rate = 1.05;
    u.pitch = 0.85;
    u.volume = Math.min(1, getPrefs().volume + 0.1);
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(lang === 'en' ? 'en' : 'de'));
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch {
    /* nicht unterstützt */
  }
}
