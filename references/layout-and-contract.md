# Project layout and the timeline contract

```
<project>/
  script/lines.json          ← the single source of truth: scenes, lines, highlights, SFX cues, voices
  scripts/build-audio.mjs    ← voice + music + SFX + mix → public/audio/master.wav AND src/timeline.json
  scripts/lib/voices.mjs     ← voice engines (say | elevenlabs), caching, credit guard
  scripts/lib/synth.mjs      ← drums, marimba, bass, pads, cartoon SFX
  scripts/lib/wav.mjs        ← tiny WAV reader/writer
  scripts/eleven.mjs         ← ElevenLabs helper: credits | voices | audition
  scripts/stills.mjs         ← render N frames + contact sheet (bundles once)
  src/timeline.json          ← GENERATED: scene/line/word timings, cues, per-frame mouth envelope
  src/three/                 ← characters, sets (rooms, lights, camera), props
  src/scenes/*.tsx           ← one 3D component + one overlay component per scene
  src/ui/Overlays.tsx        ← captions, step header, cards, stamps, cut flashes, vignette
  src/Video.tsx, Root.tsx    ← composition wiring
  out/                       ← renders
  .env                       ← API keys (gitignored)
```

## Core contract

1. **Audio is built first.** `build-audio.mjs` writes `timeline.json`.
2. **Every visual keys off timeline times** — scene start, line start, word start, cue time.
3. Change the words → rebuild audio → visuals re-sync automatically.
4. **Never hand-time animation to seconds.**

Scene code reads timings through helpers: `sf(id).line(i)`, `.word(li, wi)`, `.cues(name)` — all returning
scene-relative frames.
