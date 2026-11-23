# Audio build (`npm run audio`)

## 1. Voice (per line, cached by hash of all inputs)
- ElevenLabs `with-timestamps`, `output_format=pcm_24000` (exact timing, no MP3 padding).
- Word start/end from `alignment.character_*_times_seconds`, mapped onto each display token's character span.
- Optional post `tempo` (ffmpeg `atempo`, pitch-preserving), with timings divided by the same factor — a free
  speed-up. ElevenLabs `speed` caps at 1.2; post-`atempo` ≈1.2 on top is fine.
- Level-match each clip (RMS target, peak ceiling).
- Generate **per line**, not per sentence — better prosody when you have real alignment.
- Fallback: macOS `say` (free, offline, robotic; `-r` scales sublinearly).

## 2. Layout
Walk scenes → lines, place clips, accumulate gaps/pads, **snap scene boundaries to whole frames**.

## 3. Music
Constant BPM grid (112). Per-beat mode lookup from the scene's `music` (`tension`, `groove`, `hype`, `dark`,
`soft`). Tape-stop at a "power-down" cue; end sting.

## 4. SFX
At cue times. A whoosh is auto-added at every cut. Library: pop, ding, trombone, error, typing, clock, thud, boing,
sparkle, zap, growl, power-down…

## 5. Mix
- Music ducked under voice via an envelope follower.
- Music muted for comedic beats (sad trombone).
- Soft clip, then **two-pass `loudnorm` to −14 LUFS**.

## 6. Output
`public/audio/master.wav` + `src/timeline.json` including a **per-frame mouth envelope per speaker** (RMS of that
speaker's VO) for lip-sync.

## Cost control (paid TTS)
- `--dry-run` prints credits for un-cached lines.
- A run above `MAX_CREDITS` refuses without `--yes`.
- Audition voices on the **real script lines** before the full build (`scripts/eleven.mjs audition`).
- `scripts/eleven.mjs credits` needs the `user_read` scope; scope keys to TTS + voices read + user read.
- Keys live in gitignored `.env`; never print them, check presence by length only.
