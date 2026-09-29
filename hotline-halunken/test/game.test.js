import { test } from 'node:test';
import assert from 'node:assert/strict';
import { io as connect } from 'socket.io-client';
import { createServer } from '../server/index.js';
import { Room, sanitizeCustom } from '../server/room.js';

// Zeitraffer: 1 Sekunde Spielzeit = 20 ms
const TIME_SCALE = 0.02;

const openClients = new Set();

function makeClient(url, lang) {
  const socket = connect(url, { transports: ['websocket'], forceNew: true, auth: lang ? { lang } : undefined });
  openClients.add(socket);
  const client = { socket, state: null, fx: [], waiters: [] };
  socket.on('state', (s) => {
    client.state = s;
    client.waiters = client.waiters.filter((w) => {
      if (w.pred(s)) {
        w.resolve(s);
        return false;
      }
      return true;
    });
  });
  socket.on('fx', (f) => client.fx.push(f));
  client.emit = (event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));
  client.act = (type, data) => client.emit('action', { type, data });
  client.waitFor = (pred, label = 'state', timeout = 4000) =>
    new Promise((resolve, reject) => {
      if (client.state && pred(client.state)) return resolve(client.state);
      const timer = setTimeout(() => reject(new Error(`Timeout beim Warten auf: ${label} (Phase: ${client.state?.phase})`)), timeout);
      client.waiters.push({ pred, resolve: (s) => { clearTimeout(timer); resolve(s); } });
    });
  return client;
}

