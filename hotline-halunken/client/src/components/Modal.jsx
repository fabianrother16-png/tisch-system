import { useEffect } from 'react';
import { useT } from '../lib/i18n.js';

export function Modal({ title, onClose, children, wide = false }) {
  const t = useT();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: '🎯', key: 'victim' },
  { icon: '😈', key: 'scammers' },
  { icon: '📞', key: 'calls' },
  { icon: '💬', key: 'chat' },
  { icon: '⚡', key: 'chaos' },
  { icon: '🚔', key: 'cop' },
  { icon: '🏆', key: 'win' },
];

export function Rules() {
  const t = useT();
  return (
    <div className="rules">
      <p className="rules-lead">{t('rules.lead')}</p>
      <ol className="rules-steps">
        {STEPS.map((s) => (
          <li key={s.key}>
            <span className="rules-icon">{s.icon}</span>
            <div>
              <b>{t(`rules.${s.key}.title`)}</b> {t(`rules.${s.key}.text`)}
            </div>
          </li>
        ))}
      </ol>
      <div className="rules-tip">
        <b>{t('rules.streamerTitle')}</b> {t('rules.streamerText')}
      </div>
      <div className="rules-tip">
        <b>{t('rules.soloTitle')}</b> {t('rules.soloText')}
      </div>
      <p className="rules-disclaimer">{t('rules.disclaimer')}</p>
    </div>
  );
}
