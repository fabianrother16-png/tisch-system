import { euro } from '../lib/hooks.js';

export function PersonaCard({ persona, player, budget, budgetLeft, compact = false, showSecret = true }) {
  if (!persona) return null;
  return (
    <div className={`card persona-card ${compact ? 'is-compact' : ''}`}>
      <div className="card-ribbon">🎯 DAS OPFER</div>
      <div className="persona-head">
        <div className="persona-emoji">{persona.emoji}</div>
        <div>
          <h3 className="persona-name">{persona.name}</h3>
          <div className="persona-age">{persona.age} Jahre alt</div>
          {player && (
            <div className="persona-player" style={{ '--c': player.color }}>
              gespielt von <b>{player.avatar} {player.name}</b>
            </div>
          )}
        </div>
      </div>
      {!compact && <p className="persona-bio">{persona.bio}</p>}
      <dl className="persona-facts">
        <div>
          <dt>💚 Mag</dt>
          <dd>{persona.likes}</dd>
        </div>
        <div>
          <dt>💢 Hasst</dt>
          <dd>{persona.hates}</dd>
        </div>
        {budget != null && (
          <div>
            <dt>💰 Erspartes</dt>
            <dd>
              {euro(budgetLeft ?? budget)} {persona.savings}
            </dd>
          </div>
        )}
      </dl>
      {showSecret && persona.secret && (
        <div className="persona-secret">
          <b>🤫 Dein Geheimnis:</b> {persona.secret}
        </div>
      )}
    </div>
  );
}

export function MascheCard({ masche, selected = false, onSelect, compact = false, revealed = false }) {
  if (!masche) return null;
  const Tag = onSelect ? 'button' : 'div';
  return (
    <Tag
      type={onSelect ? 'button' : undefined}
      className={`card masche-card ${selected ? 'is-selected' : ''} ${onSelect ? 'is-choice' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={onSelect}
    >
      <div className="card-ribbon ribbon-pink">{revealed ? '🕵️ DIE MASCHE WAR' : '😈 DEINE MASCHE'}</div>
      <div className="masche-head">
        <span className="masche-emoji">{masche.emoji}</span>
        <div>
          <h3 className="masche-title">{masche.title}</h3>
          <div className="masche-caller">📞 Du bist: <b>{masche.caller}</b></div>
        </div>
      </div>
      {!compact && <p className="masche-pitch">{masche.pitch}</p>}
      {!compact && masche.tips?.length > 0 && (
        <ul className="masche-tips">
          {masche.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      {selected && <div className="masche-check">✔ GEWÄHLT</div>}
    </Tag>
  );
}

export function VoiceCard({ voice, owner, small = false }) {
  if (!voice) return null;
  return (
    <div className={`voice-card ${small ? 'is-small' : ''}`}>
      <span className="voice-emoji">{voice.emoji}</span>
      <div>
        <div className="voice-label">🎭 PFLICHT-STIMME{owner ? ` von ${owner}` : ''}</div>
        <div className="voice-text">{voice.text}</div>
        <div className="voice-hint">{voice.hint}</div>
      </div>
    </div>
  );
}

export function ProofCard({ proof, from }) {
  if (!proof) return null;
  return (
    <div className={`proof proof-${proof.kind}`}>
      <div className="proof-inner">
        {from && <div className="proof-from">📎 Beweis von {from}</div>}
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
