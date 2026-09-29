import { money, useT } from '../lib/i18n.js';

export function PersonaCard({ persona, player, budget, budgetLeft, compact = false, showSecret = true }) {
  const t = useT();
  if (!persona) return null;
  return (
    <div className={`card persona-card ${compact ? 'is-compact' : ''}`}>
      <div className="card-ribbon">🎯 {t('card.victim')}</div>
      <div className="persona-head">
        <div className="persona-emoji">{persona.emoji}</div>
        <div>
          <h3 className="persona-name">{persona.name}</h3>
          <div className="persona-age">{t('card.age', { age: persona.age })}</div>
          {player && (
            <div className="persona-player" style={{ '--c': player.color }}>
              {t('card.playedBy')} <b>{player.avatar} {player.name}</b>
            </div>
          )}
        </div>
      </div>
      {!compact && <p className="persona-bio">{persona.bio}</p>}
      <dl className="persona-facts">
        <div>
          <dt>💚 {t('card.likes')}</dt>
          <dd>{persona.likes}</dd>
        </div>
        <div>
          <dt>💢 {t('card.hates')}</dt>
          <dd>{persona.hates}</dd>
        </div>
        {budget != null && (
          <div>
            <dt>💰 {t('card.savings')}</dt>
            <dd>
              {money(budgetLeft ?? budget)} {persona.savings}
            </dd>
          </div>
        )}
      </dl>
      {showSecret && persona.secret && (
        <div className="persona-secret">
          <b>🤫 {t('card.secret')}</b> {persona.secret}
        </div>
      )}
      {persona.custom && <div className="custom-tag">✨ {t('card.custom')}</div>}
    </div>
  );
}

export function MascheCard({ masche, selected = false, onSelect, compact = false, revealed = false }) {
  const t = useT();
  if (!masche) return null;
  const Tag = onSelect ? 'button' : 'div';
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      className={`card masche-card ${selected ? 'is-selected' : ''} ${onSelect ? 'is-choice' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={onSelect}
    >
      <div className="card-ribbon ribbon-pink">{revealed ? `🕵️ ${t('card.scamWas')}` : `😈 ${t('card.yourScam')}`}</div>
      <div className="masche-head">
        <span className="masche-emoji">{masche.emoji}</span>
        <div>
          <h3 className="masche-title">{masche.title}</h3>
          <div className="masche-caller">
            📞 {t('card.youAre')} <b>{masche.caller}</b>
          </div>
        </div>
      </div>
      {!compact && <p className="masche-pitch">{masche.pitch}</p>}
      {!compact && masche.tips?.length > 0 && (
        <ul className="masche-tips">
          {masche.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {selected && <div className="masche-check">✔ {t('card.chosen')}</div>}
      {masche.custom && <div className="custom-tag">✨ {t('card.custom')}</div>}
    </Tag>
  );
}

export function VoiceCard({ voice, owner, small = false, chat = false }) {
  const t = useT();
  if (!voice) return null;
  return (
    <div className={`voice-card ${small ? 'is-small' : ''}`}>
      <span className="voice-emoji">{voice.emoji}</span>
      <div>
        <div className="voice-label">
          🎭 {chat ? t('card.voiceChat') : t('card.voice')}
          {owner ? ` ${t('card.voiceOf', { name: owner })}` : ''}
        </div>
        <div className="voice-text">{voice.text}</div>
        <div className="voice-hint">{voice.hint}</div>
      </div>
    </div>
  );
}

export function ProofCard({ proof, from }) {
  const t = useT();
  if (!proof) return null;
  return (
    <div className={`proof proof-${proof.kind}`}>
      <div className="proof-inner">
        {from && <div className="proof-from">📎 {t('card.proofFrom', { name: from })}</div>}
        <div className="proof-title">{proof.title}</div>
        <div className="proof-lines">
          {proof.lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        <div className="proof-stamp">{proof.stamp}</div>
      </div>
    </div>
  );
}