test('komplettes Spiel: Lobby → Runden → Razzia → Awards → Lobby', async () => {
  const srv = createServer({ timeScale: TIME_SCALE, logger: { error() {} } });
  const port = await srv.listen(0);
  const url = `http://localhost:${port}`;
  const [a, b, c, d, viewer] = Array.from({ length: 5 }, () => makeClient(url));
  try {
    const created = await a.emit('room:create', { profile: { name: 'Anna', avatar: '🦊' } });
    assert.ok(created.ok, JSON.stringify(created));
    const code = created.code;
    assert.match(code, /^[A-Z]{4}$/);

    for (const [cl, name] of [[b, 'Ben'], [c, 'Cem'], [d, 'Dana']]) {
      const res = await cl.emit('room:join', { code: code.toLowerCase(), profile: { name } });
      assert.ok(res.ok, JSON.stringify(res));
    }
    const dup = await makeClient(url).emit('room:join', { code, profile: { name: 'anna' } });
    assert.ok(dup.ok, 'doppelter Name wird umbenannt statt abgelehnt');
    // Der fünfte (Duplikat) verlässt den Raum wieder, damit wir 4 Spieler haben.
    const spec = await viewer.emit('room:spectate', { code, name: 'Chat' });
    assert.ok(spec.ok);

    await a.waitFor((s) => s.players.length === 5, '5 Spieler');
    const anna2 = a.state.players.find((p) => p.name === 'anna 2');
    assert.ok(anna2, 'Duplikat heißt "anna 2"');
    assert.equal((await b.act('kick', { playerId: anna2.id })).error, 'Nur der Host kann das.');
    assert.ok((await a.act('kick', { playerId: anna2.id })).ok);
    await a.waitFor((s) => s.players.length === 4, '4 Spieler nach Kick');

    assert.ok((await a.act('settings', { rounds: 2, callSeconds: 30, cop: true })).ok);
    await b.waitFor((s) => s.settings.rounds === 2 && s.settings.callSeconds === 30, 'Settings synchron');

    assert.ok((await a.act('start')).ok);
    const players = [a, b, c, d];
    await Promise.all(players.map((p) => p.waitFor((s) => s.phase === 'roles', 'Rollen')));
    await viewer.waitFor((s) => s.phase === 'roles', 'Zuschauer sieht Rollen');

    for (let round = 1; round <= 2; round++) {
      await Promise.all([...players, viewer].map((p) => p.waitFor((s) => s.phase === 'roles' && s.game.round === round, `Runde ${round}`)));
      const roles = players.map((p) => p.state.game.myRole);
      assert.equal(roles.filter((r) => r === 'victim').length, 1, 'genau ein Opfer');
      assert.equal(roles.filter((r) => r === 'cop').length, 1, 'genau ein Cop');
      assert.equal(roles.filter((r) => r === 'caller').length, 2, 'zwei normale Halunken');
      for (const p of players) assert.equal(p.state.game.copId, undefined, 'Cop bleibt geheim');
      assert.equal(viewer.state.game.myRole, 'audience');
      assert.equal(viewer.state.game.persona.secret, null, 'Zuschauer sieht Geheimnis nicht');

      const victim = players.find((p) => p.state.game.myRole === 'victim');
      const cop = players.find((p) => p.state.game.myRole === 'cop');
      const callers = players.filter((p) => p !== victim);
      assert.ok(victim.state.game.persona.secret, 'Opfer kennt sein Geheimnis');
      assert.ok(cop.state.game.myCard.copRule);

      for (const cl of callers) {
        const card = cl.state.game.myCard;
        assert.equal(card.options.length, 2);
        assert.notEqual(card.options[0].id, card.options[1].id);
        assert.ok((await cl.act('choose', { mascheId: card.options[1].id })).ok);
      }
      assert.ok((await victim.act('ready')).ok);

      const callOrder = victim.state.game.callOrder;
      for (let i = 0; i < callOrder.length; i++) {
        const s = await victim.waitFor((st) => st.phase === 'call' && st.game.call.index === i, `Anruf ${i + 1}`);
        const callerId = s.game.call.callerId;
        const callerClient = players.find((p) => p.state.me.id === callerId);
        assert.ok(callerClient.state.game.call.masche, 'Anrufer sieht eigene Masche');
        assert.equal(victim.state.game.call.masche, null, 'Opfer sieht Masche erst nach dem Anruf');

        assert.equal((await callerClient.act('transfer', { amount: 100 })).error, 'Nur das Opfer kann das.');
        const before = s.players.find((p) => p.id === callerId).score;
        assert.ok((await victim.act('transfer', { amount: s.chips[i % 4] })).ok);
        assert.ok((await victim.act('trust', { value: 80 })).ok);
        assert.ok((await callerClient.act('proof')).ok);
        assert.ok((await callerClient.act('proof')).error, 'Beweis nur einmal');
        assert.ok((await callerClient.act('sound', { id: 'airhorn' })).ok);
        await victim.waitFor(
          (st) => st.players.find((p) => p.id === callerId).score === before + s.chips[i % 4],
          'Punkte nach Überweisung',
        );
        if (i === 0) {
          assert.ok((await victim.act('hold')).ok);
          assert.ok((await victim.act('hold')).error, 'Warteschleife nur einmal');
        }
        if (i === 1) {
          // Nach Ablauf der Schonfrist darf aufgelegt werden.
          await new Promise((res) => setTimeout(res, 200));
          assert.ok((await victim.act('hangup')).ok);
        }
        await victim.waitFor((st) => st.phase === 'callSummary', 'Anruf-Zusammenfassung');
        assert.ok(victim.state.game.call.masche, 'Masche nach dem Anruf aufgedeckt');
      }

      await Promise.all(players.map((p) => p.waitFor((s) => s.phase === 'razziaVote', 'Razzia')));
      const copId = cop.state.me.id;
      assert.ok((await viewer.act('vote', { suspectId: copId })).ok, 'Zuschauer tippt');
      assert.ok((await cop.act('vote', { suspectId: copId })).error, 'Cop kann sich nicht selbst wählen');
      for (const p of players) {
        const target = p === cop ? callOrder.find((id) => id !== copId) : copId;
        assert.ok((await p.act('vote', { suspectId: target })).ok);
      }
      const reveal = await a.waitFor((s) => s.phase === 'razziaReveal', 'Aufdeckung');
      assert.equal(reveal.game.razzia.copId, copId);
      assert.equal(reveal.game.razzia.caught, true);
      assert.equal(reveal.game.razzia.correct.length, 3);
      assert.equal(reveal.game.razzia.audienceTally[copId], 1);

      await a.waitFor((s) => s.phase === 'roundResults', 'Rundenergebnis');
      if (round === 1) {
        assert.ok((await a.act('pause')).ok);
        await b.waitFor((s) => s.paused, 'pausiert');
        assert.ok((await a.act('resume')).ok);
        await b.waitFor((s) => !s.paused, 'weiter');
        assert.ok((await a.act('skip')).ok);
      }
    }

    const over = await a.waitFor((s) => s.phase === 'gameOver', 'Spielende', 6000);
    assert.equal(over.game.ranking.length, 4);
    assert.ok(over.game.awards.some((aw) => aw.id === 'mvp'));
    assert.ok(over.game.awards.some((aw) => aw.id === 'detective'));
    const fxTypes = new Set(b.fx.map((f) => f.type));
    for (const t of ['transfer', 'trust', 'proof', 'sfx', 'hold', 'callEnd']) assert.ok(fxTypes.has(t), `FX ${t} empfangen`);

    assert.ok((await a.act('lobby')).ok);
    const lobby = await b.waitFor((s) => s.phase === 'lobby', 'zurück in der Lobby');
    assert.equal(lobby.lastResults.ranking.length, 4);
  } finally {
    for (const s of openClients) s.close();
    await srv.close();
  }
});

