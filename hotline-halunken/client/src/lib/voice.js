import { useSyncExternalStore } from 'react';
import { emit, emitLocalFx, getStore, onFx, socket, subscribeStore } from './net.js';

// Browser-Sprachchat: Jeder Browser verbindet sich per WebRTC direkt mit den anderen (Mesh).
// Der Spielserver vermittelt nur die Verbindungsdaten ("Signale"). Audio geht nie über den Spielserver.

// ---------------------------------------------------------------- kleiner Store für die Oberfläche
let voiceState = { status: 'off', mic: false, muted: false, needsTap: false, peers: {} };
const voiceSubs = new Set();
function setVoiceState(patch) {
  voiceState = { ...voiceState, ...patch };
  for (const fn of voiceSubs) fn();
}
export function useVoice() {
  return useSyncExternalStore(
    (fn) => {
      voiceSubs.add(fn);
      return () => voiceSubs.delete(fn);
    },
    () => voiceState,
  );
}

// Wer spricht gerade? (für den Leuchtrand am Avatar)
let speaking = new Map(); // playerId -> läuft ab um
const speakSubs = new Set();
function setSpeaking(id, on) {
  const next = new Map(speaking);
  if (on) next.set(id, Date.now() + 5000);
  else next.delete(id);
  speaking = next;
  for (const fn of speakSubs) fn();
}
setInterval(() => {
  const now = Date.now();
  for (const [id, until] of speaking) if (until < now) setSpeaking(id, false);
}, 1000);
onFx((fx) => fx.type === 'speaking' && setSpeaking(fx.id, fx.on));

export function useSpeaking(id) {
  return useSyncExternalStore(
    (fn) => {
      speakSubs.add(fn);
      return () => speakSubs.delete(fn);
    },
    () => (id ? speaking.has(id) : false),
  );
}

// ---------------------------------------------------------------- Verbindungen
const peers = new Map(); // playerId -> { pc, initiator, session, sender, audio, … }
let iceServers = null;
let micStream = null;
let audioCtx = null;
let rawTrack = null;
let phoneTrack = null;
let phoneOn = false;
let enabled = false;
let rejoinAt = 0;
let speakTimer = null;

async function loadIceServers() {
  if (iceServers) return iceServers;
  try {
    const cfg = await fetch('/config.json').then((r) => r.json());
    iceServers = cfg.iceServers?.length ? cfg.iceServers : null;
  } catch {
    iceServers = null;
  }
  iceServers ||= [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  return iceServers;
}

function trace(peer, text) {
  if (!peer) return;
  (peer.log ||= []).push(`${Math.round(performance.now())} ${text}`);
  if (peer.log.length > 40) peer.log.shift();
}

function signal(to, data) {
  const peer = peers.get(to);
  if (peer) peer.sent = (peer.sent || 0) + 1;
  trace(peer, `sende ${data.description ? data.description.type : 'candidate'}`);
  socket.emit('voice:signal', { to, data }, (res) => {
    if (res?.error) trace(peers.get(to), `abgelehnt: ${res.code || res.error}`);
  });
}

function plainDescription(d) {
  return d ? { type: d.type, sdp: d.sdp } : null;
}

function currentTrack() {
  return phoneOn && phoneTrack ? phoneTrack : rawTrack;
}

function publishPeers() {
  const list = {};
  for (const [id, p] of peers) list[id] = p.pc.connectionState;
  setVoiceState({ peers: list });
}

// Pro Paar baut immer derselbe Browser die Verbindung auf (der mit der kleineren Spieler-ID),
// der andere nimmt nur an. So kommen sich nie zwei Angebote in die Quere.
function isInitiator(id) {
  const meId = getStore().view?.me?.id;
  return !!meId && meId < id;
}

function randomSession() {
  return Math.random().toString(36).slice(2, 10);
}

function createPeer(id, { initiator, session }) {
  const pc = new RTCPeerConnection({ iceServers });
  const peer = { id, pc, initiator, session, sender: null, audio: null, queue: Promise.resolve(), pending: [], watchdog: null, log: [], sent: 0, received: 0 };
  peers.set(id, peer);

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) signal(id, { session: peer.session, candidate: candidate.toJSON() });
  };
  pc.ontrack = ({ track, streams }) => {
    const stream = streams[0] || new MediaStream([track]);
    if (!peer.audio) {
      peer.audio = document.createElement('audio');
      peer.audio.autoplay = true;
      peer.audio.playsInline = true;
      peer.audio.dataset.voicePeer = id;
      peer.audio.style.display = 'none';
      document.body.appendChild(peer.audio);
    }
    peer.audio.srcObject = stream;
    peer.audio.play().catch(() => setVoiceState({ needsTap: true }));
  };
  pc.onconnectionstatechange = () => {
    trace(peer, `Status ${pc.connectionState}`);
    if (initiator && pc.connectionState === 'failed') sendOffer(peer, true);
    publishPeers();
  };

  if (initiator) {
    if (rawTrack) peer.sender = pc.addTrack(currentTrack(), micStream);
    else pc.addTransceiver('audio', { direction: 'recvonly' });
    sendOffer(peer, false);
    // Wächter: Kommt keine Verbindung zustande (z. B. Angebot verloren), neu anbieten.
    const check = () => {
      if (peers.get(id) !== peer) return;
      if (pc.connectionState !== 'connected') sendOffer(peer, true);
      peer.watchdog = setTimeout(check, 8000);
    };
    peer.watchdog = setTimeout(check, 8000);
  }
  publishPeers();
  return peer;
}

