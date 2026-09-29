import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { act, emitLocalFx, joinRoom, showError } from '../lib/net.js';
import { usePrefs } from '../lib/prefs.js';
import { LANGUAGES, money, useT } from '../lib/i18n.js';
import { play, unlockAudio } from '../lib/sound.js';
import { Avatar } from '../components/Avatar.jsx';
import { Modal } from '../components/Modal.jsx';
import { RoomCode } from '../components/TopBar.jsx';
import { CustomCardsEditor } from '../components/CustomCards.jsx';
import { AVATARS, COLORS, ProfileEditor } from './Home.jsx';

const SELECTS = [
  { key: 'rounds', options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12], fmt: (v, t) => (v === 0 ? t('lobby.roundsAuto') : `${v}`) },
  { key: 'callSeconds', options: [30, 45, 60, 75, 90, 120], fmt: (v, t) => t('lobby.seconds', { n: v }) },
  { key: 'maxCallers', options: [2, 3, 4, 5, 6, 8, 11], fmt: (v, t) => (v === 11 ? t('lobby.callersAll') : t('lobby.callersMax', { n: v })) },
  { key: 'budget', options: [500, 1000, 2000, 5000], fmt: (v, t, lang) => money(v, lang) },
];

const TOGGLES = [
  { key: 'cop', icon: '🚔' },
  { key: 'chaos', icon: '⚡' },
  { key: 'voices', icon: '🎭' },
  { key: 'audience', icon: '👀' },
];

function estimateMinutes(settings, playerCount) {
  const n = Math.max(3, playerCount);
  const rounds = settings.rounds || Math.min(n, 6);
  const callers = Math.min(settings.maxCallers, n - 1);
  const perRound = callers * (settings.callSeconds + 11) + 30 + 25 + (settings.cop && callers >= 3 ? 50 : 0);
  return Math.max(5, Math.round((rounds * perRound) / 60));
}

