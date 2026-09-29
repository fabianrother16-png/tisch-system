import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { Room, cleanName } from './room.js';
import { localize } from './messages.js';
import { LANGS } from './content/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ';
const MAX_ROOMS = 5000;

export function createServer({ timeScale = Number(process.env.HH_TIME_SCALE) || 1, logger = console } = {}) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    pingInterval: 10000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e5,
    cors: process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined,
  });

  const rooms = new Map();

  // ------------------------------------------------------------------ http
  app.disable('x-powered-by');
  app.set('trust proxy', true); // hinter Render/Railway/Fly: https korrekt erkennen
  app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));
  if (fs.existsSync(DIST)) {
    const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    app.use(express.static(DIST, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/socket.io')) return next();
      // Link-Vorschauen (Discord, WhatsApp …) brauchen eine absolute Bild-URL.
      const origin = `${req.protocol}://${req.get('host')}`;
      res.type('html').set('Cache-Control', 'no-cache').send(indexHtml.replaceAll('content="/og.png"', `content="${origin}/og.png"`));
    });
  } else {
    app.get('/', (_req, res) =>
      res.type('text').send('HOTLINE HALUNKEN Server läuft. Frontend fehlt: erst "npm run build" ausführen oder "npm run dev" nutzen.'),
    );
  }

  // ------------------------------------------------------------------ rooms
  function newCode() {
    for (let tries = 0; tries < 1000; tries++) {
      let code = '';
      for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      if (!rooms.has(code)) return code;
    }
    throw new Error('Keine freien Raumcodes');
  }

  const audienceChannel = (code) => `${code}:audience`;

  function broadcastState(room) {
    for (const p of room.players) {
      if (p.connected && p.socketId) io.to(p.socketId).emit('state', room.viewFor({ playerId: p.id }));
    }
    if (!room.audience.size) return;
    // Zuschauer sehen alle dasselbe – außer ihrem eigenen Razzia-Tipp.
    if (room.phase === 'razziaVote') {
      for (const socketId of room.audience.keys()) io.to(socketId).emit('state', room.viewFor({ socketId }));
    } else {
      io.to(audienceChannel(room.code)).emit('state', room.viewFor({}));
    }
  }

  function createRoom(lang) {
    const code = newCode();
    const room = new Room(code, {
      lang,
      timeScale,
      onChange: broadcastState,
      onFx: (r, fx) => io.to(r.code).emit('fx', fx),
      onKick: (r, _player, socketId) => {
        if (!socketId) return;
        const s = io.sockets.sockets.get(socketId);
        if (s) {
          s.emit('kicked', { code: 'kicked' });
          s.leave(r.code);
          if (s.data.ctx) s.data.ctx.code = null;
        }
      },
    });
    rooms.set(code, room);
    return room;
  }

  function normalizeCode(code) {
    return String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  }

  // Aufräumen: leere Räume nach 10 Minuten löschen, alles nach 12 Stunden Inaktivität.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      const idle = now - room.lastActivity;
      if ((room.isEmpty() && idle > 10 * 60 * 1000) || idle > 12 * 60 * 60 * 1000) {
        room.clearAllTimers();
        rooms.delete(code);
      }
    }
  }, 60 * 1000);
  cleanup.unref();

  // ------------------------------------------------------------------ sockets
  io.on('connection', (socket) => {
    const wantedLang = socket.handshake.auth?.lang;
    const ctx = { code: null, playerId: null, audience: false, lang: LANGS.includes(wantedLang) ? wantedLang : 'de' };
    socket.data.ctx = ctx;
    const bucket = { tokens: 20, last: Date.now() };
    const reactBucket = { tokens: 6, last: Date.now() };

    const take = (b, rate, burst) => {
      const now = Date.now();
      b.tokens = Math.min(burst, b.tokens + ((now - b.last) / 1000) * rate);
      b.last = now;
      if (b.tokens < 1) return false;
      b.tokens -= 1;
      return true;
    };

    const room = () => (ctx.code ? rooms.get(ctx.code) : null);

    const on = (event, handler, limiter = () => take(bucket, 15, 20)) => {
      socket.on(event, (payload, ack) => {
        const reply = typeof ack === 'function' ? ack : () => {};
        if (!limiter()) return reply(localize({ error: 'slowDown' }, ctx.lang));
        try {
          reply(localize(handler(payload && typeof payload === 'object' ? payload : {}) || { ok: true }, ctx.lang));
        } catch (err) {
          logger.error('[socket]', event, err);
          reply(localize({ error: 'serverError' }, ctx.lang));
        }
      });
    };

    // Trennt diesen Socket von seinem aktuellen Raum. Wer in einen anderen Raum wechselt, verlässt den alten.
    function detach() {
      const r = room();
      if (!r) return;
      if (ctx.audience) r.removeAudience(socket.id);
      else if (ctx.playerId && r.player(ctx.playerId)?.socketId === socket.id) r.leave(ctx.playerId);
      socket.leave(r.code);
      socket.leave(audienceChannel(r.code));
      ctx.code = null;
      ctx.playerId = null;
      ctx.audience = false;
    }

    function attachPlayer(r, player) {
      detach();
      ctx.code = r.code;
      ctx.playerId = player.id;
      socket.join(r.code);
      socket.emit('state', r.viewFor({ playerId: player.id }));
      return { ok: true, code: r.code, playerId: player.id, secret: player.secret };
    }

    on('lang', ({ lang }) => {
      if (LANGS.includes(lang)) ctx.lang = lang;
      return { ok: true };
    });

    on('room:create', ({ profile }) => {
      if (rooms.size >= MAX_ROOMS) return { error: 'serverFull' };
      const r = createRoom(ctx.lang);
      const res = r.addPlayer(profile, socket.id);
      if (res.error) return res;
      return attachPlayer(r, res.player);
    });

    on('room:join', ({ code, profile }) => {
      const r = rooms.get(normalizeCode(code));
      if (!r) return { error: 'roomNotFound' };
      const res = r.addPlayer(profile, socket.id);
      if (res.error) return { ...res, canSpectate: r.settings.audience };
      return attachPlayer(r, res.player);
    });

    on('room:resume', ({ code, playerId, secret }) => {
      const r = rooms.get(normalizeCode(code));
      if (!r) return { error: 'roomGone' };
      const res = r.reconnect(String(playerId || ''), String(secret || ''), socket.id);
      if (res.error) return res;
      if (res.previousSocket && res.previousSocket !== socket.id) {
        const old = io.sockets.sockets.get(res.previousSocket);
        if (old) {
          old.emit('kicked', { code: 'otherTab' });
          old.leave(r.code);
          if (old.data.ctx) old.data.ctx.code = null;
        }
      }
      return attachPlayer(r, res.player);
    });

    on('room:spectate', ({ code, name }) => {
      const r = rooms.get(normalizeCode(code));
      if (!r) return { error: 'roomNotFound' };
      detach();
      const res = r.addAudience(socket.id, cleanName(name));
      if (res.error) return res;
      ctx.code = r.code;
      ctx.audience = true;
      socket.join(r.code);
      socket.join(audienceChannel(r.code));
      socket.emit('state', r.viewFor({ socketId: socket.id }));
      return { ok: true, code: r.code };
    });

    on('room:leave', () => {
      detach();
      return { ok: true };
    });

    on('action', ({ type, data }) => {
      const r = room();
      if (!r) return { error: 'noRoom' };
      if (ctx.audience) {
        if (type === 'vote') return r.audienceVote(socket.id, data?.suspectId);
        return { error: 'audienceCant' };
      }
      return r.action(ctx.playerId, String(type || ''), data && typeof data === 'object' ? data : {});
    }, () => take(bucket, 25, 30));

    on('react', ({ emoji }) => {
      const r = room();
      if (!r) return { error: 'noRoom' };
      const name = ctx.audience ? r.audience.get(socket.id)?.name : null;
      return r.react(ctx.audience ? null : ctx.playerId, emoji, name);
    }, () => take(reactBucket, 4, 6));

    socket.on('disconnect', () => {
      const r = room();
      if (!r) return;
      if (ctx.audience) r.removeAudience(socket.id);
      else if (ctx.playerId) {
        const p = r.player(ctx.playerId);
        if (p && p.socketId === socket.id) r.disconnect(ctx.playerId);
      }
    });
  });

  return {
    app,
    server,
    io,
    rooms,
    listen(port) {
      return new Promise((resolve) => server.listen(port, () => resolve(server.address().port)));
    },
    close() {
      clearInterval(cleanup);
      return new Promise((resolve) => {
        io.close(() => resolve());
        for (const r of rooms.values()) r.clearAllTimers();
      });
    },
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const srv = createServer();
  srv.listen(port).then((p) => {
    console.log(`📞 HOTLINE HALUNKEN läuft auf http://localhost:${p}`);
  });
}
