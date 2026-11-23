# 3d-explainer-video

A [Claude Code](https://claude.com/claude-code) skill that turns a **sample video** (style reference) and
**source material** (a brief, notes, answers) into a finished **3D explainer video**: portrait, landscape or square, 30 fps
MP4 with toy-style 3D characters, narration, a music bed, sound effects and kinetic captions.

It works in portrait 9:16, landscape 16:9 or square 1:1, and everything about the result can be changed from
two plain files: `lines.json` for words and on-screen text, `style.json` for look and sound.

It is a workflow, not a library. The skill tells Claude what to build, in what order, and where to stop and ask
you before spending money or publishing anything.

## Install

Clone into your global skills folder. The folder name must match the skill name:

```bash
git clone https://github.com/gcostudiobusiness-cell/claude-skill-3d-explainer-video.git \
  ~/.claude/skills/3d-explainer-video
```

Start a new Claude Code session; `3d-explainer-video` appears in the skill list.

## Use

Ask in plain words, for example:

> Make a 3D animated short in the style of `sample.mp4` from `brief.md`.

Claude asks only what has no sensible default. The main question is the voice provider, and you can use any:
macOS `say` (free, robotic), ElevenLabs (paid, human, exact caption sync), your own recordings, a command-line
TTS such as Piper or Kokoro, OpenAI, or any other service through a small adapter. Different speakers can use
different providers.

## How it works

Ten phases. ⛔ marks a gate where Claude stops and waits for your approval.

1. **Rules check:** finds or offers a project `CLAUDE.md`, and checks the tools and disk space.
2. **Sample analysis:** makes contact sheets of the sample and writes down its style, borrowing the style but
   never the sample's branding.
3. **Source extraction:** lists the required sections and constraints from the brief.
4. **Script** ⛔: writes `script/lines.json`, then you approve the script and its estimated length.
5. **Voice audition** ⛔: tries candidate voices on real script lines, then you pick.
6. **Audio build** ⛔: a dry run reports the voice-credit cost, you approve it, then voice, music, effects and the
   mix are built. This writes `timeline.json`.
7. **Scenes:** 3D characters, sets and overlays, all timed from `timeline.json`.
8. **Stills review:** renders contact sheets of key frames and fixes problems, in at least two passes.
9. **Render and verify:** checks the final MP4 for decode errors, loudness (about −14 LUFS), a contact sheet and
   the end card.
10. **Deliver** ⛔: hands over the video file. Nothing is uploaded or posted without your explicit yes.

**Core rule:** audio is built first and writes `timeline.json`, and every animation is timed from it. If you change
the script and rebuild the audio, the visuals re-sync on their own. Nothing is timed by hand.

## Stack

| Layer | Tools |
|---|---|
| Video engine | Remotion 4 |
| 3D | three.js, @react-three/fiber, @react-three/drei, @remotion/three |
| UI | React 19, TypeScript, lucide-react, local fonts (Anton, Poppins) |
| Voice | Your choice: macOS `say`, ElevenLabs (exact caption sync), own recordings, any command-line TTS, OpenAI, or any provider via a small adapter |
| Music and sound effects | Hand-written Node synth, so there are no licensing questions |
| Audio processing and checks | ffmpeg |

Exact versions are in [`references/stack.md`](references/stack.md).

**You need:** Node, ffmpeg, macOS (for `say`), and an ElevenLabs API key in a gitignored `.env` if you use
ElevenLabs voices.

## Repository layout

```
SKILL.md                         entry point: rules, inputs, phases, gates
references/
  stack.md                       versions, and why each tool was chosen
  layout-and-contract.md         project layout and the audio-first timeline rule
  lines-schema.md                lines.json fields and validation
  audio-build.md                 voice, music, effects, mix and cost control
  3d-and-overlays.md             characters, sets, props, lighting, captions, comedy toolkit
  verify-and-render.md           ffmpeg analysis, stills, render and MP4 checks
  gotchas.md                     known pitfalls and their fixes
assets/template/                 starter engine: copy to begin a video (see its README)
```

Claude loads each reference file only during the phase that needs it, which keeps the context small.

## Status

- The method and references come from one real build.
- **Starter engine included** in [`assets/template/`](assets/template/): the audio pipeline, timeline helpers,
  camera/lighting/studio helpers, overlays, and the stills and verification tools. A clean copy installs, builds
  audio with `say`, renders a 15-second demo and passes all MP4 checks, in portrait and landscape.
- The engine is reused; each video's characters, sets and scenes are designed fresh from its sample. The demo
  scenes in `src/scenes/example/` are only there to show the techniques.
- Not yet tested: the ElevenLabs path against the live API. Its code, cost dry run and credit guard are in
  place, but they need a real key to test.
