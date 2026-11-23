#!/usr/bin/env node
// Audition voices on REAL script lines, with any provider.
//   npm run audition -- <provider> <voice,voice,…> [lines=2] [--yes]
//   e.g. npm run audition -- say Samantha,Daniel,Karen
//        npm run audition -- eleven <voiceId>,<voiceId> 3 --yes
// Writes out/audition/<provider>_<voice>_<i>.wav. Paid providers show the cost and need --yes.
import fs from "node:fs";
import { loadScript, eachLine } from "./lib/script.mjs";
import { loadEnv, loadProviders, planLine, renderPlanned, missingEnv } from "./lib/voices.mjs";
import { writeWav } from "./lib/wav.mjs";
import { SR } from "./lib/synth.mjs";
import { loadStyle } from "./lib/style.mjs";

loadEnv();
const pos = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const yes = process.argv.includes("--yes");
const [engine, voicesArg, nArg] = pos;
const providers = await loadProviders();
if (!engine || !voicesArg) {
  console.log(`usage: npm run audition -- <provider> <voice,…> [lines] [--yes]\nproviders: ${Object.keys(providers).join(", ")}`);
  process.exit(engine ? 1 : 0);
}
const provider = providers[engine];
if (!provider) {
  console.error(`unknown provider "${engine}" (have: ${Object.keys(providers).join(", ")})`);
  process.exit(1);
}
if (!provider.voiceField) {
  console.error(`${engine} has no selectable voice to audition`);
  process.exit(1);
}
const script = loadScript();
const lines = [...eachLine(script)].slice(0, Number(nArg ?? 2));
const plans = voicesArg.split(",").filter(Boolean).flatMap((voice) =>
  lines.map(({ scene, line, li }, i) => {
    const base = script.speakers[line.speaker]?.[engine] ?? {};
    const speaker = { [engine]: { ...base, [provider.voiceField]: voice } };
    const ctx = { sceneId: scene.id, lineIndex: li, speakerId: line.speaker, line };
    return { voice, i, plan: planLine({ providers, engine, speaker, line, ctx, tempo: loadStyle().style.audio.tempo }) };
  }),
);
const cost = plans.reduce((s, p) => s + p.plan.cost, 0);
console.log(`audition: ${plans.length} clip(s) with ${provider.label ?? engine}` + (provider.cost ? ` ≈ ${cost} ${provider.costUnit ?? "units"}` : " (free)"));
const missing = missingEnv(plans.map((p) => p.plan));
if (missing.length) {
  console.error(`Missing ${missing.join(", ")} — add to .env`);
  process.exit(1);
}
if (cost > 0 && !yes) {
  console.log("Re-run with --yes to spend it.");
  process.exit(0);
}
fs.mkdirSync("out/audition", { recursive: true });
for (const { voice, i, plan } of plans) {
  const clip = await renderPlanned(plan);
  const out = `out/audition/${engine}_${voice.replace(/[^\w-]/g, "_")}_${i}.wav`;
  writeWav(out, clip.data, SR);
  console.log(`  ${out}`);
}
