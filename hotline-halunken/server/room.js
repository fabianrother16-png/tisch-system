import crypto from 'node:crypto';
import { MASCHEN, PERSONAS, VOICES, CHAOS, TIPS, COP_RULE, fakeNumber } from './content.js';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_AUDIENCE = 300;

export const AVATARS = ['🦊', '🐸', '🐷', '🐵', '🐔', '🦄', '🐙', '🐼', '🐯', '🐻', '🐨', '🦁', '🐺', '🦝', '🐧', '🦉', '🐹', '🐮', '🦆', '🐲', '👽', '🤖', '🤡', '👻'];
export const COLORS = ['#FF4F8B', '#FFD23F', '#3DDCFF', '#3CF08C', '#B57BFF', '#FF8A3D', '#FF5A5A', '#2EC4B6', '#F9A8FF', '#A3E635', '#60A5FA', '#FDBA74'];
export const REACTIONS = ['😂', '💀', '🤡', '🔥', '😱', '👏', '🚨', '💸', '🤔', '❤️'];
export const SOUNDS = ['airhorn', 'kaching', 'typing', 'modem', 'drumroll', 'sad', 'ding', 'buzzer', 'boing'];

export const DEFAULT_SETTINGS = {
  rounds: 0, // 0 = automatisch: jeder einmal Opfer (max. 6 Runden)
  callSeconds: 60,
  maxCallers: 5,
  budget: 1000,
  cop: true,
  chaos: true,
  voices: true,
  audience: true,
};

const SETTING_OPTIONS = {
  rounds: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12],
  callSeconds: [30, 45, 60, 75, 90, 120],
  maxCallers: [2, 3, 4, 5, 6, 8, 11],
  budget: [500, 1000, 2000, 5000],
};
const BOOL_SETTINGS = ['cop', 'chaos', 'voices', 'audience'];

// Dauer der Phasen in ms (werden mit timeScale multipliziert).
export const DUR = {
  roles: 30000,
  ring: 3500,
  hangupGrace: 8000,
  summary: 7000,
  vote: 40000,
  reveal: 11000,
  results: 25000,
  hold: 8000,
  soundCooldown: 2500,
  allChosenDelay: 1500,
};

const TRANSFER_FRACTIONS = [0.05, 0.1, 0.25, 0.5];

export function randomId(bytes = 9) {
  return crypto.randomBytes(bytes).toString('base64url');
}

// Der HTTP-Server hält den Prozess am Leben – Spiel-Timer sollen das nicht (sauberes Beenden in Tests).
function unref(handle) {
  handle?.unref?.();
  return handle;
}

