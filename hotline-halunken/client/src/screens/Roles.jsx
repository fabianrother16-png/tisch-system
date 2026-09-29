import { act } from '../lib/net.js';
import { play } from '../lib/sound.js';
import { euro } from '../lib/hooks.js';
import { Avatar } from '../components/Avatar.jsx';
import { MascheCard, PersonaCard, VoiceCard } from '../components/Cards.jsx';
import { Timer } from '../components/Timer.jsx';

export function Roles({ view }) {
  const g = view.game;
  const byId = (id) => view.players.find((p) => p.id === id);
  const victim = byId(g.victimId);
  const role = g.myRole;
  const card = g.myCard;

  const choose = (id) => {
    play('pop');
    act('choose', { mascheId: id });
  };

  return (
    <div className="roles">
      <div className="screen-head">
        <div>
          <div className="eyebrow">Runde {g.round} von {g.totalRounds}</div>
          <h1 className="screen-title">Schichtbeginn!</h1>
        </div>
        <Timer endsAt={view.phaseEndsAt} timerKey={`roles:${g.round}`} />
      </div>

      <div className="roles-grid">
        <div className="roles-main">
          {role === 'victim' && (
            <div className="role-banner role-victim">
              <div className="role-title">🎯 DU BIST DAS OPFER</div>
              <p>
                Gleich klingelt dein Telefon. Spiel <b>{g.persona.name}</b> so gut du kannst! Du hast <b>{euro(g.budget)}</b>: Überweise
                live an die Halunken, die dich am besten unterhalten. Nervt dich jemand? <b>AUFLEGEN!</b>
              </p>
              <p className="muted small">Geld, das du am Ende der Runde noch hast, verfällt – also verteil es!</p>
              {!g.victimReady ? (
                <button type="button" className="btn btn-yellow btn-lg" onClick={() => act('ready')}>
                  ✅ Bin bereit – lasst es klingeln!
                </button>
              ) : (
                <div className="ready-note">✅ Bereit! Warte auf die Halunken …</div>
              )}
            </div>
          )}

          {(role === 'caller' || role === 'cop') && card && (
            <>
              {role === 'cop' ? (
                <div className="role-banner role-cop">
                  <div className="role-title">🚔 PSST … DU BIST DER UNDERCOVER-COP!</div>
                  <p>{card.copRule}</p>
                  <p className="muted small">Alles, was das Opfer dir überweist, gilt als „sichergestellt“ und zählt für dich.</p>
                </div>
              ) : (
                <div className="role-banner role-caller">
                  <div className="role-title">😈 DU BIST EIN HALUNKE</div>
                  <p>
                    Ruf {g.persona.name} an und zock so viel ab wie möglich. Aber Vorsicht: Einer der anderen Anrufer könnte ein
                    Undercover-Cop sein …
                  </p>
                </div>
              )}
              <h3 className="section-title">{role === 'cop' ? 'Wähle deine Tarn-Masche:' : 'Wähle deine Masche:'}</h3>
              <div className="masche-choices">
                {card.options.map((m) => (
                  <MascheCard key={m.id} masche={m} selected={card.mascheId === m.id} onSelect={() => choose(m.id)} />
                ))}
              </div>
              {card.voice && <VoiceCard voice={card.voice} />}
            </>
          )}

          {role === 'break' && (
            <div className="role-banner role-break">
              <div className="role-title">☕ KAFFEEPAUSE</div>
              <p>Du rufst in dieser Runde nicht an. Hör gut zu, reagier mit Emojis – und bei der Razzia zählt deine Stimme!</p>
            </div>
          )}

          {role === 'audience' && (
            <div className="role-banner role-break">
              <div className="role-title">👀 DIE HALUNKEN MACHEN SICH BEREIT</div>
              <p>Gleich geht’s los. Reagiere während der Anrufe mit Emojis und tippe bei der Razzia, wer der Cop ist!</p>
            </div>
          )}
        </div>

        <aside className="roles-side">
          <PersonaCard persona={g.persona} player={victim} budget={g.budget} />
          <div className="panel ready-list">
            <h3>Anruf-Reihenfolge</h3>
            <ol>
              {g.callOrder.map((id) => {
                const p = byId(id);
                const done = g.chosen.includes(id);
                return (
                  <li key={id} className={done ? 'is-done' : ''}>
                    <Avatar player={p} size="sm" headset={false} />
                    <span>{p?.name}</span>
                    {g.voices[id] && <span className="voice-mini" title={g.voices[id].text}>{g.voices[id].emoji}</span>}
                    <span className="ready-mark">{done ? '✔' : '…'}</span>
                  </li>
                );
              })}
            </ol>
            <div className={`victim-ready ${g.victimReady ? 'is-done' : ''}`}>
              {victim?.avatar} {victim?.name} (Opfer): {g.victimReady ? '✔ bereit' : 'liest die Rolle …'}
            </div>
          </div>
        </aside>
      </div>
      {g.tip && <div className="tip">{g.tip}</div>}
    </div>
  );
}
