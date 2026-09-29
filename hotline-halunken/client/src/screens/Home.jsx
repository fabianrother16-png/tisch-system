import { useState } from 'react';
import { clearNotice, createRoom, joinRoom, spectate, useStore } from '../lib/net.js';
import { setPrefs, usePrefs } from '../lib/prefs.js';
import { LANGUAGES, setLang, useT } from '../lib/i18n.js';
import { play, unlockAudio } from '../lib/sound.js';

export const AVATARS = ['🦊', '🐸', '🐷', '🐵', '🐔', '🦄', '🐙', '🐼', '🐯', '🐻', '🐨', '🦁', '🐺', '🦝', '🐧', '🦉', '🐹', '🐮', '🦆', '🐲', '👽', '🤖', '🤡', '👻'];
export const COLORS = ['#FF4F8B', '#FFD23F', '#3DDCFF', '#3CF08C', '#B57BFF', '#FF8A3D', '#FF5A5A', '#2EC4B6', '#F9A8FF', '#A3E635', '#60A5FA', '#FDBA74'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function ProfileEditor({ name, setName, avatar, setAvatar, color, setColor, onEnter }) {
  const t = useT();
  return (
    <div className="badge-card">
      <div className="badge-top">
        <span>HALUNKEN GMBH</span>
        <span className="badge-sub">{t('profile.badge')}</span>
      </div>
      <div className="badge-body">
        <div className="badge-photo" style={{ '--c': color }}>
          <span>{avatar}</span>
        </div>
        <div className="badge-fields">
          <label className="field">
            <span>{t('profile.name')}</span>
            <input
              value={name}
              maxLength={16}
              placeholder={t('profile.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
              autoComplete="nickname"
            />
          </label>
          <div className="badge-meta">{t('profile.meta')}</div>
        </div>
      </div>
      <div className="picker" role="radiogroup" aria-label={t('profile.avatar')}>
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
      <div className="swatches" role="radiogroup" aria-label={t('profile.color')}>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === color}
            aria-label={t('profile.colorOne', { color: c })}
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
  const t = useT();
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
      setError(t('home.needName'));
      return;
    }
    setBusy(true);
    setError(null);
    setPrefs({ profile });
    const res = await fn();
    setBusy(false);
    if (res.error) {
      setError(res.local ? t(`err.${res.code}`) : res.error);
      setCanSpectate(!!res.canSpectate);
      play('buzzer');
    } else {
      play('pickup');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  const join = () => {
    if (code.length !== 4) {
      setError(t('home.codeLength'));
      return;
    }
    run(() => joinRoom(code, profile));
  };

  const watch = async () => {
    unlockAudio();
    if (code.length !== 4) {
      setError(t('home.codeToWatch'));
      return;
    }
    setBusy(true);
    const res = await spectate(code, name.trim());
    setBusy(false);
    if (res.error) setError(res.local ? t(`err.${res.code}`) : res.error);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="lang-switch" role="group" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button key={l.id} type="button" className={`lang-btn ${prefs.lang === l.id ? 'is-active' : ''}`} onClick={() => setLang(l.id)}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>
        <div className="hero-phone" aria-hidden="true">☎️</div>
        <h1 className="logo">
          <span className="logo-top">HOTLINE</span>
          <span className="logo-bottom">HALUNKEN</span>
        </h1>
        <p className="hero-tag">
          {t('home.tagline')} <b>{t('home.taglineBold')}</b>
        </p>
        <div className="hero-badges">
          <span>👥 {t('home.badgePlayers')}</span>
          <span>🎙️ {t('home.badgeVoice')}</span>
          <span>💬 {t('home.badgeChat')}</span>
          <span>👀 {t('home.badgeAudience')}</span>
          <span>🤖 {t('home.badgeBots')}</span>
        </div>
      </section>

      <section className="home-main">
        <ProfileEditor
          name={name}
          setName={setName}
          avatar={avatar}
          setAvatar={setAvatar}
          color={color}
          setColor={setColor}
          onEnter={() => (code.length === 4 ? join() : run(() => createRoom(profile)))}
        />

        <div className="home-actions">
          {(notice || error) && <div className="alert">{error || t(`notice.${notice}`)}</div>}
          {resuming && <div className="alert alert-info">{t('home.resuming')}</div>}
          <button type="button" className="btn btn-yellow btn-xl" disabled={busy || !connected} onClick={() => run(() => createRoom(profile))}>
            📞 {t('home.create')}
          </button>
          <div className="or">
            <span>{t('home.orJoin')}</span>
          </div>
          <div className="join-row">
            <input
              className="code-input"
              value={code}
              placeholder="CODE"
              maxLength={4}
              aria-label={t('home.codeLabel')}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && join()}
            />
            <button type="button" className="btn btn-cyan" disabled={busy || !connected} onClick={join}>
              {t('home.join')}
            </button>
          </div>
          <button type="button" className={`btn btn-ghost ${canSpectate ? 'is-pulse' : ''}`} disabled={busy || !connected} onClick={watch}>
            👀 {t('home.watch')}
          </button>
          {!connected && <div className="muted small">{t('home.connecting')}</div>}
          <button type="button" className="link-btn" onClick={onRules}>
            ❓ {t('home.howTo')}
          </button>
        </div>
      </section>

      <section className="how">
        {['victim', 'call', 'hangup', 'razzia'].map((k, i) => (
          <div key={k} className="how-step">
            <span>{['🎯', '📞', '📵', '🚔'][i]}</span>
            <b>{t(`home.how.${k}.title`)}</b>
            <p>{t(`home.how.${k}.text`)}</p>
          </div>
        ))}
      </section>

      <footer className="home-foot">{t('home.footer')}</footer>
    </div>
  );
}
