#!/usr/bin/env node
// Build all audio from script/lines.json and write the timeline every visual keys off.
//   npm run audio                       build
//   npm run audio -- --dry-run          what would be voiced, by which provider, and what it costs
//   npm run audio -- --yes              allow a run above MAX_CREDITS (billable units, any paid provider)
//   npm run audio -- --engine=<name>    voice every line with one provider (say, eleven, recording, command, openai…)
// Provider per line: --engine > speakers.<id>.engine > meta.voiceEngine > say. See scripts/voices/README.md.
// Outputs: public/audio/master.wav, src/timeline.json
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { loadScript, norm, eachLine } from "./lib/script.mjs";
import { loadEnv, envStatus, loadProviders, engineFor, planLine, renderPlanned, missingEnv, preflight } from "./lib/voices.mjs";
import { SR, SFX, renderMusic, sting, mixAt } from "./lib/synth.mjs";
import { writeWav } from "./lib/wav.mjs";
import { validate } from "./validate-lines.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];

loadEnv();
const script = loadScript();
const problems = validate(script);
if (problems.length) {
  console.error("lines.json has problems — fix them first (npm run validate):");
  problems.forEach((p) => console.error("  ✗ " + p));
  process.exit(1);
}

const meta = script.meta ?? {};
const fps = meta.fps ?? 30;
const tempo = meta.tempo ?? 1;
const bpm = meta.bpm ?? 112;
const MAX_CREDITS = Number(process.env.MAX_CREDITS ?? 3000);
const providers = await loadProviders();

