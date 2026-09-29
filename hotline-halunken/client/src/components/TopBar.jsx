import { useState } from 'react';
import { act, leaveRoom, useStore } from '../lib/net.js';
import { setPrefs, usePrefs } from '../lib/prefs.js';
import { applyVolume, play, stopHoldMusic } from '../lib/sound.js';

export function RoomCode({ code, big = false }) {
  const { streamer } = usePrefs();
  const [peek, setPeek] = useState(false);
  const hidden = streamer && !peek;
  return (
    <button
      type="button"
      className={`room-code ${big ? 'is-big' : ''} ${hidden ? 'is-hidden' : ''}`}
      onClick={() => streamer && setPeek((p) => !p)}
      title={streamer ? 'Streamer-Modus: Klicken zum Anzeigen/Verstecken' : 'Raumcode'}
    >
      <span className="room-code-label">RAUM</span>
      <span className="room-code-value">{hidden ? '••••' : code}</span>
    </button>
  );
}

export function TopBar({ onRules }) {
  const { view, connected } = useStore();
  const prefs = usePrefs();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHost = view?.me?.isHost;
  const inGame = view && view.phase !== 'lobby' && view.phase !== 'gameOver';

  const toggleMute = () => {
    setPrefs({ muted: !prefs.muted });
    applyVolume();
    if (!prefs.muted) {
      stopHoldMusic();
      window.speechSynthesis?.cancel();
    } else play('pop');
  };

  const leave = async () => {
    const msg = view?.me ? 'Wirklich den Raum verlassen?' : 'Zuschauen beenden?';
    if (window.confirm(msg)) await leaveRoom();
  };

  const endGame = () => {
    if (window.confirm('Spiel für alle beenden und direkt zur Auswertung springen?')) act('endGame');
  };

  return (
    <header className="topbar">
      <div className="brand" aria-label="Hotline Halunken">
        <span className="brand-phone">📞</span>
        <span className="brand-text">HOTLINE <em>HALUNKEN</em></span>
      </div>
      <div className="topbar-mid">
        {view && <RoomCode code={view.code} />}
        {view?.game && view.phase !== 'gameOver' && (
          <span className="pill">
            Runde {view.game.round}/{view.game.totalRounds}
          </span>
        )}
        {view && view.audienceCount > 0 && <span className="pill pill-ghost">👀 {view.audienceCount}</span>}
        {view && !view.me && <span className="pill pill-cyan">Zuschauer</span>}
        {view && !connected && <span className="pill pill-red">Verbindung weg …</span>}
      </div>
      <div className="topbar-actions">
        {isHost && inGame && (
          <>
            <button type="button" className="icon-btn" onClick={() => act(view.paused ? 'resume' : 'pause')} title={view.paused ? 'Weiter' : 'Pause'}>
              {view.paused ? '▶️' : '⏸️'}
            </button>
          </>
        )}
        <button type="button" className={`icon-btn ${prefs.muted ? 'is-off' : ''}`} onClick={toggleMute} title={prefs.muted ? 'Ton an' : 'Ton aus'}>
          {prefs.muted ? '🔇' : '🔊'}
        </button>
        <button type="button" className="icon-btn more-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} title="Mehr">
          ☰
        </button>
        <div className={`topbar-secondary ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)}>
          {isHost && inGame && (
            <>
              <button type="button" className="icon-btn" onClick={() => act('skip')} title="Aktuelle Phase überspringen">
                ⏭️<span className="menu-label">Phase überspringen</span>
              </button>
              <button type="button" className="icon-btn" onClick={endGame} title="Spiel beenden">
                🏁<span className="menu-label">Spiel beenden</span>
              </button>
            </>
          )}
          <button
            type="button"
            className={`icon-btn ${prefs.announcer ? '' : 'is-off'}`}
            onClick={() => setPrefs({ announcer: !prefs.announcer })}
            title={prefs.announcer ? 'Ansager-Stimme aus' : 'Ansager-Stimme an'}
          >
            🗣️<span className="menu-label">Ansager {prefs.announcer ? 'an' : 'aus'}</span>
          </button>
          <button
            type="button"
            className={`icon-btn ${prefs.streamer ? 'is-on' : ''}`}
            onClick={() => setPrefs({ streamer: !prefs.streamer })}
            title="Streamer-Modus (versteckt den Raumcode)"
          >
            🎥<span className="menu-label">Streamer-Modus {prefs.streamer ? 'an' : 'aus'}</span>
          </button>
          <button type="button" className="icon-btn" onClick={onRules} title="Spielregeln">
            ❓<span className="menu-label">Spielregeln</span>
          </button>
          {view && (
            <button type="button" className="icon-btn" onClick={leave} title="Raum verlassen">
              🚪<span className="menu-label">Raum verlassen</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
