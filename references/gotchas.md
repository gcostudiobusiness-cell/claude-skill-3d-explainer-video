# Gotchas (learned the hard way)

## Framing
- Portrait 9:16 is narrow: at typical camera distances only **x ≈ ±1.0–1.3 units** is visible. Props at ±1.5 fell
  off-screen. Stack vertically instead: header (top 10%), card zone (~12–45%), character (middle), captions (~85%).
- Compute the camera target from where you want the face in pixels: visible half-height = `d · tan(fov/2)`.

## Remotion + R3F
- Use `<Sequence layout="none">` inside `ThreeCanvas`; update the camera in `useLayoutEffect`.
- `PCFSoftShadowMap` is removed in three 0.187 (falls back to PCF) — harmless warning.
- Avoid drei `Text` and HDR `Environment` presets (network fetches at render time); use canvas textures +
  `Lightformer`s.
- A component that spreads `style` **after** its own `transform` lets callers silently kill its animation — spread
  caller styles first.
- `xstack` needs ≥ 2 inputs (a one-frame contact sheet must be special-cased).

## Audio / voices
- macOS `say -r` scales sublinearly; human TTS voices speak much slower (~110 wpm) than you budget for → plan
  length with real audio.
- ElevenLabs `speed` caps at 1.2; post-`atempo` (≈1.2) is a free extra boost.
- Per-line generation (not per-sentence) gives better prosody when you have real alignment.
- Keep API keys in a gitignored `.env`; never print them; check presence by length only. Scope keys (TTS + voices
  read); `user_read` is needed for the credits endpoint.

## Environment
- `~/Documents` synced to iCloud + nearly full disk ⇒ macOS evicts files ("dataless") ⇒ random bundler crashes.
  Check: `find . -flags +dataless | wc -l`.
  Fix: `npm ci`, then `mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules`.
- A background command piped into `tail` shows nothing until it finishes — don't read an empty log as a failure.

## Length
Covering every required section pushed the cut to ~2:06 (robot voices) / ~2:39 (human voices) vs a 78 s sample.
Decide early whether the brief or the format wins.

## Found while building the starter engine
- Use `frameSubject()` (src/engine/Cam.tsx) instead of guessing camera numbers. In the first stills pass, a
  hand-placed camera hid the character's feet behind the captions and pushed a prop off the right edge.
- Stamps default to the card zone (top ≈ 17 %); at 38 % they covered the character's face.
- `say` gives no word timings: the engine estimates them from word length and punctuation, so captions can
  drift slightly. ElevenLabs `with-timestamps` gives exact times.
- On first render Remotion downloads its own headless Chrome (~140 MB) into node_modules. That's expected and
  isn't a failure.
- R3F logs "THREE.Clock: This module has been deprecated" on every frame. It's harmless.
