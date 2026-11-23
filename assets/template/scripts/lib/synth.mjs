// Music bed and cartoon SFX generated from maths, so there are no licensing questions.
// Everything is mono Float32 at SR. Deterministic: same input → same audio.

export const SR = 48000;
const TAU = Math.PI * 2;

// ---------- helpers ----------
function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
const buf = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));

/** Mix `src` into `dst` starting at time t (seconds). */
export function mixAt(dst, src, t, gain = 1) {
  const o = Math.round(t * SR);
  for (let i = 0; i < src.length; i++) {
    const j = o + i;
    if (j >= 0 && j < dst.length) dst[j] += src[i] * gain;
  }
}

function lowpass(x, cutoffAt) {
  // one-pole lowpass; cutoffAt(i) returns Hz for sample i
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const a = 1 - Math.exp((-TAU * cutoffAt(i)) / SR);
    y += a * (x[i] - y);
    x[i] = y;
  }
  return x;
}
const highpass = (x) => {
  let prev = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    x[i] = v - prev;
    prev = v;
  }
  return x;
};

/** Sine with exponential pitch glide f0→f1 and exponential amplitude decay. */
function glide(sec, f0, f1, decay, shape = Math.sin) {
  const out = buf(sec);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const p = i / out.length;
    const f = f0 * (f1 / f0) ** p;
    ph += (TAU * f) / SR;
    out[i] = shape(ph) * Math.exp((-i / SR) / decay);
  }
  return out;
}
const tri = (ph) => (2 / Math.PI) * Math.asin(Math.sin(ph));
const sq = (ph) => (Math.sin(ph) >= 0 ? 0.6 : -0.6);
const saw = (ph) => 0.7 * (Math.sin(ph) + Math.sin(2 * ph) / 2 + Math.sin(3 * ph) / 3);

function noise(sec, seed) {
  const r = rng(seed);
  const out = buf(sec);
  for (let i = 0; i < out.length; i++) out[i] = r() * 2 - 1;
  return out;
}
function env(x, attack, release) {
  const n = x.length;
  const a = Math.max(1, Math.round(attack * SR));
  const r = Math.max(1, Math.round(release * SR));
  for (let i = 0; i < n; i++) {
    let g = 1;
    if (i < a) g = i / a;
    if (i > n - r) g = Math.min(g, (n - i) / r);
    x[i] *= g;
  }
  return x;
}

// ---------- instruments ----------
const kick = () => glide(0.35, 130, 42, 0.12);
function snare(seed) {
  const n = noise(0.2, seed);
  for (let i = 0; i < n.length; i++) n[i] *= Math.exp(-i / SR / 0.05) * 0.6;
  highpass(n);
  mixAt(n, glide(0.12, 200, 160, 0.05), 0, 0.5);
  return n;
}
function hat(seed) {
  const n = highpass(highpass(noise(0.05, seed)));
  for (let i = 0; i < n.length; i++) n[i] *= Math.exp(-i / SR / 0.012) * 0.35;
  return n;
}
function bass(freq, sec) {
  const out = buf(sec);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    ph += (TAU * freq) / SR;
    out[i] = saw(ph) * Math.exp(-i / SR / (sec * 0.8));
  }
  return env(lowpass(out, () => 500), 0.005, 0.03);
}
function marimba(freq) {
  const out = buf(0.6);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] =
      Math.sin(TAU * freq * t) * Math.exp(-t / 0.25) +
      0.25 * Math.sin(TAU * freq * 4 * t) * Math.exp(-t / 0.04);
  }
  return env(out, 0.002, 0.05);
}
function pad(freqs, sec) {
  const out = buf(sec);
  for (const f of freqs) {
    for (const d of [-0.12, 0.12]) {
      const fd = f * 2 ** (d / 12);
      for (let i = 0; i < out.length; i++) out[i] += tri((TAU * fd * i) / SR) * 0.12;
    }
  }
  return env(lowpass(out, () => 1400), Math.min(0.4, sec / 3), Math.min(0.5, sec / 3));
}

// ---------- music ----------
// Chords as MIDI roots (minor: m, major: M). One chord per bar.
const CHORDS = { Am: [57, "m"], F: [53, "M"], C: [48, "M"], G: [55, "M"], E: [52, "M"], Dm: [50, "m"] };
const triad = ([root, q]) => [root, root + (q === "m" ? 3 : 4), root + 7];

export const MUSIC_MODES = {
  // prog: chord per bar · drums: which hits · arp: marimba notes per beat · level: overall gain
  tension: { prog: ["Am", "Am", "F", "E"], kick: [0], snare: [], hat: [1, 3], arp: 1, pad: true, level: 0.8 },
  groove: { prog: ["C", "Am", "F", "G"], kick: [0, 2], snare: [1, 3], hat: [0, 1, 2, 3], arp: 2, pad: false, level: 1 },
  hype: { prog: ["F", "G", "Am", "C"], kick: [0, 1, 2, 3], snare: [1, 3], hat: [0, 1, 2, 3], arp: 2, pad: true, level: 1.1 },
  dark: { prog: ["Am", "Dm", "Am", "E"], kick: [0], snare: [], hat: [], arp: 0, pad: true, level: 0.7 },
  soft: { prog: ["C", "G", "Am", "F"], kick: [], snare: [], hat: [], arp: 1, pad: true, level: 0.6 },
  none: { prog: ["C"], kick: [], snare: [], hat: [], arp: 0, pad: false, level: 0 },
};

