import { useEffect, useRef, useState } from 'react';
import { act, useStore } from './lib/net.js';
import { announce, audioLocked, play, stopHoldMusic, unlockAudio } from './lib/sound.js';
import { t as translateNow, useT } from './lib/i18n.js';
import { usePrefs } from './lib/prefs.js';
import { TopBar } from './components/TopBar.jsx';
import { VoiceBar } from './components/VoiceBar.jsx';
import { FxLayer, ReactionLayer, Toasts } from './components/FxLayer.jsx';
import { Modal, Rules } from './components/Modal.jsx';
import { Home } from './screens/Home.jsx';
import { Lobby } from './screens/Lobby.jsx';
import { Roles } from './screens/Roles.jsx';
import { Call } from './screens/Call.jsx';
import { CallSummary } from './screens/CallSummary.jsx';
import { RazziaReveal, RazziaVote } from './screens/Razzia.jsx';
import { GameOver, RoundResults } from './screens/Results.jsx';

// Sounds und Ansagen bei Phasenwechseln.
function usePhaseEffects(view) {
  const key = view ? `${view.code}:${view.phase}:${view.game?.round ?? ''}:${view.game?.callIndex ?? ''}` : 'home';
  const prev = useRef(null);
  useEffect(() => {
    if (prev.current === key) return;
    const firstLoad = prev.current === null;
    prev.current = key;
    if (!view || firstLoad) return;
    const g = view.game;
    if (view.phase !== 'call') stopHoldMusic();
    switch (view.phase) {
      case 'roles':
        play('whoosh');
        announce(translateNow('say.round', { round: g.round, name: g.persona?.name }));
        break;
      case 'call':
        play('pickup');
        break;
      case 'razziaVote':
        play('siren');
        announce(translateNow('say.razzia'));
        break;
      case 'gameOver': {
        const top = g.ranking?.[0] && view.players.find((p) => p.id === g.ranking[0].id);
        if (top) announce(translateNow('say.gameOver', { name: top.name }));
        break;
      }
      default:
        break;
    }
  }, [key, view]);
}

function PauseOverlay({ isHost }) {
  const t = useT();
  return (
    <div className="pause-overlay">
      <div className="pause-box">
        <div className="pause-icon">⏸️</div>
        <div className="pause-title">{t('pause.title')}</div>
        <p>{t('pause.text')}</p>
        {isHost && (
          <button type="button" className="btn btn-yellow btn-lg" onClick={() => act('resume')}>
            ▶ {t('pause.resume')}
          </button>
        )}
      </div>
    </div>
  );
}

function SoundHint() {
  const t = useT();
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    setLocked(audioLocked());
    const unlock = () => {
      unlockAudio();
      setTimeout(() => setLocked(audioLocked()), 50);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  if (!locked) return null;
  return (
    <button type="button" className="sound-hint" onClick={() => unlockAudio()}>
      🔊 {t('app.soundHint')}
    </button>
  );
}

export default function App() {
  const t = useT();
  const { lang } = usePrefs();
  const { view } = useStore();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const [rules, setRules] = useState(false);
  usePhaseEffects(view);

  let screen;
  if (!view) screen = <Home onRules={() => setRules(true)} />;
  else {
    switch (view.phase) {
      case 'lobby':
        screen = <Lobby view={view} />;
        break;
      case 'roles':
        screen = <Roles view={view} />;
        break;
      case 'ring':
      case 'call':
        screen = view.game?.call ? <Call view={view} /> : null;
        break;
      case 'callSummary':
        screen = view.game?.call ? <CallSummary view={view} /> : null;
        break;
      case 'razziaVote':
        screen = <RazziaVote view={view} />;
        break;
      case 'razziaReveal':
        screen = <RazziaReveal view={view} />;
        break;
      case 'roundResults':
        screen = <RoundResults view={view} />;
        break;
      case 'gameOver':
        screen = <GameOver view={view} />;
        break;
      default:
        screen = null;
    }
  }

  const phaseKey = view ? `${view.phase === 'ring' ? 'call' : view.phase}:${view.game?.round ?? ''}:${view.game?.callIndex ?? ''}` : 'home';

  return (
    <div className={`app phase-${view?.phase || 'home'}`}>
      <TopBar onRules={() => setRules(true)} />
      <main className="screen" key={phaseKey}>
        {screen}
      </main>
      {view?.paused && <PauseOverlay isHost={view.me?.isHost} />}
      <FxLayer />
      <ReactionLayer />
      <Toasts />
      {view && <SoundHint />}
      <VoiceBar />
      {rules && (
        <Modal title={t('rules.title')} onClose={() => setRules(false)} wide>
          <Rules />
        </Modal>
      )}
    </div>
  );
}
