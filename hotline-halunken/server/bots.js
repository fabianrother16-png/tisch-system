// Bots zum Testen und Auffüllen: Sie spielen mit einfachem Zufallsverhalten mit.
// Alle Aktionen laufen über room.action(), also durch dieselben Prüfungen wie bei echten Spielern.

function between(room, min, max) {
  return min + room.random() * (max - min);
}

function pick(room, list) {
  return list[Math.floor(room.random() * list.length)];
}

// Plant eine Aktion; sie verfällt, sobald die Phase gewechselt hat.
function after(room, delay, fn) {
  const seq = room.phaseSeq;
  room.botSeq = (room.botSeq || 0) + 1;
  room.schedule(`bot:${room.botSeq}`, Math.max(1, Math.round(delay)), () => {
    if (room.phaseSeq === seq) fn();
  });
}

// Zeitangaben in „Spielsekunden“ (werden mit timeScale skaliert).
function later(room, minMs, maxMs, fn) {
  after(room, room.d(between(room, minMs, maxMs)), fn);
}

function activeBots(room) {
  return room.players.filter((p) => p.bot && p.connected);
}

export function botsOnPhase(room) {
  const r = room.game?.r;
  if (!r) return;
  const bots = activeBots(room);
  if (!bots.length) return;

  switch (room.phase) {
    case 'roles':
      for (const b of bots) {
        if (b.id === r.victimId) later(room, 2500, 7000, () => room.action(b.id, 'ready'));
        else if (r.cards[b.id]) later(room, 1500, 8000, () => room.action(b.id, 'choose', { mascheId: pick(room, r.cards[b.id].options) }));
      }
      break;
    case 'call':
      runCall(room, bots);
      break;
    case 'razziaVote':
      for (const b of bots) {
        const options = r.callOrder.filter((id) => id !== b.id);
        if (options.length) later(room, 2000, 9000, () => room.action(b.id, 'vote', { suspectId: pick(room, options) }));
      }
      break;
    default:
      break;
  }
}

function runCall(room, bots) {
  const r = room.game.r;
  const c = r.call;
  const C = room.game.content;
  const duration = Math.max(1, room.phaseEndsAt - room.now());
  const at = (fraction) => duration * fraction;
  const chatMode = room.settings.callMode === 'chat';
  const victim = bots.find((b) => b.id === r.victimId);
  const caller = bots.find((b) => b.id === c.callerId);

  if (victim) {
    const liking = room.random();
    c.botLiking = liking;
    // Vertrauen wandert je nach Sympathie
    const wiggle = () => {
      const drift = (liking - 0.45) * 30 + (room.random() - 0.5) * 24;
      room.action(victim.id, 'trust', { value: Math.max(0, Math.min(100, c.trust + drift)) });
      later(room, 3000, 6000, wiggle);
    };
    later(room, 2000, 4000, wiggle);
    // Überweisungen
    const transfers = liking > 0.75 ? 2 : liking > 0.35 ? 1 : 0;
    const chips = room.chips();
    for (let i = 0; i < transfers; i++) {
      const chip = liking > 0.85 ? chips[3] : liking > 0.6 ? chips[2] : pick(room, chips.slice(0, 2));
      after(room, at(between(room, 0.25, 0.9)), () => room.action(victim.id, 'transfer', { amount: chip }));
    }
    if (room.random() < 0.2) after(room, at(between(room, 0.3, 0.5)), () => room.action(victim.id, 'hold'));
    if (liking < 0.18) after(room, Math.max(at(between(room, 0.45, 0.75)), c.hangupFrom - room.now() + 50), () => room.action(victim.id, 'hangup'));
    if (chatMode) later(room, 800, 2500, () => room.action(victim.id, 'chat', { text: pick(room, C.BOT_VICTIM_OPENERS) }));
  }

  if (caller) {
    if (room.random() < 0.75) after(room, at(between(room, 0.3, 0.7)), () => room.action(caller.id, 'proof'));
    if (room.random() < 0.5) after(room, at(between(room, 0.1, 0.8)), () => room.action(caller.id, 'sound', { id: pick(room, ['typing', 'kaching', 'airhorn', 'ding']) }));
    if (chatMode) {
      const masche = room.masche(r.cards[caller.id].mascheId);
      const lines = [
        C.BOT_CALLER_OPENER.replace('{caller}', masche.caller),
        ...masche.pitch.split(/(?<=[.!?])\s+/).filter(Boolean),
      ];
      let i = 0;
      const next = () => {
        const text = i < lines.length ? lines[i] : pick(room, C.BOT_CALLER_PUSH);
        i++;
        room.action(caller.id, 'chat', { text });
        later(room, 5000, 9000, next);
      };
      later(room, 500, 2000, next);
    }
  }

  // Unbeteiligte Bots reagieren ab und zu
  for (const b of bots) {
    if (b === victim || b === caller) continue;
    const count = Math.floor(room.random() * 3);
    for (let i = 0; i < count; i++) after(room, at(between(room, 0.1, 0.95)), () => room.react(b.id, pick(room, ['😂', '💀', '🤡', '🔥', '😱', '👏', '💸'])));
  }
}

// Antworten auf Chat-Nachrichten
export function botsOnChat(room, msg) {
  const r = room.game?.r;
  const c = r?.call;
  if (!c || msg.from === 'system') return;
  const C = room.game.content;
  const responderId = msg.from === 'caller' ? r.victimId : c.callerId;
  const responder = room.player(responderId);
  if (!responder?.bot || !responder.connected || c.botReplyPending?.[responderId]) return;
  // Der Anrufer-Bot schreibt ohnehin regelmäßig – er antwortet nur manchmal direkt.
  if (msg.from === 'victim' && room.random() < 0.5) return;
  c.botReplyPending = { ...(c.botReplyPending || {}), [responderId]: true };
  later(room, 1500, 4000, () => {
    c.botReplyPending[responderId] = false;
    const lines = msg.from === 'caller' ? C.BOT_VICTIM_LINES : C.BOT_CALLER_REPLIES;
    room.action(responderId, 'chat', { text: pick(room, lines) });
  });
}
