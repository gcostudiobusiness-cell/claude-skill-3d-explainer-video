// Voice engine core. Providers live in scripts/voices/<name>.mjs (see the README there).
// This file does everything providers have in common: choosing the provider per line, caching by a hash of
// every input, cost estimates, env checks, tempo, silence trimming, level matching and word timings.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readWav, writeWav } from "./wav.mjs";
import { SR } from "./synth.mjs";
import { tokens, norm } from "./script.mjs";

const CACHE = "cache/voice";
const VOICES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "voices");
const CACHE_VERSION = 2;

// ---------- .env (no dependency) ----------
export function loadEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
/** Never print a key — only whether it is set and how long it is. */
export const envStatus = (name) => (process.env[name] ? `set (${process.env[name].length} chars)` : "missing");

// ---------- providers ----------
export async function loadProviders() {
  const out = {};
  for (const f of fs.readdirSync(VOICES_DIR).filter((x) => x.endsWith(".mjs") && !x.startsWith("_"))) {
    const p = (await import(pathToFileURL(path.join(VOICES_DIR, f)).href)).default;
    if (!p?.name || typeof p.synth !== "function") throw new Error(`voices/${f}: default export needs name + synth()`);
    out[p.name] = p;
  }
  return out;
}

/** Text actually sent to a provider: pronBy[engine] > pronEleven (legacy) > pron > text. */
export const spokenFor = (line, engine) =>
  line.pronBy?.[engine] ?? (engine === "eleven" ? line.pronEleven : undefined) ?? line.pron ?? line.text;

/** Which provider voices this line: --engine > speaker.engine > style.audio.voiceEngine > say. */
export const engineFor = (script, speakerId, override, fallback = "say") =>
  override ?? script.speakers?.[speakerId]?.engine ?? fallback;

/**
 * Work out everything about a line before generating it: provider, settings, cache key, cost.
 * ctx: { sceneId, lineIndex, speakerId, line }
 */
export function planLine({ providers, engine, speaker, line, ctx, tempo = 1 }) {
  const provider = providers[engine];
  if (!provider) throw new Error(`unknown voice provider "${engine}" (have: ${Object.keys(providers).join(", ")})`);
  const cfg = speaker?.[engine] ?? {};
  const spoken = spokenFor(line, engine);
  const key = crypto
    .createHash("sha256")
    .update(JSON.stringify({ engine, cfg, spoken, text: line.text, tempo, extra: provider.cacheExtra?.(ctx, cfg) ?? null, v: CACHE_VERSION }))
    .digest("hex")
    .slice(0, 16);
  const cached = fs.existsSync(path.join(CACHE, `${key}.json`)) && fs.existsSync(path.join(CACHE, `${key}.wav`));
  const cost = cached ? 0 : (provider.cost?.(spoken, cfg) ?? 0);
  return { provider, engine, cfg, spoken, key, cached, cost, ctx, tempo, text: line.text };
}

/** Provider pre-flight problems (e.g. missing recordings) for uncached lines. */
export function preflight(plans) {
  return plans
    .filter((p) => !p.cached && p.provider.check)
    .map((p) => p.provider.check(p.ctx, p.cfg))
    .filter(Boolean);
}

/** Env vars a set of planned (uncached) lines needs but doesn't have. */
export function missingEnv(plans) {
  const need = new Set(plans.filter((p) => !p.cached).flatMap((p) => p.provider.env ?? []));
  return [...need].filter((n) => !process.env[n]);
}

// ---------- shared audio processing ----------
function ffmpeg(args) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
}

function trim(data) {
  const thr = 0.008;
  let a = 0;
  let b = data.length - 1;
  while (a < data.length && Math.abs(data[a]) < thr) a++;
  while (b > a && Math.abs(data[b]) < thr) b--;
  a = Math.max(0, a - Math.round(0.02 * SR));
  b = Math.min(data.length, b + Math.round(0.06 * SR));
  return { data: data.slice(a, b), offset: a / SR };
}

function levelMatch(data, rmsTarget = 0.1, peakCeil = 0.89) {
  let sum = 0;
  let n = 0;
  let peak = 0;
  for (const v of data) {
    const a = Math.abs(v);
    if (a > peak) peak = a;
    if (a > 0.02) {
      sum += v * v;
      n++;
    }
  }
  if (!n) return data;
  const g = Math.min(rmsTarget / Math.sqrt(sum / n), peakCeil / peak);
  return data.map((v) => v * g);
}

