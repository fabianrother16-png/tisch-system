import { useEffect } from 'react';
import { act } from '../lib/net.js';
import { announce, play } from '../lib/sound.js';
import { useSince } from '../lib/hooks.js';
import { money, t as translateNow, useT } from '../lib/i18n.js';
import { Avatar, PlayerChip } from '../components/Avatar.jsx';
import { Timer } from '../components/Timer.jsx';

export function RazziaVote({ view }) {
  const t = useT();
  const g = view.game;
  const byId = (id) => view.players.find((p) => p.id === id);
  const voting = g.voting || { voted: [], myVote: null, audienceVotes: 0 };
  const isAudience = !view.me;
  const bonus = Math.round(g.budget * 0.15);
  const chat = view.settings.callMode === 'chat';

  const vote = (id) => {
    play('pop');
    act('vote', { suspectId: id });
  };

  return (
    <div className="razzia">
      <div className="razzia-lights" aria-hidden="true" />
      <div className="screen-head">
        <div>
          <div className="eyebrow">{t('razzia.eyebrow', { round: g.round })}</div>
          <h1 className="screen-title razzia-title">🚨 {t('razzia.title')} 🚨</h1>
        </div>
        <Timer endsAt={view.phaseEndsAt} timerKey={`vote:${g.round}`} tickFrom={5} />
      </div>
      <p className="razzia-lead">
        {t(chat ? 'razzia.leadChat' : 'razzia.lead')} {isAudience ? t('razzia.audienceTip') : t('razzia.bonus', { amount: money(bonus) })}
        <br />
        <span className="muted">{t('razzia.warning')}</span>
      </p>
      <div className="suspect-grid">
        {g.callOrder.map((id) => {
          const p = byId(id);
          const call = g.calls.find((c) => c.callerId === id);
          const isMe = id === view.me?.id;
          const chosen = voting.myVote === id;
          return (
            <button key={id} type="button" className={`suspect-card ${chosen ? 'is-chosen' : ''}`} disabled={isMe} onClick={() => vote(id)} style={{ '--c': p?.color }}>
              <Avatar player={p} size="lg" />
              <div className="suspect-name">
                {p?.name}
                {isMe ? ` ${t('common.you')}` : ''}
              </div>
              {call?.masche && (
                <div className="suspect-masche">
                  {call.masche.emoji} {call.masche.title}
                </div>
              )}
              <div className="suspect-loot">{t('razzia.loot', { amount: money(g.earnings[id] || 0) })}</div>
              {chosen && <div className="suspect-stamp">{t('razzia.suspect')}</div>}
            </button>
          );
        })}
      </div>
      <div className="voters">
        {view.players
          .filter((p) => p.connected)
          .map((p) => (
            <PlayerChip key={p.id} player={p} you={p.id === view.me?.id} youLabel={t('common.you')}>
              <span className="voter-state">{voting.voted.includes(p.id) ? '✔' : '…'}</span>
            </PlayerChip>
          ))}
        {voting.audienceVotes > 0 && <span className="pill pill-ghost">👀 {t('razzia.audienceVotes', { n: voting.audienceVotes })}</span>}
      </div>
    </div>
  );
}

