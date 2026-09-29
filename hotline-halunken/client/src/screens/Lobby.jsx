import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { act, emitLocalFx, joinRoom } from '../lib/net.js';
import { usePrefs } from '../lib/prefs.js';
import { play, unlockAudio } from '../lib/sound.js';
import { euro } from '../lib/hooks.js';
import { Avatar } from '../components/Avatar.jsx';
import { Modal } from '../components/Modal.jsx';
import { RoomCode } from '../components/TopBar.jsx';
import { AVATARS, COLORS, ProfileEditor } from './Home.jsx';

const SELECTS = [
  { key: 'rounds', label: 'Runden', options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12], fmt: (v) => (v === 0 ? 'Auto (jeder 1× Opfer)' : `${v}`) },
  { key: 'callSeconds', label: 'Anrufdauer', options: [30, 45, 60, 75, 90, 120], fmt: (v) => `${v} Sek.` },
  { key: 'maxCallers', label: 'Anrufer pro Runde', options: [2, 3, 4, 5, 6, 8, 11], fmt: (v) => (v === 11 ? 'Alle' : `max. ${v}`) },
  { key: 'budget', label: 'Konto des Opfers', options: [500, 1000, 2000, 5000], fmt: (v) => euro(v) },
];

const TOGGLES = [
  { key: 'cop', label: '🚔 Undercover-Cop', hint: 'ab 4 Spielern' },
  { key: 'chaos', label: '⚡ Chaos-Karten', hint: 'mitten im Anruf' },
  { key: 'voices', label: '🎭 Pflicht-Stimmen', hint: 'Pirat, Roboter …' },
  { key: 'audience', label: '👀 Zuschauer erlauben', hint: 'für Streams' },
];

function estimateMinutes(settings, playerCount) {
  const n = Math.max(3, playerCount);
  const rounds = settings.rounds || Math.min(n, 6);
  const callers = Math.min(settings.maxCallers, n - 1);
  const perRound = callers * (settings.callSeconds + 11) + 30 + 25 + (settings.cop && callers >= 3 ? 50 : 0);
  return Math.max(5, Math.round((rounds * perRound) / 60));
}

