# Explainer video template (engine)

The reusable engine behind the `3d-explainer-video` skill. Copy this folder to start a new video.

**What's reusable vs. what's per-video**

| Reusable engine — keep | Per video — replace |
|---|---|
| `scripts/` audio build, voices, synth, validator, stills, verify, ElevenLabs helper | `script/lines.json` |
| `src/timeline.ts` helpers (`sf`, `sceneAt`, `mouthAt`) | `src/scenes/index.ts` registry entries |
| `src/engine/` camera + `frameSubject`, lights, studio, materials, animation helpers | everything in `src/scenes/example/` (characters, props, scenes) |
| `src/ui/` captions, step header, card, stamp, title, cut flash, vignette, footer | `script/style.json`: format, colours, fonts, captions, effects, audio |
| `src/layout.ts`, `src/style.ts`, `src/fonts.ts` | scene `props` and `style` in lines.json |

The example scenes and character only demonstrate the techniques. Design each video's characters, sets and
scenes from its own sample.

## Commands

```bash
npm ci                         # install (pinned versions)
npm run validate               # check lines.json + print it as readable text
npm run audio -- --dry-run     # what would be voiced, by which provider, and the cost
npm run audition -- say Samantha,Daniel   # try voices on real lines (any provider)
npm run audio                  # → public/audio/master.wav + src/timeline.json
npm run typecheck
npm run stills -- mid,beats pass1   # contact sheet → out/stills/pass1.jpg  (LOOK at it)
npm run preview                # audio + contact sheet in one go, after any change
npm run studio                 # live preview in the browser
npm run render                 # → out/video.mp4
npm run verify                 # 5 checks on the MP4 (incl. size = format), then LOOK at out/verify/*
npx remotion render src/index.ts Main out/other.mp4 --gl=angle   # render to another file
node scripts/eleven.mjs credits | voices          # ElevenLabs account helper
```

Audio comes first: `src/timeline.json` is generated and every animation keys off it. Change the script →
`npm run audio` → visuals re-sync. Never hand-time animation.

## Change anything

Content and on-screen text go in `script/lines.json`. Look and sound go in `script/style.json`, where you list
only the keys you want to change; the defaults, with every key, are in `src/style.defaults.json`. `npm run
validate` catches typos ("did you mean…") and invalid values.

| To change | Where | Then |
|---|---|---|
| **Orientation**: portrait 9:16 / landscape 16:9 / square 1:1 | style `format` | live in Studio; re-render |
| Spoken words / captions | lines.json `text` (spoken-only: `pron`, `pronBy`) | `npm run audio` |
| On-screen text (cards, stamps, titles) | lines.json scene `props` | live |
| Colours (accent, text, outline, stamp, flash) | style `colors` | live |
| Fonts | style `fonts` (bundled: Anton, Poppins; add more in `src/fonts.ts`) | live |
| Captions: on/off, pop/calm/none, size, words per chunk, case, outline, weight, position | style `captions` | live |
| Step header: on/off, dashes, size | style `header` | live |
| Effects: cut flash, vignette strength, card style, footer | style `effects`, `footer` | live |
| One scene only (colours, fonts, captions, header, effects) | lines.json scene `style` | live |
| Voice provider / voice | style `audio.voiceEngine`, lines.json `speakers` | `npm run audio` |
| Voice speed | style `audio.tempo` | `npm run audio` |
| Music: on/off, level, default mode, tempo (bpm), ducking, end sting | style `audio` | `npm run audio` |
| Music per scene | lines.json scene `music` (tension, groove, hype, dark, soft, none) | `npm run audio` |
| Sound effects: on/off, overall level, per-effect gain, auto whoosh | style `audio.sfx`, `sfxLevel`, `sfxGain`, `autoWhoosh` | `npm run audio` |
| Sound effect placement | lines.json line `sfx` (`w` word index, `t`, `after`) | `npm run audio` |
| Loudness target | style `audio.loudness` (−14 LUFS default) | `npm run audio` |
| Frame rate | style `fps` | `npm run audio` |
| Characters, sets, props, camera moves | `src/scenes/` | live |

"Live" means Remotion Studio (`npm run studio`) updates on save. `npm run preview` rebuilds audio (cached, so
seconds) and renders a contact sheet of every scene and cue.

Example `script/style.json`:

```json
{
  "format": "landscape",
  "colors": { "accent": "#00E5FF" },
  "captions": { "size": 0.9, "uppercase": false, "maxWords": 2 },
  "effects": { "vignette": 0, "cardStyle": "solid" },
  "audio": { "voiceEngine": "eleven", "musicLevel": 0.2, "sfxGain": { "whoosh": 0.3 } }
}
```

Per-scene override in `lines.json`:

```json
{ "id": "reflection", "music": "soft", "style": { "captions": { "mode": "calm" }, "colors": { "accent": "#FF4D6D" } }, … }
```

## Formats

The same scenes work in every orientation. `src/layout.ts` defines screen zones per format (header, cards,
stamp, title, subject, captions, text scale), and `useLayout().shot` gives a camera that puts the character in
the subject zone. In landscape that's the left third, with cards on the right. Use `useLayout()` in your scenes
and overlays instead of hard-coded positions, so a format switch re-lays-out everything.

## Adding a scene

1. Add the scene to `lines.json` (`id`, optional `kind`, `step`, `header`, `music`, `captions`, lines with `hl`,
   `sfx`, `cues`).
2. `npm run audio`. Unregistered scenes already render with the default studio.
3. Write a `SceneDef` (`Scene3D` + optional `SceneUI`) and register it under its `kind`/`id` in
   `src/scenes/index.ts`.
4. Time everything with `sf(scene)`: `t.line(i)`, `t.word(li, wi)`, `t.cue("name")`.

## Voices: use any provider

Built in: `say` (default, free), `eleven` (ElevenLabs, exact caption timing), `recording` (your own files),
`command` (any command-line TTS such as Piper, Kokoro or espeak), and `openai` (example adapter, untested).
Any other provider is one small file in `scripts/voices/`. See [`scripts/voices/README.md`](scripts/voices/README.md)
for settings and the adapter interface.

```json
"meta": { "voiceEngine": "eleven" },
"speakers": {
  "narrator": { "eleven": { "voiceId": "…" } },
  "phone":    { "engine": "say", "say": { "voice": "Daniel" } }
}
```

- **Choosing:** `npm run audition -- <provider> <voice,…>` tries voices on your real lines. `npm run audio --
  --dry-run` shows, per provider, what will be generated, the cost and whether keys are set.
- **Limits:** paid runs above `MAX_CREDITS` need `--yes`, and missing keys or recordings stop the build before
  anything is generated.

## Requirements

Node ≥ 20, ffmpeg on PATH, and macOS for `say`. On first render Remotion downloads its own headless Chrome
(~140 MB). If the project sits in iCloud-synced `~/Documents`, see the skill's gotchas on "dataless" files.
