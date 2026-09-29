import { useCountUp } from '../lib/hooks.js';
import { money, useT } from '../lib/i18n.js';
import { Avatar } from '../components/Avatar.jsx';
import { MascheCard } from '../components/Cards.jsx';
import { TimerBar } from '../components/Timer.jsx';
import { ReactionBar } from '../components/Reactions.jsx';

const HEADLINES = {
  hangup: { icon: '📵', key: 'summary.hangup', cls: 'is-red' },
  timeout: { icon: '⏰', key: 'summary.timeout', cls: 'is-yellow' },
  skipped: { icon: '⏭️', key: 'summary.skipped', cls: 'is-ghost' },
};

export function CallSummary({ view }) {
  const t = useT();
  const g = view.game;
  const call = g.call;
  const byId = (id) => view.players.find((p) => p.id === id);
  const caller = byId(call.callerId);
  const head = HEADLINES[call.endReason] || HEADLINES.timeout;
  const loot = useCountUp(call.transferred, 1200);
  const nextId = g.callOrder[call.index + 1];
  const next = nextId ? byId(nextId) : null;
  const lastChat = view.settings.callMode === 'chat' ? (call.messages || []).filter((m) => m.from !== 'system').slice(-3) : [];

  return (
    <div className="summary">
      <div className={`summary-head ${head.cls}`}>
        <span className="summary-icon">{head.icon}</span>
        <span>{t(head.key)}</span>
      </div>
      <div className="summary-body">
        <div className="summary-caller">
          <Avatar player={caller} size="xl" />
          <div className="summary-name">{caller?.name}</div>
          <div className={`summary-loot ${call.transferred > 0 ? 'is-rich' : 'is-broke'}`}>{call.transferred > 0 ? `+${money(loot)}` : `${money(0)} 😬`}</div>
          <div className="muted small">{t('summary.trust', { n: call.trust })}</div>
        </div>
        <div className="summary-masche">
          {call.masche && <MascheCard masche={call.masche} revealed compact />}
          {lastChat.length > 0 && (
            <div className="summary-chat">
              {lastChat.map((m) => (
                <div key={m.id} className={`bubble from-${m.from} ${m.from === 'victim' ? 'is-right' : 'is-left'}`} style={m.from === 'caller' ? { '--c': caller?.color } : undefined}>
                  <div className="bubble-text">{m.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="summary-next">
        {next ? (
          <>
            {t('summary.next')} <b>{next.avatar} {next.name}</b>
          </>
        ) : g.hasCop ? (
          <b>{t('summary.nextRazzia')}</b>
        ) : (
          <b>{t('summary.nextEnd')}</b>
        )}
      </div>
      <TimerBar endsAt={view.phaseEndsAt} timerKey={`summary:${g.round}:${call.index}`} />
      <ReactionBar compact />
    </div>
  );
}