export function RazziaReveal({ view }) {
  const t = useT();
  const g = view.game;
  const z = g.razzia;
  const byId = (id) => view.players.find((p) => p.id === id);
  const elapsed = useSince(`reveal:${g.round}`);
  const arrested = z?.arrestedId ? byId(z.arrestedId) : null;
  const cop = byId(z?.copId);
  const maxVotes = Math.max(1, ...Object.values(z?.tally || {}));
  const stage = elapsed < 2600 ? 0 : elapsed < 5000 ? 1 : elapsed < 6600 ? 2 : 3;

  useEffect(() => {
    play('drumroll', 2.4);
    const t1 = setTimeout(() => {
      if (z?.caught) {
        play('siren');
        announce(translateNow('say.wasCop', { name: arrested?.name }));
      } else {
        play('sad');
        announce(arrested ? translateNow('say.wasNotCop', { name: arrested.name }) : translateNow('say.noMajority'));
      }
    }, 5000);
    const t2 = setTimeout(() => {
      if (z?.caught) play('fanfare');
      else play('siren');
    }, 6600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // Nur einmal pro Aufdeckung abspielen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.round]);

  if (!z) return null;
  const audienceTop = Object.entries(z.audienceTally || {}).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="reveal">
      <div className={`razzia-lights ${stage >= 2 ? (z.caught ? 'is-win' : 'is-fail') : ''}`} aria-hidden="true" />
      <h1 className="screen-title center">{stage === 0 ? t('reveal.counting') : t('reveal.verdict')}</h1>

      <div className="tally">
        {g.callOrder.map((id) => {
          const p = byId(id);
          const votes = z.tally[id] || 0;
          return (
            <div key={id} className={`tally-row ${stage >= 1 && id === z.arrestedId ? 'is-arrested' : ''}`}>
              <Avatar player={p} size="sm" headset={false} />
              <span className="tally-name">{p?.name}</span>
              <div className="tally-bar">
                <div className="tally-fill" style={{ width: `${(votes / maxVotes) * 100}%`, background: p?.color }} />
              </div>
              <span className="tally-count">{votes}</span>
            </div>
          );
        })}
      </div>

      {stage >= 1 && (
        <div className="verdict">
          {arrested ? (
            <div className="mugshot">
              <div className="mugshot-lines" aria-hidden="true" />
              <Avatar player={arrested} size="xl" headset={false} />
              <div className="mugshot-plate">{t('reveal.arrested', { name: arrested.name })}</div>
            </div>
          ) : (
            <div className="verdict-none">🤷 {t('reveal.noMajority')}</div>
          )}
          {stage >= 2 && arrested && <div className={`verdict-text ${z.caught ? 'is-win' : 'is-fail'}`}>{z.caught ? `${t('reveal.wasCop')} 🚔` : `${t('reveal.wasNotCop')} 😬`}</div>}
        </div>
      )}

      {stage >= 3 && (
        <div className="consequences">
          {z.caught ? (
            <div className="conseq">
              🕵️ {t('reveal.correct')}{' '}
              {z.correct.length ? z.correct.map((id) => <PlayerChip key={id} player={byId(id)} />) : <i>{t('reveal.nobody')}</i>}
              {z.correct.length > 0 && <b> {t('reveal.each', { amount: money(z.voterBonus) })}</b>}
            </div>
          ) : (
            <>
              <div className="conseq conseq-cop">
                🚔 {t('reveal.realCop')} <PlayerChip player={cop} /> {t('reveal.escaped')} <b>+{money(z.copBonus)}</b> {t('reveal.escapeBonus')}
              </div>
              {z.confiscated && (
                <div className="conseq conseq-bad">
                  🧾 {t('reveal.confiscated')} <b>{money(z.confiscated.amount)}</b> {t('reveal.from')} <PlayerChip player={byId(z.confiscated.fromId)} />
                </div>
              )}
              {z.correct.length > 0 && (
                <div className="conseq">
                  🕵️ {t('reveal.stillCorrect')} {z.correct.map((id) => <PlayerChip key={id} player={byId(id)} />)} <b>{t('reveal.each', { amount: money(z.voterBonus) })}</b>
                </div>
              )}
            </>
          )}
          {audienceTop && (
            <div className="conseq conseq-audience">
              👀{' '}
              {t('reveal.audienceTip', {
                name: byId(audienceTop[0])?.name,
                pct: Math.round((audienceTop[1] / Math.max(1, z.audienceTotal)) * 100),
              })}{' '}
              {audienceTop[0] === z.copId ? `– ${t('reveal.audienceRight')} 🎉` : `– ${t('reveal.audienceWrong')}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
