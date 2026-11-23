# Project layout and the timeline contract

This is the layout of `assets/template/`. Copy it to start a video.

```
<project>/
  script/lines.json              ← single source of truth: meta, speakers, scenes, lines, highlights, cues
  scripts/build-audio.mjs        ← voice + music + SFX + mix → public/audio/master.wav AND src/timeline.json
  scripts/validate-lines.mjs     ← checks lines.json, prints it as readable text with cues on their words
  scripts/stills.mjs             ← render chosen frames + contact sheet (mid | beats | scene:ID | last | N)
  scripts/verify.mjs             ← 5 final MP4 checks
  scripts/audition.mjs           ← try voices on real lines, any provider
  scripts/eleven.mjs             ← ElevenLabs account: credits | voices
  scripts/voices/                ← one adapter per voice provider (say, eleven, recording, command, openai, yours)
  scripts/lib/voices.mjs         ← provider core: choice per line, cache, cost, tempo, trim, level-match, timings
  scripts/lib/style.mjs          ← style loading + validation (typo hints)
  scripts/lib/synth.mjs          ← music modes on a BPM grid, end sting, SFX library
  scripts/lib/wav.mjs            ← WAV reader/writer
  scripts/lib/script.mjs         ← lines.json loading + tokenising (shared)
  src/timeline.json              ← GENERATED (gitignored): scene/line/word times, cues, per-frame mouth envelopes
  script/style.json              ← YOUR look & sound overrides (format, colours, fonts, captions, effects, audio)
  src/style.defaults.json        ← every style key with its default (engine-owned; read, don't edit)
  src/style.ts                   ← live merged style: STYLE, FORMAT, styleFor(sceneId), sceneProps(sceneId)
  src/layout.ts                  ← screen zones per format + useLayout() (incl. camera `shot`)
  src/fonts.ts                   ← bundled fonts (add more here)
  src/timeline.ts                ← types + helpers: sf(scene), sceneAt(frame), mouthAt(speaker, frame)
  src/engine/                    ← Cam + frameSubject, Lights, Studio, toy material, anim (ramp, pop, blendPose, blink…)
  src/ui/                        ← Captions, StepHeader, Card, Stamp, Title, CutFlash/Vignette/Footer
  src/scenes/index.ts            ← registry: scene kind → SceneDef   ← EDIT PER VIDEO
  src/scenes/Default.tsx         ← fallback studio for unregistered scenes
  src/scenes/example/            ← demo character/props/scenes     ← REPLACE PER VIDEO
  src/Video.tsx, Root.tsx        ← composition wiring (rarely edited)
  out/                           ← stills, renders, verify images
  .env                           ← API keys (gitignored; see .env.example)
```

## Core contract

1. **Audio is built first.** `npm run audio` writes `src/timeline.json`.
2. **Every visual keys off timeline times**: scene start, line start, word start, cue time.
3. Change the words → rebuild audio → visuals re-sync automatically.
4. **Never hand-time animation to seconds.**

## Scene components

- A `SceneDef` is `{ Scene3D, SceneUI? }`. Both receive `{ scene }` and see **scene-relative** frames from
  `useCurrentFrame()`.
- Timing inside a scene: `const t = sf(scene)`, then `t.line(i)`, `t.lineEnd(i)`, `t.word(li, wi)`,
  `t.cue("name", n)` (Infinity if missing), `t.cues("name")`, `t.duration`.
- Lip-sync needs the absolute frame: `mouthAt(speaker, frame + scene.startFrame)`.
- Several scenes can share one component: give them the same `kind` in lines.json.
- Global overlays (captions, step header, cut flash, vignette, footer) are driven by the timeline + style.
- Positions come from `useLayout()`; text from `sceneProps(scene.id)`; colours/fonts from `styleFor(scene.id)`.

## Where settings live

- **lines.json:** content. That's `meta.title`, `speakers` (provider settings per speaker), and scenes (`id`,
  `kind`, `step`, `header`, `music`, `props` for on-screen text, `style` for per-scene visual overrides, lines).
- **style.json:** look & sound. That's `format`, `fps`, `colors`, `fonts`, `captions`, `header`, `effects`,
  `footer`, and `audio` (voiceEngine, tempo, music, musicLevel, musicMode, bpm, duck, sfx, sfxLevel, sfxGain,
  autoWhoosh, endSting, loudness, tail). Full list with defaults: `src/style.defaults.json`.
- **Live vs rebuild:** visual keys update live in Studio. `audio.*` and `fps` need `npm run audio`, and the
  composition refuses to load if the timeline's fps doesn't match style.
