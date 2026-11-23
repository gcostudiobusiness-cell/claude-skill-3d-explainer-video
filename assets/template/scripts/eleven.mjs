#!/usr/bin/env node
// ElevenLabs account helper. Needs ELEVENLABS_API_KEY in .env (scopes: text-to-speech, voices read, user read).
//   node scripts/eleven.mjs credits          remaining credits
//   node scripts/eleven.mjs voices [filter]  list voices (id, name, labels)
// To try voices on your script, use: npm run audition -- eleven <voiceId,…>
import { loadEnv, envStatus } from "./lib/voices.mjs";

loadEnv();
const [cmd, filter] = process.argv.slice(2);
if (!["credits", "voices"].includes(cmd)) {
  console.log("usage: eleven.mjs credits | voices [filter]");
  process.exit(cmd ? 1 : 0);
}
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error(`ELEVENLABS_API_KEY ${envStatus("ELEVENLABS_API_KEY")} — add it to .env (see .env.example)`);
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
} else {
  const { voices } = await api("/v2/voices?page_size=100");
  const f = (filter ?? "").toLowerCase();
  for (const v of voices.filter((x) => !f || x.name.toLowerCase().includes(f) || JSON.stringify(x.labels ?? {}).toLowerCase().includes(f))) {
    console.log(`${v.voice_id}  ${v.name.padEnd(24)} ${Object.values(v.labels ?? {}).join(", ")}`);
  }
}
