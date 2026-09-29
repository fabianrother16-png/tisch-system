import { euro, useCountUp } from '../lib/hooks.js';
import { Avatar } from '../components/Avatar.jsx';
import { MascheCard } from '../components/Cards.jsx';
import { TimerBar } from '../components/Timer.jsx';
import { ReactionBar } from '../components/Reactions.jsx';

const HEADLINES = {
  hangup: { icon: '📵', text: 'AUFGELEGT!', cls: 'is-red' },
  timeout: { icon: '⏰', text: 'Zeit ist um!', cls: 'is-yellow' },
  skipped: { icon: '⏭️', text: 'Übersprungen', cls: 'is-ghost' },
};

export function CallSummary({ view }) {
  const g = view.game;
  const call = g.call;
  const byId = (id) => view.players.find((p) => p.id === id);
  const caller = byId(call.callerId);
  const head = HEADLINES[call.endReason] || HEADLINES.timeout;
  const loot = useCountUp(call.transferred, 1200);
  const nextId = g.callOrder[call.index + 1];
  const next = nextId ? byId(nextId) : null;

  return (
    <div className="summary">
      <div className={`summary-head ${head.cls}`}>
        <span className="summary-icon">{head.icon}</span>
        <span>{head.text}</span>
      </div>
      <div className="summary-body">
        <div className="summary-caller">
          <Avatar player={caller} size="xl" />
          <div className="summary-name">{caller?.name}</div>
          <div className={`summary-loot ${call.transferred > 0 ? 'is-rich' : 'is-broke'}`}>
            {call.transferred > 0 ? `+${euro(loot)}` : '0 € 😬'}
          </div>
          <div className="muted small">Vertrauen am Ende: {call.trust} %</div>
        </div>
        <div className="summary-masche">{call.masche && <MascheCard masche={call.masche} revealed compact />}</div>
      </div>
      <div className="summary-next">
        {next ? (
          <>
            Nächster Anruf: <b>{next.avatar} {next.name}</b>
          </>
        ) : g.hasCop ? (
          <b>Gleich: 🚨 RAZZIA!</b>
        ) : (
          <b>Gleich: Schichtende!</b>
        )}
      </div>
      <TimerBar endsAt={view.phaseEndsAt} timerKey={`summary:${g.round}:${call.index}`} />
      <ReactionBar compact />
    </div>
  );
}
