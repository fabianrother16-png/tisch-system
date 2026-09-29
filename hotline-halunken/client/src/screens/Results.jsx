import { useEffect, useMemo, useState } from 'react';
import { act } from '../lib/net.js';
import { play } from '../lib/sound.js';
import { euro, useCountUp } from '../lib/hooks.js';
import { downloadPoster } from '../lib/poster.js';
import { Avatar } from '../components/Avatar.jsx';
import { Timer } from '../components/Timer.jsx';
import { ReactionBar } from '../components/Reactions.jsx';

function ScoreRow({ p, rank, delta, star, isMe }) {
  const score = useCountUp(p.score, 1400);
  return (
    <li className={`score-row ${isMe ? 'is-me' : ''}`} style={{ '--c': p.color }}>
      <span className="score-rank">{rank}</span>
      <Avatar player={p} size="sm" headset={false} />
      <span className="score-name">
        {p.name}
        {star && <span className="score-star"> ⭐ Halunke der Runde</span>}
      </span>
      {delta != null && delta !== 0 && <span className={`score-delta ${delta > 0 ? 'is-plus' : 'is-minus'}`}>{delta > 0 ? '+' : ''}{euro(delta)}</span>}
      <span className="score-total">{euro(score)}</span>
    </li>
  );
}

export function RoundResults({ view }) {
  const g = view.game;
  const byId = (id) => view.players.find((p) => p.id === id);
  const ranked = [...view.players].sort((a, b) => b.score - a.score);
  const deltas = g.deltas || {};
  const topDelta = Math.max(0, ...Object.values(deltas));
  const lastRound = g.round >= g.totalRounds;

  useEffect(() => {
    play('coins');
  }, [g.round]);

  return (
    <div className="results">
      <div className="screen-head">
        <div>
          <div className="eyebrow">Runde {g.round} von {g.totalRounds}</div>
          <h1 className="screen-title">Schichtende – Kassensturz!</h1>
        </div>
        <Timer endsAt={view.phaseEndsAt} timerKey={`results:${g.round}`} />
      </div>
      <div className="results-grid">
        <ol className="panel scoreboard">
          {ranked.map((p, i) => (
            <ScoreRow key={p.id} p={p} rank={i + 1} delta={deltas[p.id]} star={topDelta > 0 && deltas[p.id] === topDelta} isMe={p.id === view.me?.id} />
          ))}
        </ol>
        <div className="panel recap">
          <h3>
            Die Anrufe bei {g.persona.emoji} {g.persona.name}
          </h3>
          <ul>
            {g.calls.map((c, i) => {
              const p = byId(c.callerId);
              return (
                <li key={i}>
                  <Avatar player={p} size="sm" headset={false} />
                  <div className="recap-text">
                    <b>{p?.name}</b> als {c.masche?.emoji} <i>{c.masche?.title}</i>
                    <div className="small muted">
                      {c.endReason === 'hangup' ? '📵 aufgelegt · ' : c.endReason === 'offline' ? '📴 offline · ' : ''}
                      {c.transferred > 0 ? `💸 ${euro(c.transferred)}` : 'keine Beute'}
                      {g.copId === c.callerId ? ' · 🚔 Cop' : ''}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {g.persona.secret && <div className="small muted">🤫 Geheimnis des Opfers: {g.persona.secret}</div>}
        </div>
      </div>
      <div className="results-foot">
        {view.me?.isHost ? (
          <button type="button" className="btn btn-yellow btn-lg" onClick={() => act('skip')}>
            {lastRound ? '🏆 Zur großen Auswertung' : '▶ Nächste Runde'}
          </button>
        ) : (
          <div className="muted">{lastRound ? 'Gleich: die große Auswertung …' : 'Gleich geht’s weiter …'}</div>
        )}
        <ReactionBar compact />
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        dur: 2.8 + Math.random() * 2.5,
        color: ['#ffd23f', '#ff4f8b', '#3ddcff', '#3cf08c', '#b57bff'][i % 5],
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((c) => (
        <span key={c.id} style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, transform: `rotate(${c.rot}deg)` }} />
      ))}
    </div>
  );
}

export function GameOver({ view }) {
  const g = view.game;
  const byId = (id) => view.players.find((p) => p.id === id);
  const ranking = (g.ranking || []).map((r) => ({ ...byId(r.id), score: r.score })).filter((p) => p.id);
  const [first, second, third] = ranking;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    play('fanfare');
  }, []);

  const savePoster = async () => {
    setSaving(true);
    const me = byId(view.me?.id);
    const target = me && ranking.find((p) => p.id === me.id) ? ranking.find((p) => p.id === me.id) : first;
    const rank = ranking.findIndex((p) => p.id === target.id) + 1;
    const awards = (g.awards || []).filter((a) => a.playerId === target.id);
    await downloadPoster({ player: target, rank, total: ranking.length, awards });
    setSaving(false);
  };

  return (
    <div className="gameover">
      <Confetti />
      <h1 className="screen-title center big-title">🏆 SCHICHT BEENDET 🏆</h1>
      {g.endReason && <div className="alert alert-info center">{g.endReason}</div>}

      <div className="podium">
        {[second, first, third].map((p, i) =>
          p ? (
            <div key={p.id} className={`podium-spot spot-${[2, 1, 3][i]}`} style={{ '--c': p.color }}>
              {[2, 1, 3][i] === 1 && <div className="podium-crown">👑</div>}
              <Avatar player={p} size={[2, 1, 3][i] === 1 ? 'xl' : 'lg'} />
              <div className="podium-name">{p.name}</div>
              <div className="podium-score">{euro(p.score)}</div>
              <div className="podium-block">{[2, 1, 3][i]}</div>
            </div>
          ) : (
            <div key={`empty-${i}`} className="podium-spot is-empty" />
          ),
        )}
      </div>
      {first && (
        <div className="employee-of-month">
          <b>{first.name}</b> ist <b>Mitarbeiter des Monats</b> der Halunken GmbH!
        </div>
      )}

      <div className="awards">
        {(g.awards || [])
          .filter((a) => a.id !== 'mvp')
          .map((a) => {
            const p = byId(a.playerId);
            return (
              <div key={a.id} className="award" style={{ '--c': p?.color }}>
                <div className="award-emoji">{a.emoji}</div>
                <div className="award-title">{a.title}</div>
                <div className="award-who">
                  {p?.avatar} {p?.name}
                </div>
                <div className="award-desc">
                  {a.desc} ({a.unit === '€' ? euro(a.value) : `${a.value}${a.unit}`})
                </div>
              </div>
            );
          })}
      </div>

      <ol className="panel scoreboard final">
        {ranking.map((p, i) => (
          <ScoreRow key={p.id} p={p} rank={i + 1} isMe={p.id === view.me?.id} />
        ))}
      </ol>

      <div className="results-foot">
        <button type="button" className="btn btn-cyan" onClick={savePoster} disabled={saving || !first}>
          🖼️ {saving ? 'Wird erstellt …' : 'Mitarbeiter-Poster speichern'}
        </button>
        {view.me?.isHost ? (
          <button type="button" className="btn btn-yellow btn-lg" onClick={() => act('lobby')}>
            🔁 Nochmal spielen
          </button>
        ) : (
          <div className="muted">Der Host kann eine neue Schicht starten.</div>
        )}
        <ReactionBar compact />
      </div>
    </div>
  );
}