test('Wiederverbinden behält Rolle und Punkte', async () => {
  const srv = createServer({ timeScale: 1, logger: { error() {} } });
  const port = await srv.listen(0);
  const url = `http://localhost:${port}`;
  const [a, b, c] = Array.from({ length: 3 }, () => makeClient(url));
  try {
    const created = await a.emit('room:create', { profile: { name: 'Anna' } });
    const joinB = await b.emit('room:join', { code: created.code, profile: { name: 'Ben' } });
    await c.emit('room:join', { code: created.code, profile: { name: 'Cem' } });
    await a.act('start');
    const before = await b.waitFor((s) => s.phase === 'roles', 'Rollen');
    const role = before.game.myRole;
    b.socket.close();
    await a.waitFor((s) => s.players.find((p) => p.id === joinB.playerId).connected === false, 'Ben offline');

    const b2 = makeClient(url);
    const res = await b2.emit('room:resume', { code: created.code, playerId: joinB.playerId, secret: joinB.secret });
    assert.ok(res.ok, JSON.stringify(res));
    const after = await b2.waitFor((s) => s.phase === 'roles', 'wieder da');
    assert.equal(after.game.myRole, role);
    const bad = await makeClient(url).emit('room:resume', { code: created.code, playerId: joinB.playerId, secret: 'falsch' });
    assert.ok(bad.error);
  } finally {
    for (const s of openClients) s.close();
    await srv.close();
  }
});

test('Raum-Logik: Cop-Flucht beschlagnahmt die Beute des reichsten Halunken', () => {
  let t = 1000;
  const room = new Room('TEST', { now: () => t, random: () => 0.1, timeScale: 1000 });
  const ids = ['A', 'B', 'C', 'D'].map((n) => room.addPlayer({ name: n }, n).player.id);
  room.startGame();
  const r = room.game.r;
  const callers = r.callOrder;
  const cop = r.copId;
  const others = callers.filter((id) => id !== cop);
  r.earnings[others[0]] = 300;
  room.player(others[0]).score = 300;
  r.earnings[others[1]] = 100;
  room.player(others[1]).score = 100;
  room.phase = 'razziaVote';
  // Alle beschuldigen einen Unschuldigen → Cop entkommt.
  for (const id of ids) r.votes[id] = id === others[1] ? others[0] : others[1];
  room.clearAllTimers();
  room.resolveRazzia();
  room.clearAllTimers();
  assert.equal(r.razzia.caught, false);
  assert.equal(r.razzia.arrestedId, others[1]);
  assert.deepEqual(r.razzia.confiscated, { fromId: others[0], amount: 300 });
  assert.equal(room.player(others[0]).score, 0);
  assert.equal(room.player(cop).score, 300 + 300);
});

test('Raumwechsel: alter Spieler verlässt den alten Raum', async () => {
  const srv = createServer({ timeScale: 1, logger: { error() {} } });
  const port = await srv.listen(0);
  const url = `http://localhost:${port}`;
  const [a, b] = Array.from({ length: 2 }, () => makeClient(url));
  try {
    const first = await a.emit('room:create', { profile: { name: 'Anna' } });
    await b.emit('room:join', { code: first.code, profile: { name: 'Ben' } });
    await b.waitFor((s) => s.players.length === 2, 'beide in Raum 1');
    const second = await b.emit('room:create', { profile: { name: 'Ben' } });
    assert.ok(second.ok);
    await a.waitFor((s) => s.players.length === 1, 'Ben hat Raum 1 verlassen');
    const stateB = await b.waitFor((s) => s.code === second.code, 'Ben in Raum 2');
    assert.equal(stateB.players.length, 1);
    // Ben bekommt keine Updates mehr aus Raum 1
    await a.act('settings', { rounds: 3 });
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(b.state.code, second.code);
  } finally {
    for (const s of openClients) s.close();
    await srv.close();
  }
});

