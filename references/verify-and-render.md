# Analysis, verification and render

## Sample analysis (phase 2)
```bash
ffprobe -hide_banner sample.mp4                                           # size, fps, duration, audio
ffmpeg -i sample.mp4 -vf "fps=1/2,scale=288:-1,tile=6x4" contact_%02d.jpg # contact sheets → LOOK at them
ffmpeg -i sample.mp4 -af volumedetect -vn -f null -                       # continuous VO / music?
```
Write the style vocabulary, e.g.: vertical 9:16, ~78 s, toy/clay 3D characters, simple rooms, soft light; hook title
in first 2 s; word-by-word captions (1–3 words, bold, outlined, accent keywords); "STEP N · LABEL" header with
progress dashes; floating UI cards; end card/CTA; continuous narration + music bed.

## Stills review (phase 8)
- `npm run stills -- f1,f2,… name` → contact sheet of chosen frames (bundles once). Pick mid-scene frames **and
  every punchline beat**. Look, fix, repeat — minimum 2 passes.
- `xstack` needs ≥ 2 inputs: special-case a single-frame sheet.
- Typecheck with `--noUnusedLocals` after refactors.

## Render (phase 9)
```bash
npx remotion render <CompositionId> out/video.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p --gl=angle
```
~90–110 s for a 2½-minute video on an 8-core Mac.

## Final MP4 checks — all must pass
```bash
ffmpeg -v error -i out/video.mp4 -f null -                                  # decode errors = 0 (no output)
ffmpeg -i out/video.mp4 -af ebur128 -f null - 2>&1 | tail -12               # Integrated ≈ −14 LUFS
ffmpeg -i out/video.mp4 -vf "fps=1/3,scale=270:-1,tile=6x4" sheet_%02d.jpg   # contact sheet FROM THE MP4 → look
ffmpeg -sseof -1 -i out/video.mp4 -frames:v 1 endcard.png                   # last-second frame = end card
```

## In the template these are npm scripts
`npm run stills -- mid,beats pass1` · `npm run preview` (audio + stills) · `npm run render` · `npm run verify`
(runs the four checks above, plus size = style.json format, and writes `out/verify/mp4-sheet.jpg` +
`out/verify/endcard.png`).
