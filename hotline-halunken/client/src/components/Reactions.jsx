import { react } from '../lib/net.js';
import { useT } from '../lib/i18n.js';

export const REACTIONS = ['😂', '💀', '🤡', '🔥', '😱', '👏', '🚨', '💸', '🤔', '❤️'];

export function ReactionBar({ compact = false }) {
  const t = useT();
  return (
    <div className={`reaction-bar ${compact ? 'is-compact' : ''}`} role="group" aria-label={t('reactions.label')}>
      {REACTIONS.map((e) => (
        <button key={e} type="button" className="reaction-btn" onClick={() => react(e)} aria-label={t('reactions.one', { emoji: e })}>
          {e}
        </button>
      ))}
    </div>
  );
}
