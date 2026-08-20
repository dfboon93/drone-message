// WebAudio-synthesized ambience — zero audio assets. The AudioContext is
// only ever created inside a user gesture (gate tap / Preview click), which
// cleanly satisfies browser autoplay policies.

const PAD_NOTES = [110, 164.81, 220]; // A2, E3, A3
const PING_FREQS = [880, 1174.66, 1318.51, 1760];

let ctx = null;
let master = null;
let muted = false;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);

  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  padGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 600;

  for (const freq of PAD_NOTES) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 8;
    osc.connect(lowpass);
    osc.start();
  }
  lowpass.connect(padGain);
  padGain.connect(master);

  // Slow LFO breathing on the pad volume.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain);
  lfoGain.connect(padGain.gain);
  lfo.start();

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
}

export function twinkle(n = 4) {
  if (!ctx || ctx.state !== 'running') return;
  const count = 3 + ((Math.random() * (n - 2)) | 0);
  for (let i = 0; i < count; i++) {
    const start = ctx.currentTime + Math.random() * 0.4;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = PING_FREQS[(Math.random() * PING_FREQS.length) | 0];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    osc.connect(g);
    g.connect(master);
    osc.start(start);
    osc.stop(start + 0.7);
  }
}

export function toggleMute() {
  muted = !muted;
  if (ctx && master) {
    master.gain.linearRampToValueAtTime(muted ? 0 : 1, ctx.currentTime + 0.2);
  }
  return muted;
}

export function isMuted() {
  return muted;
}
