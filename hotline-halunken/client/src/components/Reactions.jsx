import { react } from '../lib/net.js';

export const REACTIONS = ['😂', '💀', '🤡', '🔥', '😱', '👏', '🚨', '💸', '🤔', '❤️'];

export function ReactionBar({ compact = false }) {
  return (
    <div className={`reaction-bar ${compact ? 'is-compact' : ''}`} role="group" aria-label="Reaktionen">
      {REACTIONS.map((e) => (
        <button key={e} type="button" className="reaction-btn" onClick={() => react(e)} aria-label={`Reaktion ${e}`}>
          {e}
        </button>
      ))}
    </div>
  );
}
