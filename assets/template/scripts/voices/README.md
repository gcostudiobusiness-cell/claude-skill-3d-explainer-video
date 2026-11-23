# Voice providers

Each file here is one provider. Pick one per video with `meta.voiceEngine`, override it per speaker with
`speakers.<id>.engine`, or for a single build with `npm run audio -- --engine=<name>`. Provider settings live
under the speaker, keyed by provider name:

```json
"speakers": {
  "narrator": { "engine": "eleven", "eleven": { "voiceId": "…" } },
  "phone":    { "engine": "say",    "say": { "voice": "Daniel", "rate": 200 } }
}
```

| Provider | Cost | Word timings | Settings |
|---|---|---|---|
| `say` | free (macOS) | estimated | `voice`, `rate` |
| `eleven` | credits, `ELEVENLABS_API_KEY` | **exact** | `voiceId`, `model`, `stability`, `similarity`, `speed` |
| `recording` | free | estimated | `dir` (recordings), `ext` (wav); or `file` on a line |
| `command` | whatever the tool costs | estimated | `cmd` (array with `{text}` / `{out}`), `ext`, `stdin`, `voice` |
| `openai` (example, untested) | `OPENAI_API_KEY` | estimated | `voice`, `model`, `instructions` |

Spoken-only rewrites: `pron` on a line applies to every provider; `pronBy: { "<provider>": "…" }` overrides it
for one provider (the older `pronEleven` still works).

## Adding a provider

Create `scripts/voices/<name>.mjs`. Files starting with `_` are ignored.

```js
export default {
  name: "myvoice",               // must match the file name
  label: "My TTS",
  env: ["MYVOICE_API_KEY"],      // optional: required env vars, checked before anything is generated
  voiceField: "voice",           // optional: which cfg field audition.mjs sets
  costUnit: "characters",        // optional, with cost:
  cost: (spoken, cfg) => spoken.length, // optional: billable units for the dry run and MAX_CREDITS guard
  cacheExtra: (ctx, cfg) => ({}),       // optional: extra cache-key input (e.g. a source file's mtime)
  async synth({ spoken, text, cfg, ctx, tmp }) {
    // spoken: text to voice · cfg: speakers.<id>.<name> · ctx: { sceneId, lineIndex, speakerId, line }
    // tmp: a path prefix for temp files (append an extension)
    // Return ONE audio source:
    //   { file }                 any file ffmpeg can read
    //   { pcm: Buffer, rate }    raw signed 16-bit mono
    // and optionally timings (seconds in the returned audio, before trimming):
    //   alignment: { characters, character_start_times_seconds, character_end_times_seconds }
    //   words: [{ start, end }]  one per display word
  },
};
```

The engine handles the rest: caching by a hash of every input, optional tempo, silence trimming, level
matching, and word timings (exact if returned, estimated otherwise).
