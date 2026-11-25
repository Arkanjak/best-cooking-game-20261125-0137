// Sizzle & Serve — sound: tiny WebAudio synth, no audio files.
// Every effect is a short oscillator/noise burst built at runtime, so the
// game ships zero media and still sizzles, dings and cha-chings.
let audioCtx = null;
let muted = false;

export function ensureAudio() {
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function noiseBurst(dur, vol = 0.08, filterFreq = 1200) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.1, 760); },
  chop() { noiseBurst(0.07, 0.14, 700); tone(180, 0.06, 'square', 0.06, 120); },
  sizzle() { noiseBurst(0.35, 0.05, 3200); },
  ding() { tone(880, 0.25, 'sine', 0.12); setTimeout(() => tone(1318, 0.3, 'sine', 0.1), 90); },
  coin() { tone(988, 0.1, 'square', 0.07); setTimeout(() => tone(1319, 0.22, 'square', 0.07), 80); },
  error() { tone(220, 0.18, 'sawtooth', 0.08, 140); },
  burn() { tone(160, 0.4, 'sawtooth', 0.09, 70); noiseBurst(0.3, 0.06, 500); },
  serve() { tone(659, 0.12, 'triangle', 0.1); setTimeout(() => tone(784, 0.12, 'triangle', 0.1), 100); setTimeout(() => tone(1047, 0.25, 'triangle', 0.1), 200); },
  tick() { tone(1150, 0.04, 'square', 0.04); },
  gameOver() { [523, 392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.1), i * 160)); },
};