async function sendOffer(peer, restart) {
  const { pc } = peer;
  if (pc.signalingState === 'closed') return;
  try {
    const offer = await pc.createOffer(restart ? { iceRestart: true } : undefined);
    await pc.setLocalDescription(offer);
    signal(peer.id, { session: peer.session, description: plainDescription(pc.localDescription) });
  } catch (err) {
    trace(peer, `Angebot-Fehler: ${err?.message || err}`);
  }
}

function closePeer(id) {
  const peer = peers.get(id);
  if (!peer) return;
  peers.delete(id);
  clearTimeout(peer.watchdog);
  try {
    peer.pc.close();
  } catch {
    /* schon zu */
  }
  if (peer.audio) {
    peer.audio.srcObject = null;
    peer.audio.remove();
  }
  publishPeers();
}

// Signale pro Gegenüber strikt nacheinander verarbeiten.
socket.on('voice:signal', ({ from, data }) => {
  if (!enabled || !data) return;
  let peer = peers.get(from);
  const isOffer = data.description?.type === 'offer';
  if (isOffer && !isInitiator(from) && (!peer || peer.session !== data.session)) {
    // Neues Angebot (oder der andere hat neu verbunden): frische Verbindung zum Annehmen.
    if (peer) closePeer(from);
    peer = createPeer(from, { initiator: false, session: data.session });
  }
  if (!peer || (data.session && data.session !== peer.session)) return;
  peer.received++;
  trace(peer, `empfange ${data.description ? data.description.type : 'candidate'}`);
  peer.queue = peer.queue.then(() => handleSignal(peer, data)).catch(() => {});
});

async function flushCandidates(peer) {
  const list = peer.pending.splice(0);
  for (const c of list) await peer.pc.addIceCandidate(c).catch((err) => trace(peer, `Kandidat-Fehler: ${err?.message || err}`));
}

