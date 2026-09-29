import { useState } from 'react';
import { act, leaveRoom, useStore } from '../lib/net.js';
import { setPrefs, usePrefs } from '../lib/prefs.js';
import { LANGUAGES, setLang, useT } from '../lib/i18n.js';
import { applyVolume, play, stopHoldMusic } from '../lib/sound.js';

export function RoomCode({ code, big = false }) {
  const t = useT();
  const { streamer } = usePrefs();
  const [peek, setPeek] = useState(false);
  const hidden = streamer && !peek;
  return (
    <button
      type="button"
      className={`room-code ${big ? 'is-big' : ''} ${hidden ? 'is-hidden' : ''}`}
      onClick={() => streamer && setPeek((p) => !p)}
      title={streamer ? t('top.codeStreamerTip') : t('top.codeTip')}
    >
      <span className="room-code-label">{t('top.room')}</span>
      <span className="room-code-value">{hidden ? '••••' : code}</span>
    </button>
  );
}

export function TopBar({ onRules }) {
  const t = useT();
  const { view, connected } = useStore();
  const prefs = usePrefs();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHost = view?.me?.isHost;
  const inGame = view && view.phase !== 'lobby' && view.phase !== 'gameOver';
  const otherLang = LANGUAGES.find((l) => l.id !== prefs.lang) || LANGUAGES[0];

  const toggleMute = () => {
    setPrefs({ muted: !prefs.muted });
    applyVolume();
    if (!prefs.muted) {
      stopHoldMusic();
      window.speechSynthesis?.cancel();
    } else play('pop');
  };

  const leave = async () => {
    if (window.confirm(view?.me ? t('top.confirmLeave') : t('top.confirmStopWatching'))) await leaveRoom();
  };

  const endGame = () => {
    if (window.confirm(t('top.confirmEnd'))) act('endGame');
  };

  const onOff = (v) => (v ? t('common.on') : t('common.off'));

  return (
    <header className="topbar">
      <div className="brand" aria-label="Hotline Halunken">
        <span className="brand-phone">📞</span>
        <span className="brand-text">
          HOTLINE <em>HALUNKEN</em>
        </span>
      </div>
      <div className="topbar-mid">
        {view && <RoomCode code={view.code} />}
        {view?.game && view.phase !== 'gameOver' && <span className="pill">{t('top.round', { round: view.game.round, total: view.game.totalRounds })}</span>}
        {view && view.audienceCount > 0 && <span className="pill pill-ghost">👀 {view.audienceCount}</span>}
        {view && !view.me && <span className="pill pill-cyan">{t('top.spectator')}</span>}
        {view && !connected && <span className="pill pill-red">{t('top.connectionLost')}</span>}
      </div>
      <div className="topbar-actions">
        {isHost && inGame && (
          <button type="button" className="icon-btn" onClick={() => act(view.paused ? 'resume' : 'pause')} title={view.paused ? t('top.resume') : t('top.pause')}>
            {view.paused ? '▶️' : '⏸️'}
          </button>
        )}
        <button type="button" className={`icon-btn ${prefs.muted ? 'is-off' : ''}`} onClick={toggleMute} title={prefs.muted ? t('top.soundOn') : t('top.soundOff')}>
          {prefs.muted ? '🔇' : '🔊'}
        </button>
        <button type="button" className="icon-btn more-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} title={t('top.more')}>
          ☰
        </button>
        <div className={`topbar-secondary ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)}>
          {isHost && inGame && (
            <>
              <button type="button" className="icon-btn" onClick={() => act('skip')} title={t('top.skipTip')}>
                ⏭️<span className="menu-label">{t('top.skip')}</span>
              </button>
              <button type="button" className="icon-btn" onClick={endGame} title={t('top.end')}>
                🏁<span className="menu-label">{t('top.end')}</span>
              </button>
            </>
          )}
          <button type="button" className="icon-btn" onClick={() => setLang(otherLang.id)} title={otherLang.label}>
            {otherLang.flag}
            <span className="menu-label">{otherLang.label}</span>
          </button>
          <button
            type="button"
            className={`icon-btn ${prefs.announcer ? '' : 'is-off'}`}
            onClick={() => setPrefs({ announcer: !prefs.announcer })}
            title={t('top.announcerTip')}
          >
            🗣️<span className="menu-label">{t('top.announcer', { state: onOff(prefs.announcer) })}</span>
          </button>
          <button type="button" className={`icon-btn ${prefs.streamer ? 'is-on' : ''}`} onClick={() => setPrefs({ streamer: !prefs.streamer })} title={t('top.streamerTip')}>
            🎥<span className="menu-label">{t('top.streamer', { state: onOff(prefs.streamer) })}</span>
          </button>
          <button type="button" className="icon-btn" onClick={onRules} title={t('top.rules')}>
            ❓<span className="menu-label">{t('top.rules')}</span>
          </button>
          {view && (
            <button type="button" className="icon-btn" onClick={leave} title={t('top.leave')}>
              🚪<span className="menu-label">{t('top.leave')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
