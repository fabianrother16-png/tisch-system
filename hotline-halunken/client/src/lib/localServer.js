import { Room } from '../../../server/room.js';
import { localize } from '../../../server/messages.js';

// Ersetzt in der Demo die Socket.io-Verbindung: gleiche Schnittstelle, aber der "Server" läuft im Browser.
export function createLocalSocket({ lang = 'de' } = {}) {
  const handlers = {};
  let room = null;
  let playerId = null;

  const fire = (event, data) => (handlers[event] || []).forEach((fn) => fn(data));

  function handle(event, payload) {
    switch (event) {
      case 'room:create': {
        if (room) room.clearAllTimers();
        const code = Array.from({ length: 4 }, () => 'BCDFGHJKLMNPQRSTVWXZ'[Math.floor(Math.random() * 20)]).join('');
        room = new Room(code, {
          lang: socket.auth.lang,
          onChange: (r) => r === room && fire('state', r.viewFor({ playerId })),
          onFx: (r, fx) => r === room && fire('fx', fx),
        });
        const res = room.addPlayer(payload.profile, 'local');
        playerId = res.player.id;
        return { ok: true, code, playerId, secret: res.player.secret };
      }
      case 'action':
        if (!room) return { error: 'noRoom' };
        return room.action(playerId, String(payload.type || ''), payload.data && typeof payload.data === 'object' ? payload.data : {});
      case 'react':
        return room ? room.react(playerId, payload.emoji) : { error: 'noRoom' };
      case 'room:leave':
        if (room) room.clearAllTimers();
        room = null;
        playerId = null;
        return { ok: true };
      case 'lang':
        socket.auth.lang = payload.lang;
        return { ok: true };
      default:
        // Beitreten/Zuschauen gibt es nur mit echtem Server.
        return { error: 'roomNotFound' };
    }
  }

  function send(event, payload, reply) {
    let res;
    try {
      res = handle(event, payload || {});
    } catch (err) {
      console.error(err);
      res = { error: 'serverError' };
    }
    setTimeout(() => reply(localize(res || { ok: true }, socket.auth.lang)), 0);
  }

  const socket = {
    connected: true,
    auth: { lang },
    on(event, fn) {
      (handlers[event] ||= []).push(fn);
      if (event === 'connect') setTimeout(fn, 0);
      return socket;
    },
    emit(event, payload, ack) {
      send(event, payload, (res) => typeof ack === 'function' && ack(res));
      return socket;
    },
    timeout() {
      return {
        emit: (event, payload, ack) => send(event, payload, (res) => typeof ack === 'function' && ack(null, res)),
      };
    },
  };
  return socket;
}
