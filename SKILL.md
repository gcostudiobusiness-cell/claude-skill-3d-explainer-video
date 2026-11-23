---
name: 3d-explainer-video
description: Make a 3D explainer video — portrait 9:16, landscape 16:9 or square 1:1 — with toy-style characters, narration, music, SFX and kinetic captions, in the style of a sample video and built from source material (a brief, notes, answers). Uses Remotion + three/react-three-fiber, any voice provider (macOS say, ElevenLabs, own recordings, CLI TTS, OpenAI or a custom adapter), a hand-written synth for music/SFX, and ffmpeg for mixing and verification. Every aspect (format, colours, fonts, captions, effects, music, SFX, voice) is editable via style.json. Runs a gated sequence — sample analysis → source extraction → script → voice audition → audio build → scenes → stills review → render → deliver. Trigger when the user asks to "make a 3D animated short", "make an explainer video in the style of this sample", "turn this brief/material into a video", or "make a TikTok/Reels/Shorts-style 3D video".
---

# 3D explainer video

Input: a **sample video** (style reference) + **source material**.
Output: a rendered **MP4 in the chosen orientation** (portrait 1080×1920, landscape 1920×1080 or square
1080×1080, 30 fps) with 3D toy-style characters, narration, a music bed, SFX and kinetic captions.

Origin: distilled from one real build (see `references/` for the detail). The gates exist because
every expensive mistake in that build was either paid TTS credits spent on an unapproved script, or a visual bug
only visible by looking at rendered frames.

## Hard rules

1. **Borrow the sample's grammar, never its identity.** Pacing, caption style, header/card devices — yes.
   Characters, branding, watermark, handle, music — never.
2. **Audio first; `timeline.json` drives every visual.** Never hand-time animation to seconds. Change words →
   rebuild audio → visuals re-sync.
3. **No paid generation without a gate.** Dry-run credits first; audition on real script lines before a full build.
4. **API keys only in a gitignored `.env`.** Never print them; check presence by length only.
5. **Verify by looking, not reading.** Contact sheets of rendered frames, and of the final MP4 itself.
6. **Decide length early.** Covering every required section can double the sample's length (78 s sample → 2:39
   cut). Ask whether the brief or the format wins before writing the script.
7. **No private data on screen** unless the user explicitly supplies it for display. Never publish or upload the
   video without a specific yes.

## Inputs to collect (ask only what has no sensible default)

| Input | Default if not given |
|---|---|
| Sample video path | — required |
| Source material paths | — required |
| Orientation | **ask** if the platform doesn't settle it: portrait 9:16 (TikTok, Reels, Shorts), landscape 16:9 (YouTube, web), square 1:1 (feeds). Default: match the sample. |
| Audience / platform | from the brief; it usually decides the orientation |
| Target length | match the sample; flag if the brief can't fit (rule 6) |
| Voice provider | **ask**, and offer: `say` (free, robotic), ElevenLabs (paid, human, exact caption sync), own recordings, any command-line TTS (Piper, Kokoro, espeak…), OpenAI, or any other provider via a small adapter. Can differ per speaker. |
| Names / labels shown on screen | none |

## Phases

Each phase lists what to do, which reference to load, and its **exit condition**. ⛔ = approval gate — stop and
wait for the user.

### 1. Rules check
- Look for `CLAUDE.md` / `AGENTS.md` in the project root. If missing, offer to write one (scope, layout, commands,
  content rules from the brief) **before** building.
- Check the environment: Node, ffmpeg, disk space, iCloud eviction (`references/gotchas.md` → Environment).
- **Exit:** rulebook exists or user declined; tools present.

### 2. Sample analysis — load `references/verify-and-render.md` (ffmpeg commands)
- `ffprobe` for size/fps/duration/audio; contact sheets (`fps=1/2,scale=288:-1,tile=6x4`); `volumedetect` for
  continuous VO/music. **Look at the contact sheets.**
- Write a style vocabulary: aspect, length, character style, hook, caption style, header/progress device, cards,
  end card, audio bed.
- Translate it into `script/style.json`: format, colours, fonts, caption style, effects, music and SFX levels.
  Everything not set keeps the defaults.
- **Exit:** style notes written (e.g. `notes/style.md`) and a first `style.json`.

### 3. Source extraction
- List every required section and every constraint (word counts, things that must be visible, tone limits,
  privacy). Turn constraints into project rules.
- **Exit:** a checklist of required sections + rules.

### 4. Concept + script — load `references/lines-schema.md` ⛔
- Pick a narrative device that makes the content land (e.g. an object narrator that roasts the subject).
- One scene per required section + hook + title + outro. Short lines, punchline on the last word.
- Write `script/lines.json`; run `npm run validate`. It checks highlights, word indexes and SFX names, and prints
  each cue next to the word it lands on. **Read that output**, because a valid index can still point at the wrong
  word.