function shuffle(list, random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Deck {
  constructor(items, random) {
    this.items = items;
    this.random = random;
    this.pile = [];
  }
  draw(exclude) {
    if (!this.pile.length) this.pile = shuffle(this.items, this.random);
    let card = this.pile.pop();
    if (exclude && card.id === exclude.id) {
      if (!this.pile.length) this.pile = shuffle(this.items.filter((c) => c.id !== exclude.id), this.random);
      const other = this.pile.pop();
      this.pile.unshift(card);
      card = other;
    }
    return card;
  }
}

export function cleanName(name) {
  return String(name ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
}

function freshStats() {
  return { calls: 0, earned: 0, bestCall: 0, hungUp: 0, onHold: 0, given: 0, detective: 0, copEscaped: 0, copCaught: 0, wrongArrest: 0, reactions: 0, victimRounds: 0 };
}

const MASCHE_BY_ID = new Map(MASCHEN.map((m) => [m.id, m]));

export class Room {
  constructor(code, opts = {}) {
    this.code = code;
    this.now = opts.now || Date.now;
    this.random = opts.random || Math.random;
    this.timeScale = opts.timeScale ?? 1;
    this.onChange = opts.onChange || (() => {});
    this.onFx = opts.onFx || (() => {});
    this.onKick = opts.onKick || (() => {});

    this.players = [];
    this.audience = new Map(); // socketId -> { name }
    this.hostId = null;
    this.settings = { ...DEFAULT_SETTINGS };
    this.phase = 'lobby';
    this.phaseEndsAt = null;
    this.phaseCallback = null;
    this.paused = false;
    this.pausedAt = null;
    this.game = null;
    this.lastResults = null;
    this.timers = new Map();
    this.lastActivity = this.now();
    this.changeQueued = false;
  }

  // ------------------------------------------------------------------ helpers
  d(ms) {
    return Math.max(1, Math.round(ms * this.timeScale));
  }

  player(id) {
    return this.players.find((p) => p.id === id) || null;
  }

  connectedPlayers() {
    return this.players.filter((p) => p.connected);
  }

  chips() {
    const b = this.game?.r?.budget ?? this.settings.budget;
    return TRANSFER_FRACTIONS.map((f) => Math.round(b * f));
  }

  changed() {
    this.lastActivity = this.now();
    if (this.changeQueued) return;
    this.changeQueued = true;
    queueMicrotask(() => {
      this.changeQueued = false;
      this.onChange(this);
    });
  }

  fx(effect) {
    this.onFx(this, { ...effect, at: this.now() });
  }

  schedule(name, delay, fn) {
    this.clearTimer(name);
    const timer = { fn, due: this.now() + delay, remaining: delay, handle: null };
    const run = () => {
      this.timers.delete(name);
      fn();
    };
    timer.run = run;
    if (!this.paused) timer.handle = unref(setTimeout(run, delay));
    this.timers.set(name, timer);
  }

  clearTimer(name) {
    const t = this.timers.get(name);
    if (t) {
      clearTimeout(t.handle);
      this.timers.delete(name);
    }
  }

  clearAllTimers() {
    for (const t of this.timers.values()) clearTimeout(t.handle);
    this.timers.clear();
  }

  setPhase(phase, duration, onEnd) {
    this.clearTimer('phase');
    this.phase = phase;
    this.phaseEndsAt = duration ? this.now() + duration : null;
    this.phaseCallback = onEnd || null;
    if (duration && onEnd) this.schedule('phase', duration, onEnd);
    this.changed();
  }

  // Beendet die aktuelle Phase früher (z. B. wenn alle abgestimmt haben).
  shortenPhase(ms) {
    if (!this.phaseCallback || !this.phaseEndsAt) return;
    const delay = this.d(ms);
    if (this.phaseEndsAt - this.now() <= delay) return;
    this.phaseEndsAt = this.now() + delay;
    this.schedule('phase', delay, this.phaseCallback);
    this.changed();
  }

  // ------------------------------------------------------------------ players
  addPlayer(profile, socketId) {
    if (this.phase !== 'lobby') return { error: 'Das Spiel läuft schon. Du kannst zuschauen und in der nächsten Runde mitmachen.' };
    if (this.players.length >= MAX_PLAYERS) return { error: `Der Raum ist voll (max. ${MAX_PLAYERS} Spieler).` };
    let name = cleanName(profile?.name) || 'Halunke';
    const taken = new Set(this.players.map((p) => p.name.toLowerCase()));
    if (taken.has(name.toLowerCase())) {
      let i = 2;
      while (taken.has(`${name} ${i}`.toLowerCase())) i++;
      name = `${name.slice(0, 13)} ${i}`;
    }
    const player = {
      id: randomId(),
      secret: randomId(18),
      name,
      avatar: AVATARS.includes(profile?.avatar) ? profile.avatar : AVATARS[Math.floor(this.random() * AVATARS.length)],
      color: this.pickColor(profile?.color),
      socketId,
      connected: true,
      left: false,
      score: 0,
      stats: freshStats(),
    };
    this.players.push(player);
    if (!this.hostId) this.hostId = player.id;
    this.changed();
    return { player };
  }

  pickColor(wanted, exceptId) {
    const used = new Set(this.players.filter((p) => p.id !== exceptId).map((p) => p.color));
    if (COLORS.includes(wanted) && !used.has(wanted)) return wanted;
    return COLORS.find((c) => !used.has(c)) || COLORS[Math.floor(this.random() * COLORS.length)];
  }

  reconnect(playerId, secret, socketId) {
    const p = this.player(playerId);
    if (!p || p.secret !== secret || p.left) return { error: 'Sitzung abgelaufen.' };
    const previousSocket = p.socketId;
    p.socketId = socketId;
    p.connected = true;
    this.clearTimer(`remove:${p.id}`);
    if (this.hostId === p.id) this.clearTimer('host');
    this.changed();
    return { player: p, previousSocket };
  }

  disconnect(playerId) {
    const p = this.player(playerId);
    if (!p) return;
    p.connected = false;
    p.socketId = null;
    if (this.phase === 'lobby') {
      this.schedule(`remove:${p.id}`, 45000, () => this.removePlayer(p.id));
    }
    if (this.hostId === p.id) this.schedule('host', 8000, () => this.reassignHost());
    this.checkProgress();
    this.changed();
  }

  leave(playerId) {
    const p = this.player(playerId);
    if (!p) return;
    if (this.phase === 'lobby') {
      this.removePlayer(p.id);
    } else {
      p.connected = false;
      p.left = true;
      p.socketId = null;
      if (this.hostId === p.id) this.reassignHost();
      this.checkProgress();
      this.changed();
    }
  }

  removePlayer(id) {
    const p = this.player(id);
    if (!p) return;
    this.clearTimer(`remove:${id}`);
    this.players = this.players.filter((x) => x.id !== id);
    if (this.hostId === id) this.reassignHost();
    this.changed();
  }

  reassignHost() {
    const current = this.player(this.hostId);
    if (current && current.connected) return;
    const next = this.players.find((p) => p.connected);
    if (next) {
      this.hostId = next.id;
      this.fx({ type: 'toast', text: `👑 ${next.name} ist jetzt Host.` });
    } else if (!current) {
      this.hostId = this.players[0]?.id || null;
    }
    this.changed();
  }

  addAudience(socketId, name) {
    if (!this.settings.audience) return { error: 'Zuschauer sind in diesem Raum deaktiviert.' };
    if (this.audience.size >= MAX_AUDIENCE) return { error: 'Zu viele Zuschauer.' };
    this.audience.set(socketId, { name: cleanName(name) || 'Zuschauer' });
    this.changed();
    return { ok: true };
  }

  removeAudience(socketId) {
    if (this.audience.delete(socketId)) this.changed();
  }

  isEmpty() {
    return !this.players.some((p) => p.connected) && this.audience.size === 0;
  }

  // ------------------------------------------------------------------ actions
  action(playerId, type, data = {}) {
    const p = this.player(playerId);
    if (!p) return { error: 'Du bist nicht in diesem Raum.' };
    const isHost = p.id === this.hostId;
    const hostOnly = () => (isHost ? null : { error: 'Nur der Host kann das.' });
    switch (type) {
      case 'settings': return hostOnly() || this.updateSettings(data);
      case 'profile': return this.updateProfile(p, data);
      case 'kick': return hostOnly() || this.kick(data.playerId);
      case 'start': return hostOnly() || this.startGame();
      case 'choose': return this.chooseMasche(p, data.mascheId);
      case 'ready': return this.victimReady(p);
      case 'transfer': return this.transfer(p, data.amount);
      case 'trust': return this.setTrust(p, data.value);
      case 'hold': return this.hold(p);
      case 'hangup': return this.hangup(p);
      case 'proof': return this.sendProof(p);
      case 'sound': return this.playSound(p, data.id);
      case 'vote': return this.vote(p, data.suspectId);
      case 'skip': return hostOnly() || this.skip();
      case 'pause': return hostOnly() || this.pause();
      case 'resume': return hostOnly() || this.resume();
      case 'lobby': return hostOnly() || this.backToLobby();
      case 'endGame': return hostOnly() || this.endGame('Der Host hat das Spiel beendet.');
      default: return { error: 'Unbekannte Aktion.' };
    }
  }

  updateSettings(data) {
    if (this.phase !== 'lobby') return { error: 'Einstellungen nur in der Lobby.' };
    for (const [key, options] of Object.entries(SETTING_OPTIONS)) {
      if (key in data && options.includes(Number(data[key]))) this.settings[key] = Number(data[key]);
    }
    for (const key of BOOL_SETTINGS) {
      if (key in data) this.settings[key] = Boolean(data[key]);
    }
    this.changed();
    return { ok: true };
  }

  updateProfile(p, data) {
    if (this.phase !== 'lobby') return { error: 'Profil nur in der Lobby änderbar.' };
    if ('name' in data) {
      const name = cleanName(data.name);
      if (!name) return { error: 'Name darf nicht leer sein.' };
      if (this.players.some((x) => x.id !== p.id && x.name.toLowerCase() === name.toLowerCase())) return { error: 'Der Name ist schon vergeben.' };
      p.name = name;
    }
    if ('avatar' in data && AVATARS.includes(data.avatar)) p.avatar = data.avatar;
    if ('color' in data) p.color = this.pickColor(data.color, p.id);
    this.changed();
    return { ok: true };
  }

  kick(targetId) {
    if (this.phase !== 'lobby') return { error: 'Kicken geht nur in der Lobby.' };
    const target = this.player(targetId);
    if (!target || target.id === this.hostId) return { error: 'Spieler nicht gefunden.' };
    const socketId = target.socketId;
    this.removePlayer(target.id);
    this.onKick(this, target, socketId);
    return { ok: true };
  }

  // ------------------------------------------------------------------ game flow
  startGame() {
    if (this.phase !== 'lobby') return { error: 'Das Spiel läuft bereits.' };
    this.players = this.players.filter((p) => p.connected);
    for (const t of [...this.timers.keys()]) if (t.startsWith('remove:')) this.clearTimer(t);
    if (this.players.length < MIN_PLAYERS) return { error: `Ihr braucht mindestens ${MIN_PLAYERS} Spieler.` };
    if (!this.player(this.hostId)) this.hostId = this.players[0].id;
    for (const p of this.players) {
      p.score = 0;
      p.stats = freshStats();
    }
    const n = this.players.length;
    this.game = {
      round: 0,
      totalRounds: this.settings.rounds || Math.min(n, 6),
      victimQueue: shuffle(this.players.map((p) => p.id), this.random),
      decks: {
        maschen: new Deck(MASCHEN, this.random),
        personas: new Deck(PERSONAS, this.random),
        voices: new Deck(VOICES, this.random),
        chaos: new Deck(CHAOS, this.random),
      },
      history: [],
      r: null,
      awards: null,
      ranking: null,
      endReason: null,
    };
    this.lastResults = null;
    this.startRound();
    return { ok: true };
  }

  startRound() {
    const g = this.game;
    const present = this.connectedPlayers();
    if (present.length < MIN_PLAYERS) return this.endGame('Zu wenige Spieler verbunden – Schicht vorzeitig beendet.');
    g.round++;

    let victim = null;
    for (let i = 0; i < g.victimQueue.length && !victim; i++) {
      const id = g.victimQueue.shift();
      g.victimQueue.push(id);
      const candidate = this.player(id);
      if (candidate?.connected) victim = candidate;
    }

    const scammers = present.filter((p) => p !== victim);
    const maxCallers = Math.min(this.settings.maxCallers, scammers.length);
    const callers = shuffle(scammers, this.random)
      .sort((a, b) => a.stats.calls - b.stats.calls)
      .slice(0, maxCallers);
    const callOrder = shuffle(callers.map((p) => p.id), this.random);
    const copId = this.settings.cop && callOrder.length >= 3 ? callOrder[Math.floor(this.random() * callOrder.length)] : null;

    const cards = {};
    for (const id of callOrder) {
      const first = g.decks.maschen.draw();
      const second = g.decks.maschen.draw(first);
      cards[id] = {
        options: [first.id, second.id],
        mascheId: null,
        voice: this.settings.voices ? g.decks.voices.draw() : null,
        number: fakeNumber(this.random),
      };
    }

    const zero = () => Object.fromEntries(this.players.map((p) => [p.id, 0]));
    g.r = {
      victimId: victim.id,
      persona: g.decks.personas.draw(),
      callOrder,
      copId,
      cards,
      victimReady: false,
      budget: this.settings.budget,
      budgetLeft: this.settings.budget,
      earnings: zero(),
      deltas: zero(),
      callIndex: -1,
      call: null,
      calls: [],
      votes: {},
      audienceVotes: {},
      razzia: null,
      tip: TIPS[Math.floor(this.random() * TIPS.length)],
    };
    victim.stats.victimRounds++;
    this.setPhase('roles', this.d(DUR.roles), () => this.beginCalls());
  }

  chooseMasche(p, mascheId) {
    if (this.phase !== 'roles') return { error: 'Gerade nicht möglich.' };
    const card = this.game.r.cards[p.id];
    if (!card || !card.options.includes(mascheId)) return { error: 'Ungültige Masche.' };
    card.mascheId = mascheId;
    this.changed();
    this.checkProgress();
    return { ok: true };
  }

  victimReady(p) {
    if (this.phase !== 'roles' || this.game.r.victimId !== p.id) return { error: 'Gerade nicht möglich.' };
    this.game.r.victimReady = true;
    this.changed();
    this.checkProgress();
    return { ok: true };
  }

  checkProgress() {
    const r = this.game?.r;
    if (!r) return;
    if (this.phase === 'roles') {
      const victim = this.player(r.victimId);
      const callersDone = r.callOrder.every((id) => r.cards[id].mascheId || !this.player(id)?.connected);
      const victimDone = r.victimReady || !victim?.connected;
      if (callersDone && victimDone) this.shortenPhase(DUR.allChosenDelay);
    } else if (this.phase === 'razziaVote') {
      const voters = this.connectedPlayers();
      if (voters.length && voters.every((p) => r.votes[p.id])) this.shortenPhase(1200);
    }
  }

  beginCalls() {
    const r = this.game.r;
    for (const card of Object.values(r.cards)) if (!card.mascheId) card.mascheId = card.options[0];
    r.callIndex = -1;
    this.nextCall();
  }

  nextCall() {
    const r = this.game.r;
    r.callIndex++;
    while (r.callIndex < r.callOrder.length && !this.player(r.callOrder[r.callIndex])?.connected) {
      const id = r.callOrder[r.callIndex];
      r.calls.push({ callerId: id, mascheId: r.cards[id].mascheId, transferred: 0, endReason: 'offline', trust: 50, reactions: 0, chaos: null });
      r.callIndex++;
    }
    if (r.callIndex >= r.callOrder.length) return this.endCalls();
    const callerId = r.callOrder[r.callIndex];
    r.call = {
      callerId,
      index: r.callIndex,
      trust: 50,
      transferred: 0,
      holdUntil: null,
      holdUsed: false,
      proofSent: false,
      chaos: null,
      endReason: null,
      reactions: 0,
      startedAt: null,
      hangupFrom: null,
      soundAt: {},
    };
    this.setPhase('ring', this.d(DUR.ring), () => this.startCall());
  }

  startCall() {
    const c = this.game.r.call;
    const duration = this.d(this.settings.callSeconds * 1000);
    c.startedAt = this.now();
    c.hangupFrom = c.startedAt + this.d(DUR.hangupGrace);
    this.setPhase('call', duration, () => this.endCall('timeout'));
    if (this.settings.chaos && this.random() < 0.7) {
      const at = Math.round(duration * (0.3 + this.random() * 0.35));
      this.schedule('chaos', at, () => this.fireChaos());
    }
  }

  fireChaos() {
    if (this.phase !== 'call') return;
    const r = this.game.r;
    const c = r.call;
    if (c.chaos) return;
    const card = this.game.decks.chaos.draw();
    const callerName = this.player(c.callerId)?.name || 'Der Anrufer';
    const text = card.text.replaceAll('{caller}', callerName).replaceAll('{victim}', r.persona.name);
    c.chaos = { id: card.id, emoji: card.emoji, target: card.target, text };
    this.fx({ type: 'chaos', chaos: c.chaos });
    this.changed();
  }

  endCall(reason) {
    if (this.phase !== 'call' && this.phase !== 'ring') return;
    this.clearTimer('chaos');
    this.clearTimer('hold');
    const r = this.game.r;
    const c = r.call;
    c.endReason = reason;
    c.holdUntil = null;
    r.calls.push({
      callerId: c.callerId,
      mascheId: r.cards[c.callerId].mascheId,
      transferred: c.transferred,
      endReason: reason,
      trust: c.trust,
      reactions: c.reactions,
      chaos: c.chaos?.text || null,
    });
    const caller = this.player(c.callerId);
    if (caller) {
      caller.stats.calls++;
      caller.stats.bestCall = Math.max(caller.stats.bestCall, c.transferred);
      caller.stats.reactions += c.reactions;
      if (reason === 'hangup') caller.stats.hungUp++;
    }
    this.fx({ type: 'callEnd', reason, callerId: c.callerId, transferred: c.transferred });
    this.setPhase('callSummary', this.d(DUR.summary), () => this.nextCall());
  }

  endCalls() {
    const r = this.game.r;
    r.call = null;
    if (r.copId) this.setPhase('razziaVote', this.d(DUR.vote), () => this.resolveRazzia());
    else this.finishRound();
  }

  callActionGuard(p, role) {
    if (this.phase !== 'call') return { error: 'Gerade läuft kein Anruf.' };
    if (this.paused) return { error: 'Das Spiel ist pausiert.' };
    const r = this.game.r;
    if (role === 'victim' && p.id !== r.victimId) return { error: 'Nur das Opfer kann das.' };
    if (role === 'caller' && p.id !== r.call.callerId) return { error: 'Nur der Anrufer kann das.' };
    if (role === 'both' && p.id !== r.victimId && p.id !== r.call.callerId) return { error: 'Nur Anrufer und Opfer können das.' };
    return null;
  }

  addScore(id, amount) {
    const p = this.player(id);
    if (!p) return;
    p.score += amount;
    this.game.r.deltas[id] = (this.game.r.deltas[id] || 0) + amount;
  }

  transfer(p, rawAmount) {
    const err = this.callActionGuard(p, 'victim');
    if (err) return err;
    const r = this.game.r;
    const c = r.call;
    let amount = rawAmount === 'all' ? r.budgetLeft : Number(rawAmount);
    if (rawAmount !== 'all' && !this.chips().includes(amount)) return { error: 'Ungültiger Betrag.' };
    amount = Math.min(amount, r.budgetLeft);
    if (amount <= 0) return { error: 'Dein Konto ist leer!' };
    r.budgetLeft -= amount;
    c.transferred += amount;
    r.earnings[c.callerId] = (r.earnings[c.callerId] || 0) + amount;
    this.addScore(c.callerId, amount);
    const caller = this.player(c.callerId);
    if (caller) caller.stats.earned += amount;
    p.stats.given += amount;
    this.fx({ type: 'transfer', amount, callerId: c.callerId, budgetLeft: r.budgetLeft, all: rawAmount === 'all' });
    this.changed();
    return { ok: true };
  }

  setTrust(p, value) {
    const err = this.callActionGuard(p, 'victim');
    if (err) return err;
    const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    this.game.r.call.trust = v;
    this.fx({ type: 'trust', value: v });
    return { ok: true };
  }

  hold(p) {
    const err = this.callActionGuard(p, 'victim');
    if (err) return err;
    const c = this.game.r.call;
    if (c.holdUsed) return { error: 'Die Warteschleife geht nur einmal pro Anruf.' };
    if (this.phaseEndsAt - this.now() < this.d(3000)) return { error: 'Zu spät für die Warteschleife.' };
    c.holdUsed = true;
    c.holdUntil = this.now() + this.d(DUR.hold);
    const caller = this.player(c.callerId);
    if (caller) caller.stats.onHold++;
    this.schedule('hold', this.d(DUR.hold), () => {
      c.holdUntil = null;
      this.fx({ type: 'holdEnd' });
      this.changed();
    });
    this.fx({ type: 'hold', until: c.holdUntil });
    this.changed();
    return { ok: true };
  }

  hangup(p) {
    const err = this.callActionGuard(p, 'victim');
    if (err) return err;
    const c = this.game.r.call;
    if (this.now() < c.hangupFrom) return { error: 'Gib dem Anrufer wenigstens ein paar Sekunden!' };
    this.endCall('hangup');
    return { ok: true };
  }

  sendProof(p) {
    const err = this.callActionGuard(p, 'caller');
    if (err) return err;
    const r = this.game.r;
    const c = r.call;
    if (c.proofSent) return { error: 'Du hast deinen Beweis schon geschickt.' };
    c.proofSent = true;
    const masche = MASCHE_BY_ID.get(r.cards[p.id].mascheId);
    this.fx({ type: 'proof', proof: masche.proof, callerId: p.id });
    this.changed();
    return { ok: true };
  }

  playSound(p, id) {
    const err = this.callActionGuard(p, 'both');
    if (err) return err;
    if (!SOUNDS.includes(id)) return { error: 'Unbekannter Sound.' };
    const c = this.game.r.call;
    const last = c.soundAt[p.id] || 0;
    if (this.now() - last < this.d(DUR.soundCooldown)) return { error: 'Kurz warten …' };
    c.soundAt[p.id] = this.now();
    this.fx({ type: 'sfx', id, from: p.id });
    return { ok: true };
  }

  // Reaktionen dürfen alle schicken – auch Zuschauer.
  react(fromId, emoji, audienceName) {
    if (!REACTIONS.includes(emoji)) return { error: 'Unbekannte Reaktion.' };
    const p = fromId ? this.player(fromId) : null;
    const c = this.game?.r?.call;
    if (this.phase === 'call' && c && fromId !== c.callerId) c.reactions++;
    this.fx({ type: 'reaction', emoji, name: p?.name || audienceName || 'Zuschauer', color: p?.color || '#ffffff', audience: !p });
    return { ok: true };
  }

  vote(p, suspectId) {
    if (this.phase !== 'razziaVote') return { error: 'Gerade wird nicht abgestimmt.' };
    const r = this.game.r;
    if (!r.callOrder.includes(suspectId)) return { error: 'Ungültige Wahl.' };
    if (suspectId === p.id) return { error: 'Du kannst dich nicht selbst verdächtigen.' };
    r.votes[p.id] = suspectId;
    this.changed();
    this.checkProgress();
    return { ok: true };
  }

  audienceVote(socketId, suspectId) {
    if (this.phase !== 'razziaVote' || !this.audience.has(socketId)) return { error: 'Gerade nicht möglich.' };
    const r = this.game.r;
    if (!r.callOrder.includes(suspectId)) return { error: 'Ungültige Wahl.' };
    r.audienceVotes[socketId] = suspectId;
    this.changed();
    return { ok: true };
  }

  resolveRazzia() {
    const r = this.game.r;
    const tally = {};
    for (const s of Object.values(r.votes)) tally[s] = (tally[s] || 0) + 1;
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const unique = sorted.length > 0 && (sorted.length === 1 || sorted[1][1] < sorted[0][1]);
    const arrestedId = unique ? sorted[0][0] : null;
    const caught = arrestedId === r.copId;
    const cop = this.player(r.copId);
    const voterBonus = Math.round(r.budget * 0.15);
    const copBonus = Math.round(r.budget * 0.3);

    const correct = Object.entries(r.votes)
      .filter(([voter, suspect]) => suspect === r.copId && voter !== r.copId)
      .map(([voter]) => voter);
    for (const id of correct) {
      this.addScore(id, voterBonus);
      const p = this.player(id);
      if (p) p.stats.detective++;
    }

    let confiscated = null;
    if (caught) {
      if (cop) cop.stats.copCaught++;
    } else {
      this.addScore(r.copId, copBonus);
      if (cop) cop.stats.copEscaped++;
      const richest = r.callOrder
        .filter((id) => id !== r.copId && (r.earnings[id] || 0) > 0)
        .sort((a, b) => r.earnings[b] - r.earnings[a])[0];
      if (richest) {
        const amount = r.earnings[richest];
        this.addScore(richest, -amount);
        this.addScore(r.copId, amount);
        confiscated = { fromId: richest, amount };
      }
      if (arrestedId) {
        const wrong = this.player(arrestedId);
        if (wrong) wrong.stats.wrongArrest++;
      }
    }

    const audienceTally = {};
    for (const s of Object.values(r.audienceVotes)) audienceTally[s] = (audienceTally[s] || 0) + 1;

    r.razzia = {
      copId: r.copId,
      arrestedId,
      caught,
      tally,
      votes: { ...r.votes },
      correct,
      voterBonus,
      copBonus: caught ? 0 : copBonus,
      confiscated,
      audienceTally,
      audienceTotal: Object.keys(r.audienceVotes).length,
    };
    this.setPhase('razziaReveal', this.d(DUR.reveal), () => this.finishRound());
  }

  finishRound() {
    const g = this.game;
    const r = g.r;
    r.call = null;
    g.history.push({
      round: g.round,
      victimId: r.victimId,
      persona: { name: r.persona.name, emoji: r.persona.emoji },
      copId: r.copId,
      calls: r.calls,
      razzia: r.razzia,
      deltas: r.deltas,
    });
    this.setPhase('roundResults', this.d(DUR.results), () => this.nextRound());
  }

  nextRound() {
    if (this.game.round >= this.game.totalRounds) this.endGame();
    else this.startRound();
  }

  endGame(reason = null) {
    if (!this.game) return { error: 'Kein Spiel aktiv.' };
    if (this.phase === 'gameOver') return { ok: true };
    this.clearAllTimers();
    this.paused = false;
    const g = this.game;
    g.endReason = reason;
    g.ranking = [...this.players].sort((a, b) => b.score - a.score).map((p) => ({ id: p.id, score: p.score }));
    g.awards = this.computeAwards();
    this.setPhase('gameOver', null);
    return { ok: true };
  }

  computeAwards() {
    const best = (fn, min = 1) => {
      let top = null;
      let value = -Infinity;
      for (const p of this.players) {
        const v = fn(p);
        if (v > value) {
          value = v;
          top = p;
        }
      }
      return top && value >= min ? { playerId: top.id, value } : null;
    };
    const defs = [
      { id: 'mvp', emoji: '🏆', title: 'Mitarbeiter des Monats', desc: 'Die meiste Beute', unit: '€', pick: best((p) => p.score, 0) },
      { id: 'coup', emoji: '💰', title: 'Größter Coup', desc: 'Höchste Beute in einem einzigen Anruf', unit: '€', pick: best((p) => p.stats.bestCall) },
      { id: 'generous', emoji: '💸', title: 'Goldenes Sparschwein', desc: 'Hat als Opfer am meisten verschenkt', unit: '€', pick: best((p) => p.stats.given) },
      { id: 'hungup', emoji: '📵', title: 'Tuut-Tuut-Legende', desc: 'Am häufigsten weggedrückt', unit: '×', pick: best((p) => p.stats.hungUp) },
      { id: 'hold', emoji: '🎵', title: 'Warteschleifen-Stammgast', desc: 'Am häufigsten in der Warteschleife', unit: '×', pick: best((p) => p.stats.onHold) },
      { id: 'detective', emoji: '🕵️', title: 'Sherlock Halunk', desc: 'Die meisten Cops richtig erkannt', unit: '×', pick: best((p) => p.stats.detective) },
      { id: 'cop', emoji: '🚔', title: 'Bester Undercover-Cop', desc: 'Als Cop der Razzia entkommen', unit: '×', pick: best((p) => p.stats.copEscaped) },
      { id: 'wrong', emoji: '🤡', title: 'Justizirrtum', desc: 'Unschuldig verhaftet', unit: '×', pick: best((p) => p.stats.wrongArrest) },
      { id: 'fanfav', emoji: '🔥', title: 'Publikumsliebling', desc: 'Die meisten Reaktionen bei eigenen Anrufen', unit: '×', pick: best((p) => p.stats.reactions) },
    ];
    return defs
      .filter((d) => d.pick)
      .map(({ pick, ...d }) => ({ ...d, playerId: pick.playerId, value: pick.value }));
  }

  backToLobby() {
    if (this.phase === 'lobby') return { ok: true };
    this.clearAllTimers();
    if (this.game?.ranking) {
      this.lastResults = { ranking: this.game.ranking, awards: this.game.awards };
    }
    this.game = null;
    this.paused = false;
    this.pausedAt = null;
    this.players = this.players.filter((p) => !p.left);
    for (const p of this.players) if (!p.connected) this.schedule(`remove:${p.id}`, 45000, () => this.removePlayer(p.id));
    this.reassignHost();
    this.setPhase('lobby', null);
    return { ok: true };
  }

  skip() {
    if (this.phase === 'lobby' || this.phase === 'gameOver') return { error: 'Hier gibt es nichts zu überspringen.' };
    if (this.paused) this.resume();
    if (this.phase === 'call') {
      this.endCall('skipped');
      return { ok: true };
    }
    const cb = this.phaseCallback;
    if (cb) {
      this.clearTimer('phase');
      cb();
    }
    return { ok: true };
  }

  pause() {
    if (this.paused || this.phase === 'lobby' || this.phase === 'gameOver') return { error: 'Pause ist gerade nicht möglich.' };
    this.paused = true;
    this.pausedAt = this.now();
    for (const t of this.timers.values()) {
      clearTimeout(t.handle);
      t.handle = null;
      t.remaining = Math.max(0, t.due - this.pausedAt);
    }
    this.fx({ type: 'pause' });
    this.changed();
    return { ok: true };
  }

  resume() {
    if (!this.paused) return { error: 'Das Spiel ist nicht pausiert.' };
    const now = this.now();
    const delta = now - this.pausedAt;
    this.paused = false;
    this.pausedAt = null;
    if (this.phaseEndsAt) this.phaseEndsAt += delta;
    const c = this.game?.r?.call;
    if (c) {
      if (c.holdUntil) c.holdUntil += delta;
      if (c.startedAt) c.startedAt += delta;
      if (c.hangupFrom) c.hangupFrom += delta;
    }
    for (const t of this.timers.values()) {
      t.due = now + t.remaining;
      t.handle = unref(setTimeout(t.run, t.remaining));
    }
    this.fx({ type: 'resume' });
    this.changed();
    return { ok: true };
  }

  // ------------------------------------------------------------------ views
  publicPlayer(p) {
    return { id: p.id, name: p.name, avatar: p.avatar, color: p.color, connected: p.connected, left: p.left, score: p.score };
  }

  viewFor({ playerId = null, socketId = null } = {}) {
    const me = playerId ? this.player(playerId) : null;
    const now = this.now();
    const view = {
      code: this.code,
      phase: this.phase,
      phaseEndsAt: this.phaseEndsAt,
      serverNow: now,
      paused: this.paused,
      pausedRemaining: this.paused && this.phaseEndsAt ? Math.max(0, this.phaseEndsAt - this.pausedAt) : null,
      hostId: this.hostId,
      settings: this.settings,
      audienceCount: this.audience.size,
      me: me ? { id: me.id, isHost: me.id === this.hostId } : null,
      players: this.players.map((p) => this.publicPlayer(p)),
      chips: this.chips(),
      limits: { min: MIN_PLAYERS, max: MAX_PLAYERS },
      lastResults: this.phase === 'lobby' ? this.lastResults : null,
      game: null,
    };
    const g = this.game;
    if (!g) return view;

    const r = g.r;
    const revealAll = this.phase === 'roundResults' || this.phase === 'gameOver';
    const gv = { round: g.round, totalRounds: g.totalRounds, endReason: g.endReason };
    if (r) {
      const isVictim = !!me && me.id === r.victimId;
      const myCard = me ? r.cards[me.id] : null;
      const { secret, ...persona } = r.persona;
      Object.assign(gv, {
        tip: r.tip,
        victimId: r.victimId,
        persona: { ...persona, secret: isVictim || revealAll ? secret : null },
        callOrder: r.callOrder,
        callIndex: r.callIndex,
        budget: r.budget,
        budgetLeft: r.budgetLeft,
        hasCop: !!r.copId,
        chosen: r.callOrder.filter((id) => r.cards[id].mascheId),
        victimReady: r.victimReady,
        voices: Object.fromEntries(r.callOrder.map((id) => [id, r.cards[id].voice])),
        numbers: Object.fromEntries(r.callOrder.map((id) => [id, r.cards[id].number])),
        earnings: r.earnings,
        calls: r.calls.map((c) => ({ ...c, masche: MASCHE_BY_ID.get(c.mascheId) || null })),
        myRole: !me ? 'audience' : isVictim ? 'victim' : myCard ? (me.id === r.copId ? 'cop' : 'caller') : 'break',
      });
      if (myCard) {
        gv.myCard = {
          options: myCard.options.map((id) => MASCHE_BY_ID.get(id)),
          mascheId: myCard.mascheId,
          masche: myCard.mascheId ? MASCHE_BY_ID.get(myCard.mascheId) : null,
          voice: myCard.voice,
          isCop: me.id === r.copId,
          copRule: me.id === r.copId ? COP_RULE : null,
        };
      }
      if (r.call) {
        const c = r.call;
        const showMasche = !!c.endReason || (me && me.id === c.callerId);
        gv.call = {
          callerId: c.callerId,
          index: c.index,
          trust: c.trust,
          transferred: c.transferred,
          holdUntil: c.holdUntil,
          holdUsed: c.holdUsed,
          proofSent: c.proofSent,
          chaos: c.chaos,
          endReason: c.endReason,
          startedAt: c.startedAt,
          hangupFrom: c.hangupFrom,
          masche: showMasche ? MASCHE_BY_ID.get(r.cards[c.callerId].mascheId) : null,
        };
      }
      if (this.phase === 'razziaVote') {
        gv.voting = {
          voted: Object.keys(r.votes),
          myVote: me ? r.votes[me.id] || null : r.audienceVotes[socketId] || null,
          audienceVotes: Object.keys(r.audienceVotes).length,
        };
      }
      if (r.razzia && (this.phase === 'razziaReveal' || revealAll)) {
        gv.razzia = r.razzia;
        gv.copId = r.copId;
      }
      if (this.phase === 'razziaReveal' || revealAll) gv.deltas = r.deltas;
      if (revealAll) gv.copId = r.copId;
    }
    if (this.phase === 'gameOver') {
      gv.awards = g.awards;
      gv.ranking = g.ranking;
      gv.history = g.history.map((h) => ({ round: h.round, victimId: h.victimId, persona: h.persona, copId: h.copId, caught: h.razzia?.caught ?? null }));
    }
    view.game = gv;
    return view;
  }
}
