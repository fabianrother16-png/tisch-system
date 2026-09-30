import { useStore } from '../lib/net.js';
import { useT } from '../lib/i18n.js';
import { DEMO } from '../lib/demo.js';
import { joinVoice, leaveVoice, resumePlayback, setMicMuted, useVoice } from '../lib/voice.js';
import { unlockAudio } from '../lib/sound.js';

// Schwebende Leiste für den Browser-Sprachchat (unten links).
export function VoiceBar() {
  const t = useT();
  const { view } = useStore();
  const voice = useVoice();
  if (DEMO || !view?.me) return null;

  const others = view.players.filter((p) => p.id !== view.me.id && p.connected && p.voice && p.voice !== 'off');
  const connected = Object.values(voice.peers).filter((s) => s === 'connected').length;
  const connecting = Object.values(voice.peers).filter((s) => s === 'new' || s === 'connecting').length;

  if (voice.status !== 'on') {
    return (
      <div className="voice-bar">
        <button
          type="button"
          className="voice-join"
          disabled={voice.status === 'connecting'}
          onClick={() => {
            unlockAudio();
            joinVoice();
          }}
        >
          🎙️ {voice.status === 'connecting' ? t('voice.connecting') : t('voice.join')}
          {others.length > 0 && <span className="voice-count">{t('voice.inChat', { n: others.length })}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="voice-bar is-on">
      {voice.mic ? (
        <button type="button" className={`voice-btn ${voice.muted ? 'is-muted' : ''}`} onClick={() => setMicMuted(!voice.muted)} title={voice.muted ? t('voice.unmute') : t('voice.mute')}>
          {voice.muted ? '🔇' : '🎙️'}
          <span className="voice-label">{voice.muted ? t('voice.muted') : t('voice.live')}</span>
        </button>
      ) : (
        <span className="voice-listen">🎧 {t('voice.listenOnly')}</span>
      )}
      <span className="voice-status" title={t('voice.connectedTip')}>
        👥 {connected}
        {connecting > 0 && <span className="voice-pending">+{connecting}</span>}
      </span>
      {voice.needsTap && (
        <button type="button" className="voice-btn" onClick={resumePlayback}>
          🔊 {t('voice.tapToHear')}
        </button>
      )}
      <button type="button" className="voice-btn voice-leave" onClick={() => leaveVoice()} title={t('voice.leave')}>
        📴
      </button>
    </div>
  );
}

// Kleines Symbol für den Sprachchat-Status eines Spielers.
export function VoiceIcon({ player }) {
  if (!player?.voice || player.voice === 'off') return null;
  const icon = player.voice === 'listen' ? '🎧' : player.muted ? '🔇' : '🎙️';
  return <span className="voice-icon">{icon}</span>;
}
