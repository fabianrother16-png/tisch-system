import { useSpeaking } from '../lib/voice.js';

export function Avatar({ player, size = 'md', crown = false, badge = null, dim = false, headset = true, className = '' }) {
  const talking = useSpeaking(player?.id);
  if (!player) return null;
  const offline = player.connected === false;
  return (
    <div
      className={`avatar avatar-${size} ${offline || dim ? 'is-dim' : ''} ${talking ? 'is-speaking' : ''} ${className}`}
      style={{ '--c': player.color }}
      title={player.name}
    >
      <span className="avatar-face">{player.avatar}</span>
      {headset && <span className="avatar-headset" aria-hidden="true" />}
      {crown && <span className="avatar-crown" aria-label="Host">👑</span>}
      {(badge || player.bot) && <span className="avatar-badge">{badge || '🤖'}</span>}
      {offline && <span className="avatar-offline">📴</span>}
    </div>
  );
}

export function PlayerChip({ player, you = false, youLabel = '', children }) {
  if (!player) return null;
  return (
    <span className="player-chip" style={{ '--c': player.color }}>
      <span className="player-chip-face">{player.avatar}</span>
      <span className="player-chip-name">
        {player.name}
        {you ? ` ${youLabel}` : ''}
      </span>
      {children}
    </span>
  );
}