/** Spread a duration across display words by length, with pauses after punctuation. */
function estimateWords(display, dur) {
  const w = display.map((t) => ({
    len: Math.max(2, norm(t).length || 1) + 1,
    pause: /[.!?]$/.test(t) ? 4 : /[,;:—–-]$/.test(t) ? 2.5 : 0,
  }));
  const total = w.reduce((s, x) => s + x.len + x.pause, 0);
  let t = 0;
  return display.map((text, i) => {
    const start = (t / total) * dur;
    t += w[i].len;
    const end = (t / total) * dur;
    t += w[i].pause;
    return { text, start, end };
  });
}

/** Character alignment → word spans (in source-audio seconds). */
function wordsFromAlignment(alignment) {
  const { characters: chars, character_start_times_seconds: st, character_end_times_seconds: en } = alignment;
  const spans = [];
  let cur = null;
  chars.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) spans.push(cur);
      cur = null;
    } else if (!cur) cur = { a: i, b: i };
    else cur.b = i;
  });
  if (cur) spans.push(cur);
  return spans.map((s) => ({ start: st[s.a], end: en[s.b] }));
}

/** Provider word times (source seconds) → display words in clip seconds; falls back to estimating. */
function mapWords(display, srcWords, offset, tempo, clipDur) {
  if (!srcWords?.length) return estimateWords(display, clipDur);
  const fix = (s) => Math.max(0, s / tempo - offset);
  const sw = srcWords.map((w) => ({ start: fix(w.start), end: fix(w.end) }));
  if (sw.length === display.length) return display.map((text, i) => ({ text, ...sw[i] }));
  // a pron rewrite changed the word count: spread display words over the spoken span
  const first = sw[0].start;
  const last = sw[sw.length - 1].end;
  return estimateWords(display, last - first).map((w) => ({ ...w, start: w.start + first, end: w.end + first }));
}

/** Generate (or load from cache) a planned line → { data: Float32Array @SR, words, cached }. */
export async function renderPlanned(plan) {
  const { provider, cfg, spoken, key, tempo, ctx, text } = plan;
  fs.mkdirSync(CACHE, { recursive: true });
  const wavPath = path.join(CACHE, `${key}.wav`);
  const metaPath = path.join(CACHE, `${key}.json`);
  if (plan.cached) {
    return { cached: true, data: readWav(wavPath).data, words: JSON.parse(fs.readFileSync(metaPath, "utf8")).words };
  }
  const tmp = path.join(CACHE, `${key}.tmp`);
  const r = await provider.synth({ spoken, text, cfg, ctx, tmp });
  const af = tempo !== 1 ? ["-af", `atempo=${tempo}`] : [];
  const out = ["-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le", wavPath];
  if (r.pcm) {
    fs.writeFileSync(`${tmp}.pcm`, r.pcm);
    ffmpeg(["-f", "s16le", "-ar", String(r.rate ?? 24000), "-ac", "1", "-i", `${tmp}.pcm`, ...af, ...out]);
    fs.rmSync(`${tmp}.pcm`, { force: true });
  } else if (r.file) {
    try {
      ffmpeg(["-i", r.file, ...af, ...out]);
    } catch {
      throw new Error(`ffmpeg couldn't read ${r.file} (from ${provider.name}). Re-export it as WAV and try again.`);
    }
    if (r.file.startsWith(tmp)) fs.rmSync(r.file, { force: true });
  } else {
    throw new Error(`voices/${provider.name}: synth() returned neither file nor pcm`);
  }
  const t = trim(readWav(wavPath).data);
  const clip = levelMatch(t.data);
  const srcWords = r.alignment ? wordsFromAlignment(r.alignment) : r.words;
  const words = mapWords(tokens(text), srcWords, t.offset, tempo, clip.length / SR);
  writeWav(wavPath, clip, SR);
  fs.writeFileSync(metaPath, JSON.stringify({ words, engine: provider.name, text, spoken, timings: srcWords ? "provider" : "estimated" }, null, 1));
  return { cached: false, data: clip, words };
}
