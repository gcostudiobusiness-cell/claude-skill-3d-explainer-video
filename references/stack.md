# Stack

| Layer | Tool (version used) | Why |
|---|---|---|
| Video engine | **Remotion 4.0.545** (`remotion`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`) | React components rendered frame-by-frame to MP4; deterministic, scriptable |
| 3D | **three 0.187**, **@react-three/fiber 9.8**, **@react-three/drei 10.7**, **@remotion/three** (`ThreeCanvas`) | Real 3D scenes inside Remotion |
| UI / React | React 19.2 (fiber 9 needs `>=19 <19.4`), TypeScript | |
| Icons | `lucide-react` | Crisp vector icons on cards |
| Fonts | `@fontsource/anton` (titles), `@fontsource/poppins` (captions/body), loaded with `@remotion/fonts` | Local font files → no network at render time |
| Voice (final) | **ElevenLabs API**, `/v1/text-to-speech/{voice_id}/with-timestamps`, model `eleven_v4` | Human voices + per-character timings for exact caption sync |
| Voice (fallback) | macOS `say` | Free/offline; robotic |
| Voice (evaluated, rejected) | Kokoro-82M via `kokoro-onnx` | Free local neural TTS; good, but the user preferred ElevenLabs |
| Music + SFX | Hand-written synth in Node (`scripts/lib/synth.mjs`) | Generated from maths → zero licensing questions |
| Audio processing | **ffmpeg** (trim, EQ/compress, `atempo`, two-pass `loudnorm` to −14 LUFS, muxing) | |
| Runtime | Node 26, npm; `uv` only for the Python TTS experiment | |

Pin exact versions. Before a new build, check whether newer versions exist and whether they break the
fiber↔React range; flag any new dependency (name, purpose, size) before installing.