test('Bots spielen ein komplettes Spiel im Chat-Modus mit', async () => {
  const srv = createServer({ timeScale: TIME_SCALE, logger: { error() {} } });
  const port = await srv.listen(0);
  const host = makeClient(`http://localhost:${port}`);
  try {
    const created = await host.emit('room:create', { profile: { name: 'Solo' } });
    assert.ok(created.ok);
    for (let i = 0; i < 3; i++) assert.ok((await host.act('addBot')).ok);
    await host.waitFor((s) => s.players.length === 4 && s.players.filter((p) => p.bot).length === 3, '3 Bots');
    assert.ok((await host.act('settings', { callMode: 'chat', rounds: 2, callSeconds: 30 })).ok);
    await host.waitFor((s) => s.settings.callMode === 'chat', 'Chat-Modus');
    let chatSeen = 0;
    let botTransfers = 0;
    host.socket.on('state', (s) => {
      const msgs = s.game?.call?.messages || [];
      chatSeen = Math.max(chatSeen, msgs.filter((m) => m.from !== 'system').length);
    });
    host.socket.on('fx', (f) => {
      if (f.type === 'transfer') botTransfers++;
    });
    assert.ok((await host.act('start')).ok);
    // Wenn der Mensch dran ist, schreibt er auch eine Nachricht.
    host.socket.on('state', async (s) => {
      if (s.phase === 'call' && (s.game.myRole === 'victim' || s.game.call?.callerId === s.me.id) && !s.game.call.messages.some((m) => m.text === 'Ich bin ein Mensch!')) {
        await host.act('chat', { text: 'Ich bin ein Mensch!' });
      }
    });
    const over = await host.waitFor((s) => s.phase === 'gameOver', 'Spielende mit Bots', 25000);
    assert.equal(over.game.ranking.length, 4);
    assert.ok(chatSeen >= 2, `Chat-Nachrichten gesehen: ${chatSeen}`);
    assert.ok(botTransfers >= 0);
  } finally {
    for (const s of openClients) s.close();
    await srv.close();
  }
});

test('Englische Fehlermeldungen und Chat nur im Chat-Modus', async () => {
  const srv = createServer({ timeScale: 1, logger: { error() {} } });
  const port = await srv.listen(0);
  const url = `http://localhost:${port}`;
  const a = makeClient(url, 'en');
  const b = makeClient(url, 'en');
  try {
    const created = await a.emit('room:create', { profile: { name: 'Amy' } });
    const lobby = await a.waitFor((s) => s.code === created.code, 'Lobby');
    assert.equal(lobby.settings.lang, 'en', 'Raum übernimmt Sprache des Hosts');
    await b.emit('room:join', { code: created.code, profile: { name: 'Bob' } });
    const res = await b.act('kick', { playerId: created.playerId });
    assert.equal(res.error, 'Only the host can do that.');
    assert.equal(res.code, 'hostOnly');
    const missing = await makeClient(url, 'en').emit('room:join', { code: 'ZZZZ', profile: { name: 'X' } });
    assert.equal(missing.error, 'Room not found. Check the code!');
  } finally {
    for (const s of openClients) s.close();
    await srv.close();
  }
});

test('Eigene Karten werden geprüft und zuerst gezogen', () => {
  const clean = sanitizeCustom({
    maschen: [
      { title: 'Kaffee-Abo für Katzen', pitch: 'Jede Katze braucht Espresso.', emoji: '☕' },
      { title: '  ', pitch: 'fehlt' },
      { title: 'Bitcoin-Toaster', pitch: 'Toastet und schürft.', emoji: 'kein emoji' },
      'Unsinn',
    ],
    personas: [{ name: 'Tante Inge', bio: 'Liebt Kreuzworträtsel.' }, { name: 'Ohne Bio' }],
  });
  assert.equal(clean.maschen.length, 2);
  assert.equal(clean.maschen[1].emoji, '📞');
  assert.equal(clean.personas.length, 1);

  const room = new Room('TEST', { timeScale: 1000 });
  const host = room.addPlayer({ name: 'A' }, 'a').player;
  room.addPlayer({ name: 'B' }, 'b');
  room.addPlayer({ name: 'C' }, 'c');
  assert.ok(room.action(host.id, 'custom', clean).ok);
  assert.ok(room.action(host.id, 'settings', { customOnly: true }).ok);
  assert.ok(room.action(host.id, 'start').ok);
  const r = room.game.r;
  assert.equal(r.persona.name, 'Tante Inge');
  for (const id of r.callOrder) for (const m of r.cards[id].options) assert.match(m, /^custom-m-/);
  const view = room.viewFor({ playerId: r.callOrder[0] });
  assert.ok(view.game.myCard.options[0].proof.title.startsWith('OFFIZIELL'));
  room.clearAllTimers();
});
