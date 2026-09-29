import { useState } from 'react';
import { clearNotice, createRoom, joinRoom, spectate, useStore } from '../lib/net.js';
import { setPrefs, usePrefs } from '../lib/prefs.js';
import { play, unlockAudio } from '../lib/sound.js';

export const AVATARS = ['🦊', '🐸', '🐷', '🐵', '🐔', '🦄', '🐙', '🐼', '🐯', '🐻', '🐨', '🦁', '🐺', '🦝', '🐧', '🦉', '🐹', '🐮', '🦆', '🐲', '👽', '🤖', '🤡', '👻'];
export const COLORS = ['#FF4F8B', '#FFD23F', '#3DDCFF', '#3CF08C', '#B57BFF', '#FF8A3D', '#FF5A5A', '#2EC4B6', '#F9A8FF', '#A3E635', '#60A5FA', '#FDBA74'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function ProfileEditor({ name, setName, avatar, setAvatar, color, setColor, onEnter }) {
  return (
    <div className="badge-card">
      <div className="badge-top">
        <span>HALUNKEN GMBH</span>
        <span className="badge-sub">Mitarbeiterausweis</span>
      </div>
      <div className="badge-body">
        <div className="badge-photo" style={{ '--c': color }}>
          <span>{avatar}</span>
        </div>
        <div className="badge-fields">
          <label className="field">
            <span>Dein Name</span>
            <input
              value={name}
              maxLength={16}
              placeholder="z. B. Kevin"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
              autoComplete="nickname"
            />
          </label>
          <div className="badge-meta">Abteilung: Telefonbetrug · Gehalt: Provision</div>
        </div>
      </div>
      <div className="picker" role="radiogroup" aria-label="Avatar">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={a === avatar}
            className={`picker-item ${a === avatar ? 'is-active' : ''}`}
            onClick={() => {
              setAvatar(a);
              play('pop');
            }}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="swatches" role="radiogroup" aria-label="Farbe">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === color}
            aria-label={`Farbe ${c}`}
            className={`swatch ${c === color ? 'is-active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
    </div>
  );
}

export function Home({ onRules }) {
  const prefs = usePrefs();
  const { notice, connected, resuming } = useStore();
  const params = new URLSearchParams(window.location.search);
  const [name, setName] = useState(prefs.profile?.name || '');
  const [avatar, setAvatar] = useState(prefs.profile?.avatar || pick(AVATARS));
  const [color, setColor] = useState(prefs.profile?.color || pick(COLORS));
  const [code, setCode] = useState((params.get('r') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [canSpectate, setCanSpectate] = useState(false);

  const profile = { name: name.trim(), avatar, color };

  async function run(fn) {
    unlockAudio();
    clearNotice();
    if (!profile.name) {
      setError('Wie heißt du? Gib einen Namen ein.');
      return;
    }
    setBusy(true);
    setError(null);
    setPrefs({ profile });
    const res = await fn();
    setBusy(false);
    if (res.error) {
      setError(res.error);
      setCanSpectate(!!res.canSpectate);
      play('buzzer');
    } else {
      play('pickup');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  const join = () => {
    if (code.length !== 4) {
      setError('Der Raumcode hat 4 Buchstaben.');
      return;
    }
    run(() => joinRoom(code, profile));
  };

  const watch = async () => {
    unlockAudio();
    if (code.length !== 4) {
      setError('Gib den Raumcode ein, um zuzuschauen.');
      return;
    }
    setBusy(true);
    const res = await spectate(code, name.trim() || 'Zuschauer');
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-phone" aria-hidden="true">☎️</div>
        <h1 className="logo">
          <span className="logo-top">HOTLINE</span>
          <span className="logo-bottom">HALUNKEN</span>
        </h1>
        <p className="hero-tag">
          Das Scam-Callcenter-Partyspiel. Ruf dein Opfer an, zock es mit absurden Maschen ab –
          <b> aber pass auf: Einer von euch ist ein Undercover-Cop.</b>
        </p>
        <div className="hero-badges">
          <span>👥 3–12 Spieler</span>
          <span>🎙️ Voice-Chat</span>
          <span>👀 Zuschauer-Modus</span>
          <span>⏱️ 15–40 Min.</span>
        </div>
      </section>

      <section className="home-main">
        <ProfileEditor name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} color={color} setColor={setColor} onEnter={() => (code.length === 4 ? join() : run(() => createRoom(profile)))} />

        <div className="home-actions">
          {(notice || error) && <div className="alert">{error || notice}</div>}
          {resuming && <div className="alert alert-info">Verbinde dich zurück ins Spiel …</div>}
          <button type="button" className="btn btn-yellow btn-xl" disabled={busy || !connected} onClick={() => run(() => createRoom(profile))}>
            📞 Neuen Raum eröffnen
          </button>
          <div className="or">
            <span>oder mit Code beitreten</span>
          </div>
          <div className="join-row">
            <input
              className="code-input"
              value={code}
              placeholder="CODE"
              maxLength={4}
              aria-label="Raumcode"
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && join()}
            />
            <button type="button" className="btn btn-cyan" disabled={busy || !connected} onClick={join}>
              Beitreten
            </button>
          </div>
          <button type="button" className={`btn btn-ghost ${canSpectate ? 'is-pulse' : ''}`} disabled={busy || !connected} onClick={watch}>
            👀 Nur zuschauen (Publikum)
          </button>
          {!connected && <div className="muted small">Verbinde mit dem Server …</div>}
          <button type="button" className="link-btn" onClick={onRules}>
            ❓ Wie funktioniert das Spiel?
          </button>
        </div>
      </section>

      <section className="how">
        <div className="how-step">
          <span>🎯</span>
          <b>Einer ist das Opfer</b>
          <p>Oma Gertrud, Graf Dracula oder ein smarter Toaster – mit echtem Konto.</p>
        </div>
        <div className="how-step">
          <span>📞</span>
          <b>Alle anderen rufen an</b>
          <p>Mit absurden Maschen und Pflicht-Stimmen: Pirat, Roboter, Sportkommentator …</p>
        </div>
        <div className="how-step">
          <span>📵</span>
          <b>Überweisen oder auflegen</b>
          <p>Das Opfer schickt Geld, drückt dich in die Warteschleife – oder legt einfach auf.</p>
        </div>
        <div className="how-step">
          <span>🚔</span>
          <b>Razzia!</b>
          <p>Einer der Anrufer ist ein Undercover-Cop. Findet ihn – oder er kassiert eure Beute.</p>
        </div>
      </section>

      <footer className="home-foot">
        Parodie-Spiel. Echte Betrugsanrufe? Auflegen – und im Zweifel 110 wählen.
      </footer>
    </div>
  );
}
