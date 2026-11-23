# `script/lines.json`

## Structure
- **Scenes:** one per required section + hook + title + outro.
  - Per scene: `step`, `header`, `music` mode (`tension` | `groove` | `hype` | `dark` | `soft`), pads.
- **Lines** (inside a scene):
  - `speaker` — which voice/character.
  - `text` — what is spoken **and** shown as captions.
  - `hl` — highlight words (accent-coloured in captions).
  - `sfx` — cues anchored to a **word index** (`w`), a `t` offset, or `after` the line ends.
  - `gapAfter` — optional pause.
  - `pron` / `pronEleven` — spoken-only rewrites, e.g. "API" → "A P I", "99+" → "ninety-nine plus".

## Writing rules
- Short lines; put the punchline on the last word (the visual punchline lands there too).
- Pick a narrative device that makes the content funny, ideally one that matches a section of the brief itself
  (example that worked: the subject's phone narrates and roasts him).
- Humour only about the subject matter; respect every tone constraint in the brief.
- A serious section (e.g. a reflection) gets calm captions and soft music.

## Validation (run before showing the script to the user)
- Every `hl` word exists in that line's `text`.
- Every `sfx.w` index points at the intended word (print the word next to the index).
- Required sections from the source checklist all have a scene.
- Estimate length from word count at **~110 wpm for human TTS** (not your reading speed).

Show the user readable text (scene → lines), not raw JSON, at the approval gate.