// ---------- 1. plan, dry run, guards ----------
let jobs;
try {
  jobs = [...eachLine(script)].map(({ scene, line, li }) => {
    const engine = engineFor(script, line.speaker, opt("engine"));
    const ctx = { sceneId: scene.id, lineIndex: li, speakerId: line.speaker, line };
    return { scene, line, ...planLine({ providers, engine, speaker: script.speakers[line.speaker], line, ctx, tempo }) };
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const todo = jobs.filter((j) => !j.cached);
const cost = todo.reduce((s, j) => s + j.cost, 0);
const byEngine = Object.entries(Object.groupBy(jobs, (j) => j.engine));
for (const [engine, js] of byEngine) {
  const p = providers[engine];
  const c = js.reduce((s, j) => s + j.cost, 0);
  const env = (p.env ?? []).map((n) => `${n} ${envStatus(n)}`).join(", ");
  console.log(
    `${p.label ?? engine}: ${js.length} line(s), ${js.filter((j) => !j.cached).length} to generate` +
      (p.cost ? ` · ≈ ${c} ${p.costUnit ?? "units"}` : " · free") +
      (env ? ` · ${env}` : ""),
  );
}
if (flag("dry-run")) {
  todo.forEach((j) => console.log(`  + [${j.scene.id}] (${j.engine}) ${j.spoken}`));
  if (cost) console.log(`total billable ≈ ${cost} (limit MAX_CREDITS=${MAX_CREDITS})`);
  process.exit(0);
}
const missing = missingEnv(jobs);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")} — add to .env (see .env.example), or pick another provider with --engine=say`);
  process.exit(1);
}
const notReady = preflight(jobs);
if (notReady.length) {
  console.error(`${notReady.length} line(s) not ready:`);
  notReady.forEach((m) => console.error("  ✗ " + m));
  process.exit(1);
}
if (cost > MAX_CREDITS && !flag("yes")) {
  console.error(`Refusing: ≈ ${cost} billable units is above MAX_CREDITS=${MAX_CREDITS}. Re-run with --yes once approved.`);
  process.exit(2);
}

// ---------- 2. voice + layout ----------
const snap = (s) => Math.round(s * fps) / fps;
const placed = []; // { speaker, t, data }
const scenes = [];
let t = 0;
for (const [index, scene] of script.scenes.entries()) {
  const start = snap(t);
  t = start + (scene.padBefore ?? 0.25);
  const lines = [];
  const cues = [];
  for (const line of scene.lines ?? []) {
    const job = jobs.find((j) => j.line === line);
    let clip;
    try {
      clip = await renderPlanned(job);
    } catch (err) {
      console.error(`✗ [${scene.id}] (${job.engine}) "${line.text}": ${err.message}`);
      process.exit(1);
    }
    if (!clip.cached) process.stdout.write(`  voiced [${scene.id}] (${job.engine}) ${line.text}\n`);
    const ls = t;
    const dur = clip.data.length / SR;
    placed.push({ speaker: line.speaker, t: ls, data: clip.data });
    const hl = new Set((line.hl ?? []).map(norm));
    const words = clip.words.map((w) => ({ text: w.text, start: ls + w.start, end: ls + w.end, hl: hl.has(norm(w.text)) }));
    lines.push({ speaker: line.speaker, text: line.text, start: ls, end: ls + dur, words });
    const at = (c) =>
      c.w != null ? words[c.w].start : c.after != null ? ls + dur + c.after : ls + (c.t ?? 0);
    for (const c of line.sfx ?? []) cues.push({ name: c.name, t: at(c), sound: true, gain: c.gain, dropMusic: c.dropMusic });
    for (const c of line.cues ?? []) cues.push({ name: c.name, t: at(c), sound: false });
    t = ls + dur + (line.gapAfter ?? 0.15);
  }
  const end = snap(t + (scene.padAfter ?? 0.3));
  // optional scene-level cues relative to scene start
  for (const c of scene.cues ?? []) cues.push({ name: c.name, t: start + (c.t ?? 0), sound: !!SFX[c.name] && c.sound !== false });
  scenes.push({
    id: scene.id,
    kind: scene.kind ?? scene.id,
    index,
    step: scene.step ?? null,
    header: scene.header ?? null,
    captions: scene.captions ?? "pop",
    music: scene.music ?? "groove",
    props: scene.props ?? {},
    start,
    end,
    startFrame: Math.round(start * fps),
    endFrame: Math.round(end * fps),
    lines,
    cues: cues.sort((a, b) => a.t - b.t),
  });
  t = end;
}
const total = t + (meta.tail ?? 0.5);
const N = Math.ceil(total * SR);

// ---------- 3. buses ----------
const voice = new Float32Array(N);
const perSpeaker = {};
for (const p of placed) {
  mixAt(voice, p.data, p.t);
  perSpeaker[p.speaker] ??= new Float32Array(N);
  mixAt(perSpeaker[p.speaker], p.data, p.t);
}
const modeAt = (time) => (scenes.find((s) => time >= s.start && time < s.end) ?? scenes[scenes.length - 1]).music;
const music = renderMusic(total, bpm, modeAt);
mixAt(music, sting(), Math.max(0, scenes[scenes.length - 1].end - 1.0), 0.8);

const sfx = new Float32Array(N);
const drops = [];
scenes.forEach((s, i) => {
  if (i > 0 && meta.autoWhoosh !== false) mixAt(sfx, SFX.whoosh(), s.start - 0.15, 0.5);
  for (const c of s.cues) {
    if (!c.sound) continue;
    const make = SFX[c.name];
    if (!make) continue;
    const clip = make();
    mixAt(sfx, clip, c.t, c.gain ?? 0.7);
    // comedic beats: silence the music under the effect (trombone drops by default)
    const drop = c.dropMusic ?? (c.name === "trombone" ? clip.length / SR : 0);
    if (drop) drops.push([c.t, c.t + drop]);
  }
});

// ---------- 4. mix ----------
// duck music under voice with an envelope follower
const att = Math.exp(-1 / (0.01 * SR));
const rel = Math.exp(-1 / (0.25 * SR));
let e = 0;
const musicLevel = meta.musicLevel ?? 0.32;
for (let i = 0; i < N; i++) {
  const a = Math.abs(voice[i]);
  e = a > e ? att * e + (1 - att) * a : rel * e + (1 - rel) * a;
  let g = musicLevel * (1 - 0.6 * Math.min(1, e / 0.08));
  const time = i / SR;
  for (const [d0, d1] of drops) {
    if (time > d0 - 0.05 && time < d1 + 0.3) {
      const k = Math.min(1, Math.max(0, (d0 - time) / 0.05), Math.max(0, (time - d1) / 0.3));
      g *= k;
    }
  }
  if (time > total - 0.6) g *= Math.max(0, (total - time) / 0.6); // fade out
  music[i] = (music[i] ?? 0) * g;
}
const mix = new Float32Array(N);
for (let i = 0; i < N; i++) mix[i] = Math.tanh(voice[i] + music[i] + sfx[i] * 0.6); // soft clip

fs.mkdirSync("cache", { recursive: true });
fs.mkdirSync("public/audio", { recursive: true });
writeWav("cache/mix.wav", mix, SR);

// two-pass loudnorm to -14 LUFS
const LN = "I=-14:TP=-1.5:LRA=11";
const r1 = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-i", "cache/mix.wav", "-af", `loudnorm=${LN}:print_format=json`, "-f", "null", "-"],
  { encoding: "utf8" },
);
const m = JSON.parse(r1.stderr.slice(r1.stderr.lastIndexOf("{"), r1.stderr.lastIndexOf("}") + 1));
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", "cache/mix.wav", "-af",
  `loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  "-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le", "public/audio/master.wav",
]);

// ---------- 5. timeline ----------
const frames = Math.ceil(total * fps);
const mouth = {};
for (const [spk, bus] of Object.entries(perSpeaker)) {
  const per = SR / fps;
  const raw = Array.from({ length: frames }, (_, f) => {
    let s = 0;
    const a = Math.floor(f * per);
    const b = Math.min(bus.length, Math.floor((f + 1) * per));
    for (let i = a; i < b; i++) s += bus[i] * bus[i];
    return Math.sqrt(s / Math.max(1, b - a));
  });
  const sorted = raw.filter((v) => v > 0.005).sort((x, y) => x - y);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
  mouth[spk] = raw.map((v, i) => {
    const prev = raw[i - 1] ?? v;
    return Math.round(Math.min(1, ((v + prev) / 2) / p95) * 100) / 100;
  });
}
const steps = scenes.map((s) => s.step).filter((x) => x != null);
const timeline = {
  fps,
  width: meta.width ?? 1080,
  height: meta.height ?? 1920,
  duration: total,
  durationInFrames: frames,
  title: meta.title ?? "",
  footer: meta.footer ?? "",
  accent: meta.accent ?? "#FFD23F",
  totalSteps: steps.length ? Math.max(...steps) : 0,
  engines: [...new Set(jobs.map((j) => j.engine))],
  scenes,
  mouth,
};
fs.writeFileSync("src/timeline.json", JSON.stringify(timeline));
console.log(
  `✓ public/audio/master.wav + src/timeline.json · ${total.toFixed(2)} s · ${frames} frames · ${scenes.length} scenes · input ${m.input_i} LUFS → -14`,
);
