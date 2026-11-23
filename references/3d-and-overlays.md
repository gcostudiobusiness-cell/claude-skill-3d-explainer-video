# 3D building blocks, scenes and overlays

## Characters
- Built from primitives: spheres, capsules, drei `RoundedBox`, lathe teardrops for hair.
- `MeshPhysicalMaterial` + clearcoat → toy look.
- Posable joint groups (shoulder / elbow / hip / knee / neck); named **pose presets** blended over frames.
- Procedural life: breathing, typing jitter, waving, nodding.
- **Expression presets** (brows / eyes / mouth), blink, mouth driven by the timeline mouth envelope.

## Object narrator as a character (e.g. a phone)
- Face drawn on its screen with glow shapes.
- Eyelids = screen-coloured planes that slide/tilt (unimpressed / angry / sad).
- Canvas-texture status bar; CRT switch-off effect.

## Sets
- A detailed room: canvas-texture city window, posters, LED strip, desk, laptop, lamp.
- A reusable **gradient "void" studio**: shader sky-sphere + floor + fog, recoloured per scene.

## Props
Chat bubbles, files/folders, shield, blocks, RAM/GPU/CPU/SSD, extruded bolt, question marks, sparkles, wobbling blob
monster (vertex displacement each frame).

## Lighting
Hemisphere + shadowed key + coloured rim + drei `Environment` built from `Lightformer`s (offline — no HDR presets).

## Scene structure
- Each scene file exports `Scene3D` (inside the canvas) and `SceneUI` (HTML on top), both on scene-relative frames
  via `sf(id).line(i) / .word(li, wi) / .cues(name)`.
- One persistent `ThreeCanvas`; each 3D scene in `<Sequence layout="none">`.
- Camera via a `Cam` component that sets position / lookAt / fov in `useLayoutEffect` (runs before Remotion's
  per-frame `advance`).

## Overlays
- Captions: chunked 1–3 words, pop spring, thick outline via `paint-order`, accent-coloured `hl` words.
- Step header ("STEP N · LABEL") + progress dashes.
- Glass cards with 3D flip-in (phone screens, stats, terminal).
- Rubber stamps ("NICE TRY", "0 FINISHED").
- Cut flash + blur at scene boundaries; vignette.
- Footer with name/label; end card / CTA.
- Serious section switches to **calm captions**: full sentence, words light up as spoken.

## Layout zones per format (src/layout.ts)
- **Portrait 9:16:** header top ~6% · cards ~14% · character 30–76% · captions ~85%.
- **Landscape 16:9:** character on the left third · cards, stamp and title in a right-hand panel · captions
  along the bottom · text at 0.75×.
- **Square 1:1:** like portrait, tighter; the stamp is smaller and set right so it clears the face.
- Always position through `useLayout()`, so one scene works in every format.

## Comedy toolkit that worked
Hook question / "POV:" title in first 2 s · deadpan narrator · visual punchline on the last word · stamp slams ·
"3 HOURS LATER" card · fake notifications · speedrun timer · sad trombone with music drop · tone shift before the
ending.
