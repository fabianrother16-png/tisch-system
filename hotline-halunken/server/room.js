import crypto from 'node:crypto';
import { getContent, LANGS } from './content/index.js';
import { botsOnChat, botsOnPhase } from './bots.js';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_AUDIENCE = 300;
export const CUSTOM_LIMIT = 40;
export const CHAT_MAX_LENGTH = 180;
const CHAT_HISTORY = 120;

export const AVATARS = ['🦊', '🐸', '🐷', '🐵', '🐔', '🦄', '🐙', '🐼', '🐯', '🐻', '🐨', '🦁', '🐺', '🦝', '🐧', '🦉', '🐹', '🐮', '🦆', '🐲', '👽', '🤖', '🤡', '👻'];
export const COLORS = ['#FF4F8B', '#FFD23F', '#3DDCFF', '#3CF08C', '#B57BFF', '#FF8A3D', '#FF5A5A', '#2EC4B6', '#F9A8FF', '#A3E635', '#60A5FA', '#FDBA74'];
export const REACTIONS = ['😂', '💀', '🤡', '🔥', '😱', '👏', '🚨', '💸', '🤔', '❤️'];
export const SOUNDS = ['airhorn', 'kaching', 'typing', 'modem', 'drumroll', 'sad', 'ding', 'buzzer', 'boing'];

export const DEFAULT_SETTINGS = {
  lang: 'de',
  callMode: 'voice', // voice = per Voice-Chat telefonieren, chat = per Nachrichten schreiben
  rounds: 0, // 0 = automatisch: jeder einmal Opfer (max. 6 Runden)
  callSeconds: 60,
  maxCallers: 5,
  budget: 1000,
  cop: true,
  chaos: true,
  voices: true,
  audience: true,
  customOnly: false,
};

const SETTING_OPTIONS = {
  rounds: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12],
  callSeconds: [30, 45, 60, 75, 90, 120],
  maxCallers: [2, 3, 4, 5, 6, 8, 11],
  budget: [500, 1000, 2000, 5000],
};
const ENUM_SETTINGS = { lang: LANGS, callMode: ['voice', 'chat'] };
const BOOL_SETTINGS = ['cop', 'chaos', 'voices', 'audience', 'customOnly'];

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
  chatCooldown: 700,
  typingCooldown: 1500,
  allChosenDelay: 1500,
};

const TRANSFER_FRACTIONS = [0.05, 0.1, 0.25, 0.5];

const err = (code, vars) => ({ error: code, vars });

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

