# Project layout and the timeline contract

This is the layout of `assets/template/`. Copy it to start a video.

```
<project>/
  script/lines.json              ← single source of truth: meta, speakers, scenes, lines, highlights, cues
  scripts/build-audio.mjs        ← voice + music + SFX + mix → public/audio/master.wav AND src/timeline.json
  scripts/validate-lines.mjs     ← checks lines.json, prints it as readable text with cues on their words
  scripts/stills.mjs             ← render chosen frames + contact sheet (mid | beats | scene:ID | last | N)
  scripts/verify.mjs             ← 4 final MP4 checks
  scripts/eleven.mjs             ← ElevenLabs: credits | voices | audition
  scripts/lib/voices.mjs         ← say | eleven engines, cache, level-match, word timings, .env loader
  scripts/lib/synth.mjs          ← music modes on a BPM grid, end sting, SFX library
  scripts/lib/wav.mjs            ← WAV reader/writer
  scripts/lib/script.mjs         ← lines.json loading + tokenising (shared)
  src/timeline.json              ← GENERATED (gitignored): scene/line/word times, cues, per-frame mouth envelopes
  src/timeline.ts                ← types + helpers: sf(scene), sceneAt(frame), mouthAt(speaker, frame)
  src/engine/                    ← Cam + frameSubject, Lights, Studio, toy material, anim (ramp, pop, blendPose, blink…)
  src/ui/                        ← Captions, StepHeader, Card, Stamp, CutFlash/Vignette/Footer, theme
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
- Global overlays (captions, step header, cut flash, vignette, footer) are driven by the timeline. Per-scene
  settings in lines.json are `captions: pop|calm|none`, `step` and `header`.

## lines.json `meta`

`title`, `fps` (30), `width`/`height` (1080×1920), `voiceEngine` (`say` | `eleven`), `tempo` (post atempo),
`bpm` (112), `accent`, `footer`, `musicLevel` (0.32), `autoWhoosh` (true), `tail` (0.5 s).