async function handleSignal(peer, data) {
  const { pc } = peer;
  if (pc.signalingState === 'closed') return;
  try {
    if (data.description?.type === 'offer') {
      await pc.setRemoteDescription(data.description);
      if (!peer.sender && rawTrack) {
        // Unser Mikrofon an die angebotene Audio-Spur hängen.
        const tr = pc.getTransceivers().find((t) => t.receiver.track?.kind === 'audio' && !t.sender.track);
        if (tr) {
          await tr.sender.replaceTrack(currentTrack());
          tr.direction = 'sendrecv';
          tr.sender.setStreams?.(micStream);
          peer.sender = tr.sender;
        } else {
          peer.sender = pc.addTrack(currentTrack(), micStream);
        }
      }
      await pc.setLocalDescription(await pc.createAnswer());
      signal(peer.id, { session: peer.session, description: plainDescription(pc.localDescription) });
      await flushCandidates(peer);
    } else if (data.description?.type === 'answer') {
      if (pc.signalingState !== 'have-local-offer') return;
      await pc.setRemoteDescription(data.description);
      await flushCandidates(peer);
    } else if (data.candidate) {
      if (!pc.remoteDescription) peer.pending.push(data.candidate);
      else await pc.addIceCandidate(data.candidate).catch((err) => trace(peer, `Kandidat-Fehler: ${err?.message || err}`));
    }
  } catch (err) {
    trace(peer, `Fehler: ${err?.message || err}`);
    console.warn('[voice] Signal fehlgeschlagen', err);
  }
}

// Gleicht die Verbindungen mit dem Spielstand ab (wer ist im Sprachchat?).
function sync() {
  if (!enabled) return;
  const view = getStore().view;
  const meId = view?.me?.id;
  if (!meId) {
    leaveVoice({ silent: true });
    return;
  }
  const me = view.players.find((p) => p.id === meId);
  // Nach einem Verbindungsabbruch meldet uns der Server als "off" – dann still wieder beitreten.
  if (me && me.voice === 'off' && Date.now() > rejoinAt) {
    rejoinAt = Date.now() + 3000;
    emit('voice:join', { mic: !!rawTrack }).then(() => voiceState.muted && emit('voice:mute', { muted: true }));
  }
  const wanted = new Set(
    view.players
      .filter((p) => p.id !== meId && p.connected && (p.voice === 'mic' || (p.voice === 'listen' && rawTrack)))
      .map((p) => p.id),
  );
  for (const id of [...peers.keys()]) if (!wanted.has(id)) closePeer(id);
  // Nur der Initiator baut auf; der andere wartet auf das Angebot.
  for (const id of wanted) if (!peers.has(id) && isInitiator(id)) createPeer(id, { initiator: true, session: randomSession() });
  updatePhoneEffect(view);
}
subscribeStore(sync);

// Telefon-Effekt: Anrufer und Opfer klingen während des Anrufs wie durchs Telefon (wird beim Senden erzeugt).
function updatePhoneEffect(view) {
  const call = view.game?.call;
  const meId = view.me?.id;
  const inCall = view.phase === 'call' && call && (call.callerId === meId || view.game.victimId === meId);
  const want = !!(view.settings.phoneFx && inCall && phoneTrack && audioCtx?.state === 'running');
  if (want === phoneOn) return;
  phoneOn = want;
  for (const peer of peers.values()) peer.sender?.replaceTrack(currentTrack()).catch(() => {});
}

function buildAudioGraph() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !micStream) return;
  audioCtx = new AC();
  audioCtx.resume().catch(() => {});
  const source = audioCtx.createMediaStreamSource(micStream);

  // Telefon-Klang: Bandpass + etwas Verzerrung
  const high = audioCtx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = 450;
  const low = audioCtx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 3000;
  const shaper = audioCtx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = Math.tanh(2.2 * x);
  }
  shaper.curve = curve;
  const gain = audioCtx.createGain();
  gain.gain.value = 1.3;
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(high).connect(low).connect(shaper).connect(gain).connect(dest);
  phoneTrack = dest.stream.getAudioTracks()[0];

  // Sprech-Erkennung
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let loud = 0;
  let quietSince = 0;
  let talking = false;
  let lastSent = 0;
  speakTimer = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const now = Date.now();
    const active = rms > 0.03 && !voiceState.muted;
    if (active) {
      loud++;
      quietSince = 0;
    } else {
      loud = 0;
      quietSince ||= now;
    }
    const next = talking ? !(quietSince && now - quietSince > 700) : loud >= 1;
    if (next !== talking || (talking && now - lastSent > 3000)) {
      talking = next;
      lastSent = now;
      const meId = getStore().view?.me?.id;
      if (meId) setSpeaking(meId, talking);
      socket.emit('voice:speaking', { on: talking }, () => {});
    }
  }, 120);
}

