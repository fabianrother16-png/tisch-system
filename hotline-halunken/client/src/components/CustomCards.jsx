import { useState } from 'react';
import { act, emitLocalFx } from '../lib/net.js';
import { setPrefs, usePrefs } from '../lib/prefs.js';
import { useT } from '../lib/i18n.js';
import { Modal } from './Modal.jsx';

const EMPTY = { maschen: [], personas: [] };

const FIELDS = {
  maschen: [
    { key: 'emoji', max: 4, short: true },
    { key: 'title', max: 40, required: true },
    { key: 'caller', max: 50 },
    { key: 'pitch', max: 220, required: true, area: true },
  ],
  personas: [
    { key: 'emoji', max: 4, short: true },
    { key: 'name', max: 30, required: true },
    { key: 'age', max: 12, short: true },
    { key: 'bio', max: 140, required: true, area: true },
    { key: 'likes', max: 80 },
    { key: 'hates', max: 80 },
    { key: 'secret', max: 140 },
  ],
};

function normalize(data) {
  const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object').slice(0, 40) : []);
  return { maschen: list(data?.maschen), personas: list(data?.personas) };
}

// Editor für eigene Karten (Community-Karten). Wird lokal gespeichert und an den Raum geschickt.
export function CustomCardsEditor({ onClose, settings, isHost }) {
  const t = useT();
  const prefs = usePrefs();
  const [cards, setCards] = useState(() => normalize(prefs.customCards || EMPTY));
  const [tab, setTab] = useState('maschen');
  const [draft, setDraft] = useState({});
  const fields = FIELDS[tab];

  const add = () => {
    const entry = {};
    for (const f of fields) entry[f.key] = String(draft[f.key] || '').trim().slice(0, f.max);
    if (fields.some((f) => f.required && !entry[f.key])) {
      emitLocalFx({ type: 'toast', key: 'custom.missing', kind: 'error' });
      return;
    }
    setCards((c) => ({ ...c, [tab]: [...c[tab], entry].slice(0, 40) }));
    setDraft({});
  };

  const remove = (i) => setCards((c) => ({ ...c, [tab]: c[tab].filter((_, idx) => idx !== i) }));

  const save = async () => {
    setPrefs({ customCards: cards });
    if (isHost) {
      const res = await act('custom', cards);
      if (res.ok) emitLocalFx({ type: 'toast', key: 'custom.saved', vars: res.counts });
    }
    onClose();
  };

  const exportCards = async () => {
    const json = JSON.stringify(cards);
    try {
      await navigator.clipboard.writeText(json);
      emitLocalFx({ type: 'toast', key: 'custom.exported' });
    } catch {
      window.prompt(t('custom.copyPrompt'), json);
    }
  };

  const importCards = () => {
    const text = window.prompt(t('custom.importPrompt'));
    if (!text) return;
    try {
      setCards(normalize(JSON.parse(text)));
    } catch {
      emitLocalFx({ type: 'toast', key: 'custom.importError', kind: 'error' });
    }
  };

  return (
    <Modal title={`✨ ${t('custom.title')}`} onClose={onClose} wide>
      <p className="muted small custom-intro">{t('custom.intro')}</p>
      <div className="tabs" role="tablist">
        {['maschen', 'personas'].map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'is-active' : ''}`} onClick={() => { setTab(k); setDraft({}); }}>
            {t(`custom.tab.${k}`)} ({cards[k].length})
          </button>
        ))}
      </div>

      <ul className="custom-list">
        {cards[tab].length === 0 && <li className="muted small">{t('custom.empty')}</li>}
        {cards[tab].map((c, i) => (
          <li key={i}>
            <span className="custom-emoji">{c.emoji || (tab === 'maschen' ? '📞' : '🙂')}</span>
            <div className="custom-text">
              <b>{c.title || c.name}</b>
              <div className="small muted">{c.pitch || c.bio}</div>
            </div>
            <button type="button" className="kick-btn static" onClick={() => remove(i)} aria-label={t('custom.remove')}>
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="custom-form">
        {fields.map((f) => (
          <label key={f.key} className={`field ${f.short ? 'is-short' : ''} ${f.area ? 'is-wide' : ''}`}>
            <span>
              {t(`custom.field.${tab}.${f.key}`)}
              {f.required ? ' *' : ''}
            </span>
            {f.area ? (
              <textarea rows={3} maxLength={f.max} value={draft[f.key] || ''} placeholder={t(`custom.ph.${tab}.${f.key}`)} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
            ) : (
              <input maxLength={f.max} value={draft[f.key] || ''} placeholder={t(`custom.ph.${tab}.${f.key}`)} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
            )}
          </label>
        ))}
        <button type="button" className="btn btn-cyan" onClick={add}>
          ➕ {t('custom.add')}
        </button>
      </div>

      <div className="custom-options">
        {isHost && (
          <label className="check">
            <input type="checkbox" checked={!!settings.customOnly} onChange={(e) => act('settings', { customOnly: e.target.checked })} />
            {t('custom.only')}
          </label>
        )}
        <label className="check">
          <input type="checkbox" checked={!!prefs.autoCustom} onChange={(e) => setPrefs({ autoCustom: e.target.checked })} />
          {t('custom.auto')}
        </label>
      </div>

      <div className="modal-actions wrap">
        <button type="button" className="btn btn-ghost" onClick={importCards}>
          📥 {t('custom.import')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={exportCards}>
          📋 {t('custom.export')}
        </button>
        <button type="button" className="btn btn-yellow" onClick={save}>
          💾 {isHost ? t('custom.saveApply') : t('custom.save')}
        </button>
      </div>
    </Modal>
  );
}