export function Lobby({ view }) {
  const me = view.players.find((p) => p.id === view.me?.id);
  const isHost = !!view.me?.isHost;
  const prefs = usePrefs();
  const joinUrl = `${window.location.origin}/?r=${view.code}`;
  const [qr, setQr] = useState(null);
  const [editing, setEditing] = useState(false);
  const connectedCount = view.players.filter((p) => p.connected).length;
  const missing = Math.max(0, view.limits.min - connectedCount);
  const S = view.settings;
  const host = view.players.find((p) => p.id === view.hostId);

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 220, color: { dark: '#0b0614', light: '#fff8e7' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [joinUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      emitLocalFx({ type: 'toast', text: '🔗 Einladungslink kopiert!' });
      play('ding');
    } catch {
      window.prompt('Link kopieren:', joinUrl);
    }
  };

  const setSetting = (patch) => {
    play('pop');
    act('settings', patch);
  };

  const start = async () => {
    unlockAudio();
    const res = await act('start');
    if (res.ok) play('ring');
  };

  const becomePlayer = async () => {
    const profile = prefs.profile?.name ? prefs.profile : { name: 'Halunke', avatar: AVATARS[0], color: COLORS[0] };
    const res = await joinRoom(view.code, profile);
    if (res.error) emitLocalFx({ type: 'toast', text: res.error, kind: 'error' });
  };

  const slots = Math.min(view.limits.max, Math.max(view.limits.min, view.players.length + 1));
  const last = view.lastResults;
  const lastWinner = last?.ranking?.[0] && view.players.find((p) => p.id === last.ranking[0].id);

  return (
    <div className="lobby">
      <div className="lobby-col">
        <section className="panel invite">
          <div className="invite-text">
            <h2>Lade deine Halunken ein</h2>
            <p className="muted">Code eingeben auf dieser Seite – oder Link/QR teilen. Zuschauer können mit dem gleichen Code als Publikum rein.</p>
            <RoomCode code={view.code} big />
            <div className="invite-actions">
              <button type="button" className="btn btn-cyan" onClick={copyLink}>
                🔗 Link kopieren
              </button>
            </div>
          </div>
          {qr && (
            <div className={`qr ${prefs.streamer ? 'is-blurred' : ''}`}>
              <img src={qr} alt="QR-Code zum Beitreten" width="150" height="150" />
            </div>
          )}
        </section>

        {lastWinner && (
          <div className="last-results">
            🏆 Letzte Schicht: <b>{lastWinner.avatar} {lastWinner.name}</b> war Mitarbeiter des Monats mit {euro(last.ranking[0].score)}.
          </div>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>Die Belegschaft</h2>
            <span className="pill">
              {view.players.length}/{view.limits.max}
            </span>
          </div>
          <div className="player-grid">
            {view.players.map((p) => (
              <div key={p.id} className={`player-card ${p.id === view.me?.id ? 'is-me' : ''}`} style={{ '--c': p.color }}>
                <Avatar player={p} size="lg" crown={p.id === view.hostId} />
                <div className="player-card-name">{p.name}</div>
                {p.id === view.me?.id && (
                  <button type="button" className="mini-btn" onClick={() => setEditing(true)}>
                    ✏️ ändern
                  </button>
                )}
                {isHost && p.id !== view.me?.id && (
                  <button type="button" className="kick-btn" onClick={() => window.confirm(`${p.name} rauswerfen?`) && act('kick', { playerId: p.id })} title="Rauswerfen">
                    ✕
                  </button>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, slots - view.players.length) }, (_, i) => (
              <div key={`empty-${i}`} className="player-card is-empty">
                <div className="empty-phone">📞</div>
                <div className="player-card-name muted">frei …</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lobby-col">
        <section className="panel settings">
          <div className="panel-head">
            <h2>Schicht-Einstellungen</h2>
            {!isHost && <span className="pill pill-ghost">nur Host</span>}
          </div>
          {SELECTS.map((s) => (
            <label key={s.key} className="setting-row">
              <span>{s.label}</span>
              <select value={S[s.key]} disabled={!isHost} onChange={(e) => setSetting({ [s.key]: Number(e.target.value) })}>
                {s.options.map((o) => (
                  <option key={o} value={o}>
                    {s.fmt(o)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="toggle-grid">
            {TOGGLES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`toggle ${S[t.key] ? 'is-on' : ''}`}
                disabled={!isHost}
                aria-pressed={S[t.key]}
                onClick={() => setSetting({ [t.key]: !S[t.key] })}
              >
                <span className="toggle-label">{t.label}</span>
                <span className="toggle-hint">{t.hint}</span>
                <span className="toggle-switch" aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="estimate">⏱️ Geschätzte Spieldauer: ca. {estimateMinutes(S, view.players.length)} Minuten</div>
        </section>

        <section className="panel start-panel">
          {isHost ? (
            <>
              <button type="button" className="btn btn-yellow btn-xl" disabled={missing > 0} onClick={start}>
                🚀 Schicht starten
              </button>
              <div className="muted small center">
                {missing > 0 ? `Noch ${missing} Halunke${missing === 1 ? '' : 'n'} fehlen (mind. ${view.limits.min}).` : 'Alle am Voice-Chat? Dann los!'}
              </div>
            </>
          ) : me ? (
            <div className="waiting">
              <div className="waiting-dots">
                <span />
                <span />
                <span />
              </div>
              Warte, bis <b>{host?.name || 'der Host'}</b> die Schicht startet …
            </div>
          ) : (
            <>
              <div className="waiting">👀 Du bist im Publikum. Du kannst live reagieren und bei der Razzia mittippen.</div>
              <button type="button" className="btn btn-cyan" onClick={becomePlayer}>
                🎮 Doch mitspielen
              </button>
            </>
          )}
          <div className="voice-hint-box">🎙️ Tipp: Spielt mit Voice-Chat (Discord o. Ä.) oder im selben Raum – die Anrufe passieren per Stimme!</div>
        </section>
      </div>

      {editing && me && <EditProfile me={me} onClose={() => setEditing(false)} />}
    </div>
  );
}

function EditProfile({ me, onClose }) {
  const [name, setName] = useState(me.name);
  const [avatar, setAvatar] = useState(me.avatar);
  const [color, setColor] = useState(me.color);
  const save = async () => {
    const res = await act('profile', { name, avatar, color });
    if (res.ok) onClose();
  };
  return (
    <Modal title="Mitarbeiterausweis ändern" onClose={onClose}>
      <ProfileEditor name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} color={color} setColor={setColor} onEnter={save} />
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-yellow" onClick={save}>
          Speichern
        </button>
      </div>
    </Modal>
  );
}
