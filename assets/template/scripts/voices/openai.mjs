// OpenAI text-to-speech — example of a cloud adapter. NOT yet tested against the live API.
// cfg: { voice = "alloy", model = "gpt-4o-mini-tts", instructions (tone/style prompt, optional) }
// No word timings (estimated).
import fs from "node:fs";

export default {
  name: "openai",
  label: "OpenAI TTS",
  env: ["OPENAI_API_KEY"],
  voiceField: "voice",
  costUnit: "characters",
  cost: (spoken) => spoken.length,
  async synth({ spoken, cfg, tmp }) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: cfg.model ?? "gpt-4o-mini-tts",
        voice: cfg.voice ?? "alloy",
        input: spoken,
        ...(cfg.instructions ? { instructions: cfg.instructions } : {}),
        response_format: "wav",
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const file = `${tmp}.wav`;
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return { file };
  },
};