export function Lobby({ view }) {
  const t = useT();
  const me = view.players.find((p) => p.id === view.me?.id);
  const isHost = !!view.me?.isHost;
  const prefs = usePrefs();
  const joinUrl = `${window.location.origin}/?r=${view.code}`;
  const [qr, setQr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const connectedCount = view.players.filter((p) => p.connected).length;
  const missing = Math.max(0, view.limits.min - connectedCount);
  const S = view.settings;
  const host = view.players.find((p) => p.id === view.hostId);
  const customTotal = view.custom.maschen + view.custom.personas;
  const autoApplied = useRef(null);

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 220, color: { dark: '#0b0614', light: '#fff8e7' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [joinUrl]);

  // Eigene Karten des Hosts automatisch in neue Räume laden.
  useEffect(() => {
    const local = prefs.customCards;
    const hasLocal = local && (local.maschen?.length || local.personas?.length);
    if (!isHost || !prefs.autoCustom || !hasLocal || customTotal > 0 || autoApplied.current === view.code) return;
    autoApplied.current = view.code;
    act('custom', local, { quiet: true }).then((res) => {
      if (res.ok) emitLocalFx({ type: 'toast', key: 'custom.autoLoaded', vars: res.counts });
    });
  }, [isHost, prefs.autoCustom, prefs.customCards, customTotal, view.code]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      emitLocalFx({ type: 'toast', key: 'lobby.linkCopied' });
      play('ding');
    } catch {
      window.prompt(t('lobby.copyPrompt'), joinUrl);
    }
  };

  const setSetting = (patch) => {
    play('pop');
    act('settings', patch);
  };

  const setMode = (mode) => {
    const patch = { callMode: mode };
    if (mode === 'chat' && S.callSeconds < 75) patch.callSeconds = 90;
    if (mode === 'voice' && S.callSeconds > 90) patch.callSeconds = 60;
    setSetting(patch);
  };

  const start = async () => {
    unlockAudio();
    const res = await act('start');
    if (res.ok) play('ring');
  };

  const addBot = async () => {
    const res = await act('addBot');
    if (res.ok) play('boing');
  };

  const becomePlayer = async () => {
    const profile = prefs.profile?.name ? prefs.profile : { name: 'Halunke', avatar: AVATARS[0], color: COLORS[0] };
    const res = await joinRoom(view.code, profile);
    if (res.error) showError(res);
  };

  const slots = Math.min(view.limits.max, Math.max(view.limits.min, view.players.length + 1));
  const last = view.lastResults;
  const lastWinner = last?.ranking?.[0] && view.players.find((p) => p.id === last.ranking[0].id);
  const hasBots = view.players.some((p) => p.bot);

  return (
    <div className="lobby">
      <div className="lobby-col">
        <section className="panel invite">
          <div className="invite-text">
            <h2>{t('lobby.inviteTitle')}</h2>
            <p className="muted">{t('lobby.inviteText')}</p>
            <RoomCode code={view.code} big />
            <div className="invite-actions">
              <button type="button" className="btn btn-cyan" onClick={copyLink}>
                🔗 {t('lobby.copyLink')}
              </button>
            </div>
          </div>
          {qr && (
            <div className={`qr ${prefs.streamer ? 'is-blurred' : ''}`}>
              <img src={qr} alt={t('lobby.qrAlt')} width="150" height="150" />
            </div>
          )}
        </section>

        {lastWinner && (
          <div className="last-results">
            🏆 {t('lobby.lastWinner', { name: `${lastWinner.avatar} ${lastWinner.name}`, amount: money(last.ranking[0].score) })}
          </div>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>{t('lobby.staff')}</h2>
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
                    ✏️ {t('lobby.edit')}
                  </button>
                )}
                {isHost && p.id !== view.me?.id && (
                  <button
                    type="button"
                    className="kick-btn"
                    onClick={() => (p.bot || window.confirm(t('lobby.confirmKick', { name: p.name }))) && act('kick', { playerId: p.id })}
                    title={t('lobby.kick')}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, slots - view.players.length) }, (_, i) => (
              <div key={`empty-${i}`} className="player-card is-empty">
                <div className="empty-phone">📞</div>
                <div className="player-card-name muted">{t('lobby.free')}</div>
              </div>
            ))}
          </div>
          {isHost && (
            <div className="bot-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={addBot} disabled={view.players.length >= view.limits.max}>
                🤖 {t('lobby.addBot')}
              </button>
              <span className="muted small">{hasBots ? t('lobby.botsHint') : t('lobby.botsHintEmpty')}</span>
            </div>
          )}
        </section>
      </div>

      <div className="lobby-col">
        <section className="panel settings">
          <div className="panel-head">
            <h2>{t('lobby.settings')}</h2>
            {!isHost && <span className="pill pill-ghost">{t('lobby.hostOnly')}</span>}
          </div>

          <div className="mode-switch" role="radiogroup" aria-label={t('lobby.mode')}>
            {['voice', 'chat'].map((m) => (
              <button key={m} type="button" role="radio" aria-checked={S.callMode === m} className={`mode-btn ${S.callMode === m ? 'is-active' : ''}`} disabled={!isHost} onClick={() => setMode(m)}>
                <span className="mode-icon">{m === 'voice' ? '🎙️' : '💬'}</span>
                <span className="mode-title">{t(`lobby.mode.${m}`)}</span>
                <span className="mode-hint">{t(`lobby.mode.${m}.hint`)}</span>
              </button>
            ))}
          </div>

          <label className="setting-row">
            <span>{t('lobby.cardLang')}</span>
            <select value={S.lang} disabled={!isHost} onChange={(e) => setSetting({ lang: e.target.value })}>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </label>
          {SELECTS.map((s) => (
            <label key={s.key} className="setting-row">
              <span>{t(`lobby.setting.${s.key}`)}</span>
              <select value={S[s.key]} disabled={!isHost} onChange={(e) => setSetting({ [s.key]: Number(e.target.value) })}>
                {s.options.map((o) => (
                  <option key={o} value={o}>
                    {s.fmt(o, t, S.lang)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="toggle-grid">
            {TOGGLES.map((tg) => (
              <button
                key={tg.key}
                type="button"
                className={`toggle ${S[tg.key] ? 'is-on' : ''}`}
                disabled={!isHost}
                aria-pressed={S[tg.key]}
                onClick={() => setSetting({ [tg.key]: !S[tg.key] })}
              >
                <span className="toggle-label">
                  {tg.icon} {t(`lobby.toggle.${tg.key}`)}
                </span>
                <span className="toggle-hint">{t(`lobby.toggle.${tg.key}.hint`)}</span>
                <span className="toggle-switch" aria-hidden="true" />
              </button>
            ))}
          </div>
          <button type="button" className="custom-cards-btn" onClick={() => setCardsOpen(true)}>
            <span>✨ {t('lobby.customCards')}</span>
            <span className="muted small">
              {customTotal > 0 ? t('lobby.customCount', { maschen: view.custom.maschen, personas: view.custom.personas }) : t('lobby.customNone')}
              {S.customOnly && customTotal > 0 ? ` · ${t('lobby.customOnlyShort')}` : ''}
            </span>
          </button>
          <div className="estimate">⏱️ {t('lobby.estimate', { n: estimateMinutes(S, view.players.length) })}</div>
        </section>

        <section className="panel start-panel">
          {isHost ? (
            <>
              <button type="button" className="btn btn-yellow btn-xl" disabled={missing > 0} onClick={start}>
                🚀 {t('lobby.start')}
              </button>
              <div className="muted small center">{missing > 0 ? t('lobby.missing', { n: missing, min: view.limits.min }) : t('lobby.ready')}</div>
            </>
          ) : me ? (
            <div className="waiting">
              <div className="waiting-dots">
                <span />
                <span />
                <span />
              </div>
              {t('lobby.waitingFor', { name: host?.name || 'Host' })}
            </div>
          ) : (
            <>
              <div className="waiting">👀 {t('lobby.audienceInfo')}</div>
              <button type="button" className="btn btn-cyan" onClick={becomePlayer}>
                🎮 {t('lobby.joinInstead')}
              </button>
            </>
          )}
          <div className="voice-hint-box">{S.callMode === 'chat' ? `💬 ${t('lobby.tipChat')}` : `🎙️ ${t('lobby.tipVoice')}`}</div>
        </section>
      </div>

      {editing && me && <EditProfile me={me} onClose={() => setEditing(false)} />}
      {cardsOpen && <CustomCardsEditor onClose={() => setCardsOpen(false)} settings={S} isHost={isHost} />}
    </div>
  );
}

function EditProfile({ me, onClose }) {
  const t = useT();
  const [name, setName] = useState(me.name);
  const [avatar, setAvatar] = useState(me.avatar);
  const [color, setColor] = useState(me.color);
  const save = async () => {
    const res = await act('profile', { name, avatar, color });
    if (res.ok) onClose();
  };
  return (
    <Modal title={t('lobby.editTitle')} onClose={onClose}>
      <ProfileEditor name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} color={color} setColor={setColor} onEnter={save} />
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn btn-yellow" onClick={save}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
