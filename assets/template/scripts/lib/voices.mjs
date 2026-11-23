// Voice engines: macOS `say` (free, offline) and ElevenLabs (paid, exact word timings).
// Each clip is cached by a hash of every input, so re-running costs nothing.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { readWav, writeWav } from "./wav.mjs";
import { SR } from "./synth.mjs";
import { tokens, norm } from "./script.mjs";

const CACHE = "cache/voice";

// ---------- .env (no dependency) ----------
export function loadEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
/** Never print the key — only whether it is there and how long it is. */
export function keyStatus() {
  const k = process.env.ELEVENLABS_API_KEY ?? "";
  return k ? `set (${k.length} chars)` : "missing";
}

export const clipKey = (input) =>
  crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16);

export const isCached = (key) => fs.existsSync(path.join(CACHE, `${key}.json`));

/** ElevenLabs bills roughly one credit per character of spoken text. */
export const creditEstimate = (text) => text.length;

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
}

/** Convert any input to mono 16-bit WAV at SR, with optional pitch-preserving tempo. */
function toClip(inArgs, out, tempo) {
  const af = tempo && tempo !== 1 ? ["-af", `atempo=${tempo}`] : [];
  ffmpeg([...inArgs, ...af, "-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le", out]);
}

/** Trim leading/trailing silence. Returns trimmed samples and the seconds removed from the start. */
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

/** Level-match: RMS of the louder parts to a target, with a peak ceiling. */
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

/**
 * Estimate word timings when the engine gives none (macOS say).
 * Spreads the clip's duration across display words, weighted by length, with pauses for punctuation.
 */
function estimateWords(display, dur) {
  const w = display.map((t) => {
    const letters = norm(t).length || 1;
    const pause = /[.!?]$/.test(t) ? 4 : /[,;:—–-]$/.test(t) ? 2.5 : 0;
    return { len: Math.max(2, letters) + 1, pause };
  });
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

/** Map ElevenLabs character alignment onto display words. */
function alignWords(display, spoken, alignment, offset, tempo) {
  const chars = alignment.characters;
  const st = alignment.character_start_times_seconds;
  const en = alignment.character_end_times_seconds;
  // spoken word spans in character indices
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
  const fix = (s) => Math.max(0, (s - offset) / tempo);
  const sw = spans.map((s) => ({ start: fix(st[s.a]), end: fix(en[s.b]) }));
  if (sw.length === display.length) return display.map((text, i) => ({ text, ...sw[i] }));
  // pron rewrite changed the word count: spread display words over the spoken span
  const dur = sw.length ? sw[sw.length - 1].end : 0;
  const first = sw.length ? sw[0].start : 0;
  return estimateWords(display, dur - first).map((w) => ({ ...w, start: w.start + first, end: w.end + first }));
}

/**
 * Render one line. Returns { data: Float32Array @SR, words: [{text,start,end}] } with times in the clip.
 * opts: { engine, speaker (config), text (display), spoken, tempo }
 */
export async function renderLine(opts) {
  const { engine, speaker, text, spoken, tempo = 1 } = opts;
  const key = clipKey({ engine, speaker: speaker[engine] ?? speaker, spoken, text, tempo, v: 1 });
  fs.mkdirSync(CACHE, { recursive: true });
  const wavPath = path.join(CACHE, `${key}.wav`);
  const metaPath = path.join(CACHE, `${key}.json`);
  if (fs.existsSync(metaPath) && fs.existsSync(wavPath)) {
    return { key, cached: true, data: readWav(wavPath).data, words: JSON.parse(fs.readFileSync(metaPath, "utf8")).words };
  }
  const display = tokens(text);
  const tmp = path.join(CACHE, `${key}.tmp`);
  let words;
  let clip;
  if (engine === "say") {
    const cfg = speaker.say ?? {};
    const args = ["-o", `${tmp}.aiff`];
    if (cfg.voice) args.push("-v", cfg.voice);
    if (cfg.rate) args.push("-r", String(cfg.rate));
    execFileSync("say", [...args, spoken]);
    toClip(["-i", `${tmp}.aiff`], wavPath, tempo);
    fs.rmSync(`${tmp}.aiff`, { force: true });
    const t = trim(readWav(wavPath).data);
    clip = levelMatch(t.data);
    words = estimateWords(display, clip.length / SR);
  } else if (engine === "eleven") {
    const cfg = speaker.eleven ?? {};
    if (!cfg.voiceId) throw new Error(`speaker has no eleven.voiceId`);
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing — put it in .env");
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}/with-timestamps?output_format=pcm_24000`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          text: spoken,
          model_id: cfg.model ?? "eleven_v4",
          voice_settings: {
            stability: cfg.stability ?? 0.45,
            similarity_boost: cfg.similarity ?? 0.8,
            speed: Math.min(1.2, cfg.speed ?? 1),
          },
        }),
      },
    );
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    fs.writeFileSync(`${tmp}.pcm`, Buffer.from(json.audio_base64, "base64"));
    toClip(["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", `${tmp}.pcm`], wavPath, tempo);
    fs.rmSync(`${tmp}.pcm`, { force: true });
    const t = trim(readWav(wavPath).data);
    clip = levelMatch(t.data);
    // alignment times are pre-tempo and pre-trim; trim offset is post-tempo
    words = alignWords(display, spoken, json.alignment, t.offset * tempo, tempo);
  } else {
    throw new Error(`unknown voice engine "${engine}" (use say or eleven)`);
  }
  writeWav(wavPath, clip, SR);
  fs.writeFileSync(metaPath, JSON.stringify({ words, engine, text, spoken }, null, 1));
  return { key, cached: false, data: clip, words };
}
