import { act } from '../lib/net.js';
import { play } from '../lib/sound.js';
import { money, useT } from '../lib/i18n.js';
import { Avatar } from '../components/Avatar.jsx';
import { MascheCard, PersonaCard, VoiceCard } from '../components/Cards.jsx';
import { Timer } from '../components/Timer.jsx';

export function Roles({ view }) {
  const t = useT();
  const g = view.game;
  const byId = (id) => view.players.find((p) => p.id === id);
  const victim = byId(g.victimId);
  const role = g.myRole;
  const card = g.myCard;
  const chat = view.settings.callMode === 'chat';

  const choose = (id) => {
    play('pop');
    act('choose', { mascheId: id });
  };

  return (
    <div className="roles">
      <div className="screen-head">
        <div>
          <div className="eyebrow">{t('common.roundOf', { round: g.round, total: g.totalRounds })}</div>
          <h1 className="screen-title">{t('roles.title')}</h1>
        </div>
        <Timer endsAt={view.phaseEndsAt} timerKey={`roles:${g.round}`} />
      </div>

      <div className="roles-grid">
        <div className="roles-main">
          {role === 'victim' && (
            <div className="role-banner role-victim">
              <div className="role-title">🎯 {t('roles.victim.title')}</div>
              <p>{t(chat ? 'roles.victim.textChat' : 'roles.victim.text', { name: g.persona.name, amount: money(g.budget) })}</p>
              <p className="muted small">{t('roles.victim.note')}</p>
              {!g.victimReady ? (
                <button type="button" className="btn btn-yellow btn-lg" onClick={() => act('ready')}>
                  ✅ {t('roles.victim.ready')}
                </button>
              ) : (
                <div className="ready-note">✅ {t('roles.victim.waiting')}</div>
              )}
            </div>
          )}

          {(role === 'caller' || role === 'cop') && card && (
            <>
              {role === 'cop' ? (
                <div className="role-banner role-cop">
                  <div className="role-title">🚔 {t('roles.cop.title')}</div>
                  <p>{card.copRule}</p>
                  <p className="muted small">{t('roles.cop.note')}</p>
                </div>
              ) : (
                <div className="role-banner role-caller">
                  <div className="role-title">😈 {t('roles.caller.title')}</div>
                  <p>{t(chat ? 'roles.caller.textChat' : 'roles.caller.text', { name: g.persona.name })}</p>
                </div>
              )}
              <h3 className="section-title">{role === 'cop' ? t('roles.chooseCover') : t('roles.choose')}</h3>
              <div className="masche-choices">
                {card.options.map((m) => (
                  <MascheCard key={m.id} masche={m} selected={card.mascheId === m.id} onSelect={() => choose(m.id)} />
                ))}
              </div>
              {card.voice && <VoiceCard voice={card.voice} chat={chat} />}
            </>
          )}

          {role === 'break' && (
            <div className="role-banner role-break">
              <div className="role-title">☕ {t('roles.break.title')}</div>
              <p>{t('roles.break.text')}</p>
            </div>
          )}

          {role === 'audience' && (
            <div className="role-banner role-break">
              <div className="role-title">👀 {t('roles.audience.title')}</div>
              <p>{t('roles.audience.text')}</p>
            </div>
          )}
        </div>

        <aside className="roles-side">
          <PersonaCard persona={g.persona} player={victim} budget={g.budget} />
          <div className="panel ready-list">
            <h3>{t('roles.order')}</h3>
            <ol>
              {g.callOrder.map((id) => {
                const p = byId(id);
                const done = g.chosen.includes(id);
                return (
                  <li key={id} className={done ? 'is-done' : ''}>
                    <Avatar player={p} size="sm" headset={false} />
                    <span>{p?.name}</span>
                    {g.voices[id] && (
                      <span className="voice-mini" title={g.voices[id].text}>
                        {g.voices[id].emoji}
                      </span>
                    )}
                    <span className="ready-mark">{done ? '✔' : '…'}</span>
                  </li>
                );
              })}
            </ol>
            <div className={`victim-ready ${g.victimReady ? 'is-done' : ''}`}>
              {victim?.avatar} {victim?.name} ({t('roles.victimShort')}): {g.victimReady ? `✔ ${t('roles.isReady')}` : t('roles.reading')}
            </div>
          </div>
        </aside>
      </div>
      {g.tip && <div className="tip">{g.tip}</div>}
    </div>
  );
}