/**
 * Render the music bed on a constant BPM grid.
 * modeAt(t) → mode name for the beat starting at t.
 */
export function renderMusic(totalSec, bpm, modeAt) {
  const out = buf(totalSec);
  const beat = 60 / bpm;
  for (let b = 0; b * beat < totalSec; b++) {
    const t = b * beat;
    const m = MUSIC_MODES[modeAt(t)] ?? MUSIC_MODES.groove;
    if (!m.level) continue;
    const bar = Math.floor(b / 4);
    const inBar = b % 4;
    const chord = triad(CHORDS[m.prog[bar % m.prog.length]]);
    const g = m.level;
    if (m.kick.includes(inBar)) mixAt(out, kick(), t, 0.9 * g);
    if (m.snare.includes(inBar)) mixAt(out, snare(b), t, 0.5 * g);
    if (m.hat.includes(inBar)) {
      mixAt(out, hat(b * 2), t, 0.5 * g);
      mixAt(out, hat(b * 2 + 1), t + beat / 2, 0.3 * g);
    }
    mixAt(out, bass(midiHz(chord[0] - 12), beat * 0.9), t, 0.35 * g);
    for (let k = 0; k < m.arp; k++) {
      const note = chord[(b * m.arp + k) % 3] + 12;
      mixAt(out, marimba(midiHz(note)), t + (k * beat) / m.arp, 0.18 * g);
    }
    if (m.pad && inBar === 0) mixAt(out, pad(chord.map(midiHz), beat * 4), t, 0.5 * g);
  }
  return out;
}

/** Short major-chord sting for the end card. */
export function sting() {
  const out = buf(1.4);
  [60, 64, 67, 72].forEach((n, i) => mixAt(out, marimba(midiHz(n + 12)), i * 0.06, 0.3));
  mixAt(out, pad([60, 64, 67].map(midiHz), 1.4), 0, 0.5);
  return out;
}

// ---------- SFX ----------
export const SFX = {
  whoosh: () => {
    const n = noise(0.45, 7);
    lowpass(n, (i) => 300 + 5000 * Math.sin((Math.PI * i) / n.length));
    return env(n, 0.15, 0.2).map((v) => v * 0.9);
  },
  pop: () => env(glide(0.09, 500, 1300, 0.04), 0.001, 0.02),
  ding: () => {
    const a = glide(0.9, 1320, 1320, 0.3);
    mixAt(a, glide(0.9, 1980, 1980, 0.18), 0, 0.4);
    return env(a, 0.002, 0.1).map((v) => v * 0.5);
  },
  boing: () => {
    const out = buf(0.6);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      ph += (TAU * (220 + 180 * t + 60 * Math.sin(TAU * 14 * t))) / SR;
      out[i] = Math.sin(ph) * Math.exp(-t / 0.25) * 0.6;
    }
    return env(out, 0.002, 0.05);
  },
  thud: () => {
    const a = glide(0.3, 90, 40, 0.08);
    const n = lowpass(noise(0.3, 3), () => 400);
    mixAt(a, n.map((v, i) => v * Math.exp(-i / SR / 0.03)), 0, 0.6);
    return a;
  },
  slam: () => {
    const a = SFX.thud();
    const n = highpass(noise(0.2, 11)).map((v, i) => v * Math.exp(-i / SR / 0.04));
    mixAt(a, n, 0, 0.5);
    return a.map((v) => v * 1.2);
  },
  sparkle: () => {
    const out = buf(0.8);
    const r = rng(5);
    for (let k = 0; k < 7; k++) {
      mixAt(out, glide(0.25, 2000 + r() * 2500, 2500 + r() * 2500, 0.06), k * 0.08, 0.25);
    }
    return out;
  },
  error: () => {
    const out = buf(0.45);
    mixAt(out, env(glide(0.15, 220, 220, 1, sq), 0.002, 0.01), 0, 0.5);
    mixAt(out, env(glide(0.2, 180, 180, 1, sq), 0.002, 0.02), 0.2, 0.5);
    return out;
  },
  trombone: () => {
    const out = buf(1.9);
    [[58, 0.35], [57, 0.35], [56, 0.35], [55, 0.8]].reduce((t, [n, d]) => {
      const tone = buf(d);
      let ph = 0;
      for (let i = 0; i < tone.length; i++) {
        const tt = i / SR;
        const wob = n === 55 ? 0.3 * Math.sin(TAU * 6 * tt) : 0;
        ph += (TAU * midiHz(n - 12 + wob)) / SR;
        tone[i] = saw(ph) * 0.4;
      }
      mixAt(out, env(lowpass(tone, () => 1200), 0.02, 0.05), t);
      return t + d;
    }, 0);
    return out;
  },
  typing: () => {
    const out = buf(0.9);
    const r = rng(9);
    for (let t = 0; t < 0.85; t += 0.05 + r() * 0.07) {
      mixAt(out, highpass(noise(0.012, Math.round(t * 1000))).map((v, i) => v * Math.exp(-i / SR / 0.003)), t, 0.5);
    }
    return out;
  },
  zap: () => env(glide(0.22, 1800, 90, 0.1, sq), 0.001, 0.03),
  tick: () => env(glide(0.03, 2500, 2500, 0.008), 0.001, 0.005),
};