- **⛔ Gate:** user approves the script (show it as readable text, not JSON) and the length estimate.

### 5. Voice audition — load `references/audio-build.md` ⛔
- Use the provider the user chose. If it isn't in `scripts/voices/`, write an adapter first (interface in
  `scripts/voices/README.md`).
- `npm run audition -- <provider> <voice,…>`: try 2–4 candidates on **real script lines**, not sample text.
  Paid providers show the cost and need `--yes`, so get the user's OK first.
- For own recordings: list the files to record (`npm run audio` names every missing one), and skip auditions.
- **⛔ Gate:** user picks the provider and voice per speaker.

### 6. Audio build — load `references/audio-build.md` ⛔
- `npm run audio -- --dry-run` → per-provider line counts, cost and key status.
- **⛔ Gate:** user approves any spend (free providers need no approval).
- Full build → `public/audio/master.wav` + `src/timeline.json`.
- **Exit:** master at ≈ −14 LUFS; timeline has scene/line/word times, cues, mouth envelopes.

### 7. Scenes — load `references/layout-and-contract.md`, `references/3d-and-overlays.md`
- Design this video's own characters, sets and props from the style notes. The techniques in
  `3d-and-overlays.md` are a toolbox, not a menu. Scenes don't have to follow any previous video.
- One `SceneDef` (`Scene3D` + optional `SceneUI`) per scene kind, registered in `src/scenes/index.ts`, and all
  timed via `sf(scene)`. Unregistered scenes render with the default studio, so build them one at a time.
- Use `useLayout()` for the camera (`shot`) and for every on-screen position, never hard-coded numbers, so the
  video works in any format. Keep props inside `shot.halfW` (`references/gotchas.md` → Framing).
- On-screen text goes in the scene's `props` in lines.json, and colours/sizes in style, not in code. The user
  can then change them without touching components.
- **Exit:** typecheck clean (`--noUnusedLocals`); every scene renders a still.

### 8. Stills review loop — load `references/verify-and-render.md`
- `npm run stills -- f1,f2,… name` at mid-scene and every punchline beat → **look** → fix → repeat.
- **Exit:** at least **2 passes**; no off-screen props, clipped captions or broken poses.

### 9. Render + verify — load `references/verify-and-render.md`
- `npm run render`, then `npm run verify`: decode check (0 errors), loudness (≈ target LUFS), contact sheet
  **from the MP4**, last-second frame (end card), and size = chosen format. Look at both images.
- Claude can't hear audio: ask the user to listen to the music/SFX balance before delivery.
- **Exit:** all five checks pass.

### 10. Deliver ⛔
- Copy the MP4 to the agreed location; report length, loudness, file size and what's recoverable.
- **⛔ Gate:** never upload, post or share without a specific yes.

## References

| File | Load in phase | Contains |
|---|---|---|
| `references/stack.md` | 1, 7 | Exact versions and why each layer was chosen |
| `references/layout-and-contract.md` | 7 | Project layout, the audio-first timeline contract |
| `references/lines-schema.md` | 4 | `lines.json` fields, pronunciation rewrites, validation |
| `references/audio-build.md` | 5, 6 | TTS, tempo, layout, music, SFX, mix, cost control |
| `references/3d-and-overlays.md` | 7 | Character kit, sets, props, lighting, overlays, comedy toolkit |
| `references/verify-and-render.md` | 2, 8, 9 | ffmpeg analysis, stills, MP4 verification, render command |
| `references/gotchas.md` | any time something breaks | Framing, Remotion+R3F, audio, environment, length |

## Starter engine — `assets/template/`

Copy `assets/template/` to start every video (then `npm ci`). It is an **engine, not a fixed video**:

- **Reuse as-is:** the audio pipeline (`scripts/`), timeline helpers (`src/timeline.ts`), camera/lights/studio/
  animation helpers (`src/engine/`), and overlays (`src/ui/`).
- **Design fresh every time:** characters, sets, props, scenes, colours and the narrative device. Base them on the
  sample's style notes from phase 2, not on the example.
- The demo in `src/scenes/example/` exists only to show the techniques, and to prove the engine renders. Delete
  or replace it; never default to its character or look.

See `assets/template/README.md` for commands, how to add a scene, and the **"Change anything"** table. Use
that table when the user asks to change something; `npm run validate` catches typos in style.json.

## When the user asks for changes

- **Look, layout and on-screen text** (format, colours, fonts, captions, header, effects, `props`): edit
  `script/style.json` or lines.json, then `npm run preview` or Studio. No audio rebuild is needed.
- **Words, voice, music, SFX, loudness, fps:** edit, then `npm run audio`. Voice lines are cached, so only
  changed lines are regenerated. Paid providers re-show their cost first.
- **Characters, sets, props, camera moves:** edit `src/scenes/`.
- After any change: stills → look → render → verify. Never deliver an unchecked re-render.
