// ElevenLabs — human voices with exact per-character timings (with-timestamps endpoint).
// cfg: { voiceId, model = "eleven_v4", stability, similarity, speed (≤ 1.2) }
export default {
  name: "eleven",
  label: "ElevenLabs",
  env: ["ELEVENLABS_API_KEY"],
  voiceField: "voiceId",
  costUnit: "credits",
  cost: (spoken) => spoken.length, // ≈ 1 credit per character
  async synth({ spoken, cfg }) {
    if (!cfg.voiceId) throw new Error("eleven: speaker has no eleven.voiceId");
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${cfg.voiceId}/with-timestamps?output_format=pcm_24000`,
      {
        method: "POST",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json" },
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
    return { pcm: Buffer.from(json.audio_base64, "base64"), rate: 24000, alignment: json.alignment };
  },
};
