#!/usr/bin/env node
// Check script/lines.json and print it as readable text for the approval gate.
//   npm run validate
import { fileURLToPath } from "node:url";
import { loadScript, tokens, norm, eachLine } from "./lib/script.mjs";
import { SFX, MUSIC_MODES } from "./lib/synth.mjs";

export function validate(script) {
  const p = [];
  if (!script.speakers || !Object.keys(script.speakers).length) p.push("no speakers defined");
  if (!Array.isArray(script.scenes) || !script.scenes.length) return [...p, "no scenes"];
  const ids = new Set();
  for (const s of script.scenes) {
    if (!s.id) p.push("a scene has no id");
    if (ids.has(s.id)) p.push(`duplicate scene id "${s.id}"`);
    ids.add(s.id);
    if (s.music && !MUSIC_MODES[s.music]) p.push(`[${s.id}] unknown music mode "${s.music}" (${Object.keys(MUSIC_MODES).join(", ")})`);
    if (s.captions && !["pop", "calm", "none"].includes(s.captions)) p.push(`[${s.id}] captions must be pop, calm or none`);
    for (const c of s.cues ?? []) if (!c.name) p.push(`[${s.id}] scene cue without a name`);
  }
  for (const { scene, li, line } of eachLine(script)) {
    const where = `[${scene.id} #${li}]`;
    if (!line.text) p.push(`${where} line has no text`);
    if (!script.speakers?.[line.speaker]) p.push(`${where} unknown speaker "${line.speaker}"`);
    const words = tokens(line.text ?? "").map(norm);
    for (const h of line.hl ?? []) if (!words.includes(norm(h))) p.push(`${where} highlight "${h}" is not in the text`);
    for (const c of [...(line.sfx ?? []), ...(line.cues ?? [])]) {
      if (!c.name) p.push(`${where} cue/sfx without a name`);
      if (c.w != null && (c.w < 0 || c.w >= words.length)) p.push(`${where} "${c.name}" word index ${c.w} is out of range (0–${words.length - 1})`);
    }
    for (const c of line.sfx ?? []) if (c.name && !SFX[c.name]) p.push(`${where} unknown sfx "${c.name}" (${Object.keys(SFX).join(", ")})`);
  }
  return p;
}

function report(script) {
  let words = 0;
  for (const s of script.scenes) {
    const tag = s.step != null ? `STEP ${s.step} · ${s.header ?? ""}` : (s.header ?? "");
    console.log(`\n■ ${s.id}${tag ? `  (${tag})` : ""}  music: ${s.music ?? "groove"}`);
    for (const l of s.lines ?? []) {
      const tk = tokens(l.text);
      words += tk.length;
      const marks = [...(l.sfx ?? []).map((c) => ({ ...c, kind: "♪" })), ...(l.cues ?? []).map((c) => ({ ...c, kind: "◆" }))]
        .map((c) => `${c.kind}${c.name}@${c.w != null ? `"${tk[c.w]}"` : c.after != null ? `end+${c.after}s` : `+${c.t ?? 0}s`}`)
        .join(" ");
      console.log(`  ${l.speaker}: ${l.text}${marks ? `   ${marks}` : ""}`);
    }
  }
  const human = (words / 110) * 60;
  console.log(`\n${words} words · ~${Math.round(human)} s of speech with human TTS (~110 wpm), plus pauses`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const script = loadScript();
  const problems = validate(script);
  report(script);
  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem(s):`);
    problems.forEach((x) => console.error("  ✗ " + x));
    process.exit(1);
  }
  console.log("✓ lines.json is valid");
}