// Kartenstapel ohne Wiederholungen. "priority"-Karten (eigene Karten) werden zuerst gezogen.
class Deck {
  constructor(items, random, priority = []) {
    this.items = items;
    this.priority = priority;
    this.random = random;
    this.pile = [];
  }
  refill(exclude) {
    const keep = (c) => !exclude || c.id !== exclude.id;
    this.pile = [...shuffle(this.items.filter(keep), this.random), ...shuffle(this.priority.filter(keep), this.random)];
    if (!this.pile.length) this.pile = [...this.items, ...this.priority];
  }
  draw(exclude) {
    if (!this.pile.length) this.refill();
    let card = this.pile.pop();
    if (exclude && card.id === exclude.id) {
      if (!this.pile.length) this.refill(exclude);
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

export function cleanText(text, max) {
  return String(text ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanEmoji(value, fallback) {
  const v = String(value ?? '').trim();
  return v && v.length <= 8 && /\p{Extended_Pictographic}/u.test(v) ? v : fallback;
}

// Eigene Karten des Hosts prüfen und kürzen.
export function sanitizeCustom(input) {
  const out = { maschen: [], personas: [] };
  if (!input || typeof input !== 'object') return out;
  const list = (v) => (Array.isArray(v) ? v.slice(0, CUSTOM_LIMIT) : []);
  for (const m of list(input.maschen)) {
    const title = cleanText(m?.title, 40);
    const pitch = cleanText(m?.pitch, 220);
    if (!title || !pitch) continue;
    out.maschen.push({ title, pitch, caller: cleanText(m.caller, 50) || title, emoji: cleanEmoji(m.emoji, '📞') });
  }
  for (const p of list(input.personas)) {
    const name = cleanText(p?.name, 30);
    const bio = cleanText(p?.bio, 140);
    if (!name || !bio) continue;
    out.personas.push({
      name,
      bio,
      age: cleanText(p.age, 12) || '?',
      likes: cleanText(p.likes, 80) || '–',
      hates: cleanText(p.hates, 80) || '–',
      secret: cleanText(p.secret, 140) || null,
      emoji: cleanEmoji(p.emoji, '🙂'),
    });
  }
  return out;
}

function freshStats() {
  return { calls: 0, earned: 0, bestCall: 0, hungUp: 0, onHold: 0, given: 0, detective: 0, copEscaped: 0, copCaught: 0, wrongArrest: 0, reactions: 0, victimRounds: 0 };
}

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
    this.settings = { ...DEFAULT_SETTINGS, lang: LANGS.includes(opts.lang) ? opts.lang : DEFAULT_SETTINGS.lang };
    this.custom = { maschen: [], personas: [] };
    this.phase = 'lobby';
    this.phaseSeq = 0;
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

  content() {
    return this.game?.content || getContent(this.settings.lang);
  }

  masche(id) {
    return this.game?.mascheById.get(id) || null;
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
    this.phaseSeq++;
    this.phaseEndsAt = duration ? this.now() + duration : null;
    this.phaseCallback = onEnd || null;
    if (duration && onEnd) this.schedule('phase', duration, onEnd);
    this.changed();
    botsOnPhase(this);
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
  uniqueName(wanted) {
    let name = cleanName(wanted) || 'Halunke';
    const taken = new Set(this.players.map((p) => p.name.toLowerCase()));
    if (taken.has(name.toLowerCase())) {
      let i = 2;
      while (taken.has(`${name.slice(0, 13)} ${i}`.toLowerCase())) i++;
      name = `${name.slice(0, 13)} ${i}`;
    }
    return name;
  }

  addPlayer(profile, socketId, { bot = false } = {}) {
    if (this.phase !== 'lobby') return err('gameRunning');
    if (this.players.length >= MAX_PLAYERS) return err('roomFull', { max: MAX_PLAYERS });
    const player = {
      id: randomId(),
      secret: randomId(18),
      name: this.uniqueName(profile?.name),
      avatar: AVATARS.includes(profile?.avatar) ? profile.avatar : AVATARS[Math.floor(this.random() * AVATARS.length)],
      color: this.pickColor(profile?.color),
      socketId,
      connected: true,
      left: false,
      bot,
      score: 0,
      stats: freshStats(),
    };
    this.players.push(player);
    if (!this.hostId && !bot) this.hostId = player.id;
    this.changed();
    return { player };
  }

  addBot() {
    if (this.phase !== 'lobby') return err('lobbyOnly');
    const names = this.content().BOT_NAMES;
    const taken = new Set(this.players.map((p) => p.name));
    const name = names.find((n) => !taken.has(n)) || names[0];
    const res = this.addPlayer({ name }, null, { bot: true });
    return res.error ? res : { ok: true };
  }

  pickColor(wanted, exceptId) {
    const used = new Set(this.players.filter((p) => p.id !== exceptId).map((p) => p.color));
    if (COLORS.includes(wanted) && !used.has(wanted)) return wanted;
    return COLORS.find((c) => !used.has(c)) || COLORS[Math.floor(this.random() * COLORS.length)];
  }

  reconnect(playerId, secret, socketId) {
    const p = this.player(playerId);
    if (!p || p.bot || p.secret !== secret || p.left) return err('sessionExpired');
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
    const next = this.players.find((p) => p.connected && !p.bot);
    if (next) {
      this.hostId = next.id;
      this.fx({ type: 'toast', key: 'newHost', vars: { name: next.name } });
    } else if (!current) {
      this.hostId = this.players.find((p) => !p.bot)?.id || null;
    }
    this.changed();
  }

  addAudience(socketId, name) {
    if (!this.settings.audience) return err('audienceDisabled');
    if (this.audience.size >= MAX_AUDIENCE) return err('audienceFull');
    this.audience.set(socketId, { name: cleanName(name) || '👀' });
    this.changed();
    return { ok: true };
  }

  removeAudience(socketId) {
    if (this.audience.delete(socketId)) this.changed();
  }

  // Bots allein halten einen Raum nicht am Leben.
  isEmpty() {
    return !this.players.some((p) => p.connected && !p.bot) && this.audience.size === 0;
  }

  // ------------------------------------------------------------------ actions
  action(playerId, type, data = {}) {
    const p = this.player(playerId);
    if (!p) return err('notInRoom');
    const isHost = p.id === this.hostId;
    const hostOnly = () => (isHost ? null : err('hostOnly'));
    switch (type) {
      case 'settings': return hostOnly() || this.updateSettings(data);
      case 'custom': return hostOnly() || this.setCustom(data);
      case 'profile': return this.updateProfile(p, data);
      case 'kick': return hostOnly() || this.kick(data.playerId);
      case 'addBot': return hostOnly() || this.addBot();
      case 'start': return hostOnly() || this.startGame();
      case 'choose': return this.chooseMasche(p, data.mascheId);
      case 'ready': return this.victimReady(p);
      case 'transfer': return this.transfer(p, data.amount);
      case 'trust': return this.setTrust(p, data.value);
      case 'hold': return this.hold(p);
      case 'hangup': return this.hangup(p);
      case 'proof': return this.sendProof(p);
      case 'sound': return this.playSound(p, data.id);
      case 'chat': return this.chat(p, data.text);
      case 'typing': return this.typing(p);
      case 'vote': return this.vote(p, data.suspectId);
      case 'skip': return hostOnly() || this.skip();
      case 'pause': return hostOnly() || this.pause();
      case 'resume': return hostOnly() || this.resume();
      case 'lobby': return hostOnly() || this.backToLobby();
      case 'endGame': return hostOnly() || this.endGame('hostEnded');
      default: return err('unknownAction');
    }
  }

  updateSettings(data) {
    if (this.phase !== 'lobby') return err('lobbyOnly');
    for (const [key, options] of Object.entries(SETTING_OPTIONS)) {
      if (key in data && options.includes(Number(data[key]))) this.settings[key] = Number(data[key]);
    }
    for (const [key, options] of Object.entries(ENUM_SETTINGS)) {
      if (key in data && options.includes(data[key])) this.settings[key] = data[key];
    }
    for (const key of BOOL_SETTINGS) {
      if (key in data) this.settings[key] = Boolean(data[key]);
    }
    this.changed();
    return { ok: true };
  }

  setCustom(data) {
    if (this.phase !== 'lobby') return err('lobbyOnly');
    this.custom = sanitizeCustom(data);
    this.changed();
    return { ok: true, counts: { maschen: this.custom.maschen.length, personas: this.custom.personas.length } };
  }

  updateProfile(p, data) {
    if (this.phase !== 'lobby') return err('lobbyOnly');
    if ('name' in data) {
      const name = cleanName(data.name);
      if (!name) return err('nameEmpty');
      if (this.players.some((x) => x.id !== p.id && x.name.toLowerCase() === name.toLowerCase())) return err('nameTaken');
      p.name = name;
    }
    if ('avatar' in data && AVATARS.includes(data.avatar)) p.avatar = data.avatar;
    if ('color' in data) p.color = this.pickColor(data.color, p.id);
    this.changed();
    return { ok: true };
  }

  kick(targetId) {
    if (this.phase !== 'lobby') return err('lobbyOnly');
    const target = this.player(targetId);
    if (!target || target.id === this.hostId) return err('playerNotFound');
    const socketId = target.socketId;
    this.removePlayer(target.id);
    if (!target.bot) this.onKick(this, target, socketId);
    return { ok: true };
  }

  // ------------------------------------------------------------------ game flow
  buildDecks(C) {
    const customMaschen = this.custom.maschen.map((m, i) => ({
      id: `custom-m-${i}`,
      emoji: m.emoji,
      title: m.title,
      caller: m.caller,
      pitch: m.pitch,
      tips: [],
      proof: C.customProof(m.title),
      custom: true,
    }));
    const customPersonas = this.custom.personas.map((p, i) => ({ id: `custom-p-${i}`, ...p, savings: C.DEFAULT_SAVINGS, custom: true }));
    const only = this.settings.customOnly;
    const mode = this.settings.callMode;
    return {
      mascheById: new Map([...C.MASCHEN, ...customMaschen].map((m) => [m.id, m])),
      decks: {
        maschen: new Deck(only && customMaschen.length >= 2 ? [] : C.MASCHEN, this.random, customMaschen),
        personas: new Deck(only && customPersonas.length >= 1 ? [] : C.PERSONAS, this.random, customPersonas),
        voices: new Deck(C.VOICES, this.random),
        chaos: new Deck(C.CHAOS.filter((c) => !c.mode || c.mode === mode), this.random),
      },
    };
  }

  startGame() {
    if (this.phase !== 'lobby') return err('alreadyRunning');
    this.players = this.players.filter((p) => p.connected);
    for (const t of [...this.timers.keys()]) if (t.startsWith('remove:')) this.clearTimer(t);
    if (this.players.length < MIN_PLAYERS) return err('needPlayers', { min: MIN_PLAYERS });
    if (!this.player(this.hostId)) this.hostId = this.players.find((p) => !p.bot)?.id || this.players[0].id;
    for (const p of this.players) {
      p.score = 0;
      p.stats = freshStats();
    }
    const n = this.players.length;
    const C = getContent(this.settings.lang);
    this.game = {
      content: C,
      round: 0,
      totalRounds: this.settings.rounds || Math.min(n, 6),
      victimQueue: shuffle(this.players.map((p) => p.id), this.random),
      ...this.buildDecks(C),
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
    if (present.filter((p) => !p.bot).length === 0 || present.length < MIN_PLAYERS) return this.endGame('tooFew');
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
        number: g.content.fakeNumber(this.random),
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
      tip: g.content.TIPS[Math.floor(this.random() * g.content.TIPS.length)],
    };
    victim.stats.victimRounds++;
    this.setPhase('roles', this.d(DUR.roles), () => this.beginCalls());
  }

  chooseMasche(p, mascheId) {
    if (this.phase !== 'roles') return err('notNow');
    const card = this.game.r.cards[p.id];
    if (!card || !card.options.includes(mascheId)) return err('invalidMasche');
    card.mascheId = mascheId;
    this.changed();
    this.checkProgress();
    return { ok: true };
  }

  victimReady(p) {
    if (this.phase !== 'roles' || this.game.r.victimId !== p.id) return err('notNow');
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
      r.calls.push({ callerId: id, mascheId: r.cards[id].mascheId, transferred: 0, endReason: 'offline', trust: 50, reactions: 0, chaos: null, messages: 0 });
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
      chatAt: {},
      typingAt: {},
      messages: [],
      msgSeq: 0,
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
    const callerName = this.player(c.callerId)?.name || this.game.content.FALLBACK_CALLER;
    const text = card.text.replaceAll('{caller}', callerName).replaceAll('{victim}', r.persona.name);
    c.chaos = { id: card.id, emoji: card.emoji, target: card.target, text };
    this.systemMessage({ kind: 'chaos', emoji: card.emoji, text });
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
      messages: c.messages.filter((m) => m.from !== 'system').length,
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
    if (this.phase !== 'call') return err('noCall');
    if (this.paused) return err('paused');
    const r = this.game.r;
    if (role === 'victim' && p.id !== r.victimId) return err('victimOnly');
    if (role === 'caller' && p.id !== r.call.callerId) return err('callerOnly');
    if (role === 'both' && p.id !== r.victimId && p.id !== r.call.callerId) return err('partiesOnly');
    return null;
  }

  addScore(id, amount) {
    const p = this.player(id);
    if (!p) return;
    p.score += amount;
    this.game.r.deltas[id] = (this.game.r.deltas[id] || 0) + amount;
  }

  systemMessage(data) {
    const c = this.game?.r?.call;
    if (!c) return;
    c.messages.push({ id: ++c.msgSeq, from: 'system', at: this.now(), ...data });
    if (c.messages.length > CHAT_HISTORY) c.messages.shift();
  }

  transfer(p, rawAmount) {
    const e = this.callActionGuard(p, 'victim');
    if (e) return e;
    const r = this.game.r;
    const c = r.call;
    let amount = rawAmount === 'all' ? r.budgetLeft : Number(rawAmount);
    if (rawAmount !== 'all' && !this.chips().includes(amount)) return err('invalidAmount');
    amount = Math.min(amount, r.budgetLeft);
    if (amount <= 0) return err('broke');
    r.budgetLeft -= amount;
    c.transferred += amount;
    r.earnings[c.callerId] = (r.earnings[c.callerId] || 0) + amount;
    this.addScore(c.callerId, amount);
    const caller = this.player(c.callerId);
    if (caller) caller.stats.earned += amount;
    p.stats.given += amount;
    this.systemMessage({ kind: 'transfer', amount });
    this.fx({ type: 'transfer', amount, callerId: c.callerId, budgetLeft: r.budgetLeft, all: rawAmount === 'all' });
    this.changed();
    return { ok: true };
  }

  setTrust(p, value) {
    const e = this.callActionGuard(p, 'victim');
    if (e) return e;
    const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    this.game.r.call.trust = v;
    this.fx({ type: 'trust', value: v });
    return { ok: true };
  }

  hold(p) {
    const e = this.callActionGuard(p, 'victim');
    if (e) return e;
    const c = this.game.r.call;
    if (c.holdUsed) return err('holdUsed');
    if (this.phaseEndsAt - this.now() < this.d(3000)) return err('holdTooLate');
    c.holdUsed = true;
    c.holdUntil = this.now() + this.d(DUR.hold);
    const caller = this.player(c.callerId);
    if (caller) caller.stats.onHold++;
    this.schedule('hold', this.d(DUR.hold), () => {
      c.holdUntil = null;
      this.fx({ type: 'holdEnd' });
      this.changed();
    });
    this.systemMessage({ kind: 'hold' });
    this.fx({ type: 'hold', until: c.holdUntil });
    this.changed();
    return { ok: true };
  }

  hangup(p) {
    const e = this.callActionGuard(p, 'victim');
    if (e) return e;
    const c = this.game.r.call;
    if (this.now() < c.hangupFrom) return err('hangupGrace');
    this.endCall('hangup');
    return { ok: true };
  }

  sendProof(p) {
    const e = this.callActionGuard(p, 'caller');
    if (e) return e;
    const r = this.game.r;
    const c = r.call;
    if (c.proofSent) return err('proofUsed');
    c.proofSent = true;
    const masche = this.masche(r.cards[p.id].mascheId);
    this.systemMessage({ kind: 'proof', title: masche.proof.title });
    this.fx({ type: 'proof', proof: masche.proof, callerId: p.id });
    this.changed();
    return { ok: true };
  }

  playSound(p, id) {
    const e = this.callActionGuard(p, 'both');
    if (e) return e;
    if (!SOUNDS.includes(id)) return err('unknownSound');
    const c = this.game.r.call;
    const last = c.soundAt[p.id] || 0;
    if (this.now() - last < this.d(DUR.soundCooldown)) return err('cooldown');
    c.soundAt[p.id] = this.now();
    this.fx({ type: 'sfx', id, from: p.id });
    return { ok: true };
  }

  chat(p, text) {
    const e = this.callActionGuard(p, 'both');
    if (e) return e;
    if (this.settings.callMode !== 'chat') return err('notChatMode');
    const c = this.game.r.call;
    const from = p.id === c.callerId ? 'caller' : 'victim';
    if (from === 'caller' && c.holdUntil && c.holdUntil > this.now()) return err('onHold');
    const clean = cleanText(text, CHAT_MAX_LENGTH);
    if (!clean) return err('emptyMessage');
    if (this.now() - (c.chatAt[p.id] || 0) < this.d(DUR.chatCooldown)) return err('cooldown');
    c.chatAt[p.id] = this.now();
    const msg = { id: ++c.msgSeq, from, text: clean, at: this.now() };
    c.messages.push(msg);
    if (c.messages.length > CHAT_HISTORY) c.messages.shift();
    this.fx({ type: 'chat', from });
    this.changed();
    botsOnChat(this, msg);
    return { ok: true };
  }

  typing(p) {
    const e = this.callActionGuard(p, 'both');
    if (e) return e;
    if (this.settings.callMode !== 'chat') return err('notChatMode');
    const c = this.game.r.call;
    if (this.now() - (c.typingAt[p.id] || 0) < DUR.typingCooldown) return { ok: true };
    c.typingAt[p.id] = this.now();
    this.fx({ type: 'typing', from: p.id === c.callerId ? 'caller' : 'victim' });
    return { ok: true };
  }

  // Reaktionen dürfen alle schicken – auch Zuschauer.
  react(fromId, emoji, audienceName) {
    if (!REACTIONS.includes(emoji)) return err('unknownReaction');
    const p = fromId ? this.player(fromId) : null;
    const c = this.game?.r?.call;
    if (this.phase === 'call' && c && fromId !== c.callerId) c.reactions++;
    this.fx({ type: 'reaction', emoji, name: p?.name || audienceName || '👀', color: p?.color || '#ffffff', audience: !p });
    return { ok: true };
  }

  vote(p, suspectId) {
    if (this.phase !== 'razziaVote') return err('noVote');
    const r = this.game.r;
    if (!r.callOrder.includes(suspectId)) return err('invalidVote');
    if (suspectId === p.id) return err('selfVote');
    r.votes[p.id] = suspectId;
    this.changed();
    this.checkProgress();
    return { ok: true };
  }

  audienceVote(socketId, suspectId) {
    if (this.phase !== 'razziaVote' || !this.audience.has(socketId)) return err('notNow');
    const r = this.game.r;
    if (!r.callOrder.includes(suspectId)) return err('invalidVote');
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
    if (!this.game) return err('noGame');
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

  // Awards: Titel und Texte übersetzt der Client anhand der id.
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
      { id: 'mvp', emoji: '🏆', unit: 'money', pick: best((p) => p.score, 0) },
      { id: 'coup', emoji: '💰', unit: 'money', pick: best((p) => p.stats.bestCall) },
      { id: 'generous', emoji: '💸', unit: 'money', pick: best((p) => p.stats.given) },
      { id: 'hungup', emoji: '📵', unit: 'times', pick: best((p) => p.stats.hungUp) },
      { id: 'hold', emoji: '🎵', unit: 'times', pick: best((p) => p.stats.onHold) },
      { id: 'detective', emoji: '🕵️', unit: 'times', pick: best((p) => p.stats.detective) },
      { id: 'cop', emoji: '🚔', unit: 'times', pick: best((p) => p.stats.copEscaped) },
      { id: 'wrong', emoji: '🤡', unit: 'times', pick: best((p) => p.stats.wrongArrest) },
      { id: 'fanfav', emoji: '🔥', unit: 'times', pick: best((p) => p.stats.reactions) },
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
    if (this.phase === 'lobby' || this.phase === 'gameOver') return err('nothingToSkip');
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
    if (this.paused || this.phase === 'lobby' || this.phase === 'gameOver') return err('cantPause');
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
    if (!this.paused) return err('notPaused');
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
    this.fx({ type: 'resume', holdUntil: c?.holdUntil || null });
    this.changed();
    return { ok: true };
  }

  // ------------------------------------------------------------------ views
  publicPlayer(p) {
    return { id: p.id, name: p.name, avatar: p.avatar, color: p.color, connected: p.connected, left: p.left, bot: p.bot, score: p.score };
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
      custom: { maschen: this.custom.maschen.length, personas: this.custom.personas.length },
      audienceCount: this.audience.size,
      me: me ? { id: me.id, isHost: me.id === this.hostId } : null,
      players: this.players.map((p) => this.publicPlayer(p)),
      chips: this.chips(),
      limits: { min: MIN_PLAYERS, max: MAX_PLAYERS, chat: CHAT_MAX_LENGTH },
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
        calls: r.calls.map((c) => ({ ...c, masche: this.masche(c.mascheId) })),
        myRole: !me ? 'audience' : isVictim ? 'victim' : myCard ? (me.id === r.copId ? 'cop' : 'caller') : 'break',
      });
      if (myCard) {
        gv.myCard = {
          options: myCard.options.map((id) => this.masche(id)),
          mascheId: myCard.mascheId,
          masche: myCard.mascheId ? this.masche(myCard.mascheId) : null,
          voice: myCard.voice,
          isCop: me.id === r.copId,
          copRule: me.id === r.copId ? g.content.COP_RULE : null,
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
          messages: c.messages,
          masche: showMasche ? this.masche(r.cards[c.callerId].mascheId) : null,
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
