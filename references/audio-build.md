# Audio build (`npm run audio`)

## 1. Voice (per line, cached by hash of all inputs)
- **The user picks the provider.** Each one is a file in `scripts/voices/`:

  | Provider | Cost | Word timings |
  |---|---|---|
  | `say` | free | estimated |
  | `eleven` | credits | exact |
  | `recording` | free | estimated |
  | `command` (any CLI TTS) | depends on the tool | estimated |
  | `openai` (example, untested) | paid | estimated |

  Add a provider by writing one adapter file; the interface is in `scripts/voices/README.md`.
- **Choice order:** `--engine` > `speakers.<id>.engine` > style.json `audio.voiceEngine` (default `say`). Speakers can use different
  providers in the same video.
- **Shared processing for every provider:** ffmpeg normalise → optional `tempo` → trim silence → level-match
  (RMS target, peak ceiling) → word timings.
- **Word timings:** if the provider returns timings (`alignment` or `words`), they're exact. Otherwise they're
  estimated from word length and punctuation, so captions can drift slightly.
- **ElevenLabs specifics:** `with-timestamps` with `output_format=pcm_24000` (exact timing, no MP3 padding).
  Word start/end come from `alignment.character_*_times_seconds`, mapped onto each display token's span.
- **Tempo:** a post `tempo` (ffmpeg `atempo`, pitch-preserving) divides timings by the same factor, which makes
  it a free speed-up. ElevenLabs `speed` caps at 1.2; post-`atempo` ≈1.2 on top is fine.
- **Spoken-only rewrites:** `pron` applies to every provider; `pronBy.<provider>` overrides it for one.
- Generate **per line**, not per sentence, for better prosody when you have real alignment.
- **Own recordings:** one file per line, `recordings/<sceneId>_<lineIndex>.wav` or `file` on the line. The build
  lists every missing file before doing anything. Re-recording a file regenerates only that line.

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

## Cost control (any paid provider)
- `--dry-run` prints, per provider: lines to generate, estimated cost, and whether each required key is set.
- Missing keys stop the build before anything is generated.
- A run above `MAX_CREDITS` (billable units, summed across providers) refuses without `--yes`.
- Audition voices on the **real script lines** before the full build (`npm run audition -- <provider> <voices>`).
  Paid auditions need `--yes`.
- `scripts/eleven.mjs credits` needs the `user_read` scope; scope keys to TTS + voices read + user read.
- Keys live in gitignored `.env`; never print them, check presence by length only.