export function voiceSupport() {
  if (!window.RTCPeerConnection) return 'unsupported';
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return 'insecure';
  return 'ok';
}

export async function joinVoice() {
  if (enabled || voiceState.status === 'connecting') return;
  const support = voiceSupport();
  if (support === 'unsupported') {
    emitLocalFx({ type: 'toast', key: 'voice.unsupported', kind: 'error' });
    return;
  }
  setVoiceState({ status: 'connecting' });
  let mic = false;
  if (support === 'ok') {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      rawTrack = micStream.getAudioTracks()[0] || null;
      mic = !!rawTrack;
    } catch (err) {
      emitLocalFx({ type: 'toast', key: err?.name === 'NotAllowedError' ? 'voice.denied' : 'voice.nomic', kind: 'error' });
    }
  } else {
    emitLocalFx({ type: 'toast', key: 'voice.insecure', kind: 'error' });
  }
  await loadIceServers();
  if (mic) buildAudioGraph();
  const res = await emit('voice:join', { mic });
  if (res.error) {
    leaveVoice({ silent: true });
    emitLocalFx({ type: 'toast', text: res.error, kind: 'error' });
    return;
  }
  rejoinAt = Date.now() + 3000; // der Spielstand mit unserem neuen Status ist noch unterwegs
  enabled = true;
  setVoiceState({ status: 'on', mic, muted: false });
  sync();
}

export function leaveVoice({ silent = false } = {}) {
  const wasEnabled = enabled;
  enabled = false;
  for (const id of [...peers.keys()]) closePeer(id);
  clearInterval(speakTimer);
  speakTimer = null;
  micStream?.getTracks().forEach((t) => t.stop());
  micStream = null;
  rawTrack = null;
  phoneTrack = null;
  phoneOn = false;
  audioCtx?.close().catch(() => {});
  audioCtx = null;
  const meId = getStore().view?.me?.id;
  if (meId) setSpeaking(meId, false);
  if (wasEnabled && !silent) emit('voice:leave');
  setVoiceState({ status: 'off', mic: false, muted: false, needsTap: false, peers: {} });
}

export function setMicMuted(muted) {
  if (!rawTrack) return;
  rawTrack.enabled = !muted;
  setVoiceState({ muted });
  emit('voice:mute', { muted });
}

// Falls der Browser das automatische Abspielen blockiert hat.
export function resumePlayback() {
  audioCtx?.resume().catch(() => {});
  for (const peer of peers.values()) peer.audio?.play().catch(() => {});
  setVoiceState({ needsTap: false });
}

// Für automatische Tests: Verbindungsstatus und empfangene Audiodaten.
window.__hhVoice = {
  async stats() {
    const out = [];
    for (const [id, peer] of peers) {
      let bytesReceived = 0;
      const report = await peer.pc.getStats();
      report.forEach((r) => {
        if (r.type === 'inbound-rtp' && r.kind === 'audio') bytesReceived += r.bytesReceived || 0;
      });
      const pc = peer.pc;
      out.push({
        id,
        state: pc.connectionState,
        bytesReceived,
        signaling: pc.signalingState,
        ice: pc.iceConnectionState,
        gathering: pc.iceGatheringState,
        local: pc.localDescription?.type || null,
        remote: pc.remoteDescription?.type || null,
        initiator: peer.initiator,
        sent: peer.sent || 0,
        received: peer.received || 0,
        log: (peer.log || []).slice(-12),
      });
    }
    return out;
  },
};
