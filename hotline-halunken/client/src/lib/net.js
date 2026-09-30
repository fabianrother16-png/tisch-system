import { io } from 'socket.io-client';
import { useSyncExternalStore } from 'react';
import { getPrefs, subscribePrefs } from './prefs.js';
import { DEMO } from './demo.js';
import { createLocalSocket } from './localServer.js';

// Pro Tab eine eigene Sitzung (sessionStorage): So kann man zum Testen auch mehrere Tabs öffnen,
// und ein Neuladen der Seite bringt einen trotzdem zurück ins laufende Spiel.
const SESSION_KEY = 'hh:session';

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (DEMO) return; // In der Demo gibt es nach einem Neuladen nichts wiederherzustellen.
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* privates Fenster o. Ä. */
  }
}

let snapshot = {
  view: null,
  connected: false,
  offset: 0,
  resuming: !DEMO && !!readSession(),
  notice: null,
};
const subs = new Set();

function setStore(patch) {
  snapshot = { ...snapshot, ...patch };
  for (const fn of subs) fn();
}

export function useStore() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => snapshot,
  );
}

export function subscribeStore(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function getStore() {
  return snapshot;
}

// ---------------------------------------------------------------- effects bus
const fxSubs = new Set();
export function onFx(fn) {
  fxSubs.add(fn);
  return () => fxSubs.delete(fn);
}
export function emitLocalFx(fx) {
  for (const fn of fxSubs) fn(fx);
}

// ---------------------------------------------------------------- socket
export const socket = DEMO
  ? createLocalSocket({ lang: getPrefs().lang })
  : io({ transports: ['websocket', 'polling'], reconnectionDelayMax: 3000, auth: { lang: getPrefs().lang } });

// Sprachwechsel an den Server melden (für Fehlermeldungen).
let lastLang = getPrefs().lang;
subscribePrefs(() => {
  const { lang } = getPrefs();
  if (lang === lastLang) return;
  lastLang = lang;
  socket.auth = { lang };
  if (socket.connected) socket.emit('lang', { lang }, () => {});
});

socket.on('connect', () => {
  setStore({ connected: true });
  const session = DEMO ? null : readSession();
  if (session) resume(session);
});

socket.on('disconnect', () => setStore({ connected: false }));

socket.on('state', (view) => {
  setStore({ view, offset: view.serverNow - Date.now(), resuming: false });
});

socket.on('fx', (fx) => emitLocalFx(fx));

socket.on('kicked', ({ code }) => {
  saveSession(null);
  setStore({ view: null, notice: code || 'kicked' });
});

async function resume(session) {
  setStore({ resuming: true });
  const res = session.audience
    ? await emit('room:spectate', { code: session.code, name: session.name })
    : await emit('room:resume', session);
  if (res.error) {
    saveSession(null);
    setStore({ view: null, resuming: false, notice: 'sessionExpired' });
  }
}

export function emit(event, payload = {}) {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve({ error: 'offline', code: 'offline', local: true });
      return;
    }
    socket.timeout(8000).emit(event, payload, (err, res) => {
      resolve(err ? { error: 'timeout', code: 'timeout', local: true } : res || { ok: true });
    });
  });
}

// Fehler anzeigen: Servertexte sind schon übersetzt, lokale Fehler haben einen Schlüssel.
export function showError(res) {
  if (!res?.error) return;
  emitLocalFx(res.local ? { type: 'toast', key: `err.${res.code}`, kind: 'error' } : { type: 'toast', text: res.error, kind: 'error' });
}

export async function act(type, data, { quiet = false } = {}) {
  const res = await emit('action', { type, data });
  if (res?.error && !quiet) showError(res);
  return res;
}

export async function react(emoji) {
  const res = await emit('react', { emoji });
  if (res?.error && res.code !== 'slowDown') showError(res);
}

export async function createRoom(profile) {
  const res = await emit('room:create', { profile });
  if (res.ok) saveSession({ code: res.code, playerId: res.playerId, secret: res.secret });
  return res;
}

export async function joinRoom(code, profile) {
  const res = await emit('room:join', { code, profile });
  if (res.ok) saveSession({ code: res.code, playerId: res.playerId, secret: res.secret });
  return res;
}

export async function spectate(code, name) {
  const res = await emit('room:spectate', { code, name });
  if (res.ok) saveSession({ code: res.code, audience: true, name });
  return res;
}

export async function leaveRoom() {
  await emit('room:leave');
  saveSession(null);
  setStore({ view: null });
}

export function clearNotice() {
  setStore({ notice: null });
}

export function serverNow() {
  return Date.now() + snapshot.offset;
}
