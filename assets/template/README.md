# Explainer video template (engine)

The reusable engine behind the `3d-explainer-video` skill. Copy this folder to start a new video.

**What's reusable vs. what's per-video**

| Reusable engine — keep | Per video — replace |
|---|---|
| `scripts/` audio build, voices, synth, validator, stills, verify, ElevenLabs helper | `script/lines.json` |
| `src/timeline.ts` helpers (`sf`, `sceneAt`, `mouthAt`) | `src/scenes/index.ts` registry entries |
| `src/engine/` camera + `frameSubject`, lights, studio, materials, animation helpers | everything in `src/scenes/example/` (characters, props, scenes) |
| `src/ui/` captions, step header, card, stamp, cut flash, vignette, footer | colours/fonts in `src/ui/theme.ts` if the sample calls for it |

The example scenes and character only demonstrate the techniques. Design each video's characters, sets and
scenes from its own sample.

## Commands

```bash
npm ci                         # install (pinned versions)
npm run validate               # check lines.json + print it as readable text
npm run audio -- --dry-run     # what would be voiced, and the credit cost
npm run audio                  # → public/audio/master.wav + src/timeline.json
npm run typecheck
npm run stills -- mid,beats pass1   # contact sheet → out/stills/pass1.jpg  (LOOK at it)
npm run studio                 # live preview in the browser
npm run render                 # → out/video.mp4
npm run verify                 # 4 checks on the MP4, then LOOK at out/verify/*
node scripts/eleven.mjs credits | voices | audition <id,…> [n] [--yes]
```

Audio comes first: `src/timeline.json` is generated and every animation keys off it. Change the script →
`npm run audio` → visuals re-sync. Never hand-time animation.

## Adding a scene

1. Add the scene to `lines.json` (`id`, optional `kind`, `step`, `header`, `music`, `captions`, lines with `hl`,
   `sfx`, `cues`).
2. `npm run audio`. Unregistered scenes already render with the default studio.
3. Write a `SceneDef` (`Scene3D` + optional `SceneUI`) and register it under its `kind`/`id` in
   `src/scenes/index.ts`.
4. Time everything with `sf(scene)`: `t.line(i)`, `t.word(li, wi)`, `t.cue("name")`.

## Voices

- `say` (default): free and offline. Word times are estimated, so captions are close but not exact.
- ElevenLabs: set `meta.voiceEngine` to `"eleven"`, set each speaker's `eleven.voiceId`, and put the key in
  `.env`. Word times come from the API, so captions are exact. A build above `MAX_CREDITS` refuses without
  `--yes`.

## Requirements

Node ≥ 20, ffmpeg on PATH, and macOS for `say`. On first render Remotion downloads its own headless Chrome
(~140 MB). If the project sits in iCloud-synced `~/Documents`, see the skill's gotchas on "dataless" files.
