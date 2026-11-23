#!/usr/bin/env node
// ElevenLabs helper. Needs ELEVENLABS_API_KEY in .env (scopes: text-to-speech, voices read, user read).
//   node scripts/eleven.mjs credits                    remaining credits
//   node scripts/eleven.mjs voices [filter]            list voices (id, name, labels)
//   node scripts/eleven.mjs audition <voiceId,…> [n]   voice the first n script lines (default 2) with each voice
//                                                      → out/audition/<voice>_<i>.wav   (costs credits; asks for --yes)
import fs from "node:fs";
import { loadEnv, keyStatus, renderLine, creditEstimate } from "./lib/voices.mjs";
import { loadScript, eachLine, spokenText } from "./lib/script.mjs";
import { writeWav } from "./lib/wav.mjs";
import { SR } from "./lib/synth.mjs";

loadEnv();
const [cmd, a1, a2] = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const yes = process.argv.includes("--yes");
const key = process.env.ELEVENLABS_API_KEY;
if (!cmd || !["credits", "voices", "audition"].includes(cmd)) {
  console.log("usage: eleven.mjs credits | voices [filter] | audition <voiceId,…> [lines] [--yes]");
  process.exit(cmd ? 1 : 0);
}
if (!key) {
  console.error(`ELEVENLABS_API_KEY ${keyStatus()} — add it to .env (see .env.example)`);
  process.exit(1);
}
const api = async (p) => {
  const r = await fetch(`https://api.elevenlabs.io${p}`, { headers: { "xi-api-key": key } });
  if (!r.ok) throw new Error(`${p} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

if (cmd === "credits") {
  const s = await api("/v1/user/subscription");
  console.log(`${s.character_limit - s.character_count} credits left (${s.character_count}/${s.character_limit} used, tier ${s.tier})`);
} else if (cmd === "voices") {
  const { voices } = await api("/v2/voices?page_size=100");
  const f = (a1 ?? "").toLowerCase();
  for (const v of voices.filter((x) => !f || JSON.stringify(x.labels ?? {}).toLowerCase().includes(f) || x.name.toLowerCase().includes(f))) {
    console.log(`${v.voice_id}  ${v.name.padEnd(24)} ${Object.values(v.labels ?? {}).join(", ")}`);
  }
} else {
  const ids = (a1 ?? "").split(",").filter(Boolean);
  const n = Number(a2 ?? 2);
  if (!ids.length) throw new Error("give at least one voiceId");
  const script = loadScript();
  const lines = [...eachLine(script)].slice(0, n).map(({ line }) => line);
  const cost = ids.length * lines.reduce((s, l) => s + creditEstimate(spokenText(l, "eleven")), 0);
  console.log(`audition: ${ids.length} voice(s) × ${lines.length} line(s) ≈ ${cost} credits`);
  if (!yes) {
    console.log("Re-run with --yes to spend them.");
    process.exit(0);
  }
  fs.mkdirSync("out/audition", { recursive: true });
  for (const voiceId of ids) {
    for (const [i, line] of lines.entries()) {
      const speaker = { eleven: { ...(script.speakers[line.speaker]?.eleven ?? {}), voiceId } };
      const clip = await renderLine({ engine: "eleven", speaker, text: line.text, spoken: spokenText(line, "eleven"), tempo: script.meta?.tempo ?? 1 });
      const out = `out/audition/${voiceId}_${i}.wav`;
      writeWav(out, clip.data, SR);
      console.log(`  ${out}`);
    }
  }
}
