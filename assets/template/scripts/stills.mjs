#!/usr/bin/env node
// Render chosen frames + a contact sheet, so you can LOOK at the video without a full render.
//   npm run stills -- <frames> [name]
// <frames>: comma list of frame numbers and/or keywords
//   mid       the middle of every scene
//   beats     every cue (sfx + visual cue) frame, +4 frames so the hit has landed
//   scene:ID  start, middle and end of one scene
//   last      the final frame
// Output: out/stills/<name>/f_XXXX.png and out/stills/<name>.jpg
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [spec = "mid", name = "sheet"] = process.argv.slice(2);
const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8"));
const fps = tl.fps;
const f = (sec) => Math.round(sec * fps);

const frames = new Set();
for (const part of spec.split(",")) {
  if (part === "mid") tl.scenes.forEach((s) => frames.add(Math.round((s.startFrame + s.endFrame) / 2)));
  else if (part === "beats") tl.scenes.forEach((s) => s.cues.forEach((c) => frames.add(f(c.t) + 4)));
  else if (part === "last") frames.add(tl.durationInFrames - 1);
  else if (part.startsWith("scene:")) {
    const s = tl.scenes.find((x) => x.id === part.slice(6));
    if (!s) throw new Error(`no scene ${part.slice(6)}`);
    [s.startFrame + 3, Math.round((s.startFrame + s.endFrame) / 2), s.endFrame - 2].forEach((x) => frames.add(x));
  } else if (/^\d+$/.test(part)) frames.add(Number(part));
  else throw new Error(`unknown frame spec "${part}"`);
}
const list = [...frames].filter((x) => x >= 0 && x < tl.durationInFrames).sort((a, b) => a - b);

const dir = path.join("out/stills", name);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

console.log(`bundling…`);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl: "angle" };
const composition = await selectComposition({ serveUrl, id: "Main", chromiumOptions });
for (const frame of list) {
  const output = path.join(dir, `f_${String(frame).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, chromiumOptions, scale: 0.5 });
  const scene = tl.scenes.find((s) => frame >= s.startFrame && frame < s.endFrame);
  console.log(`  frame ${frame} (${(frame / fps).toFixed(2)} s, ${scene?.id ?? "end"})`);
}

// Contact sheet via the tile filter on the image sequence (works for any count, including one frame).
const cols = Math.min(4, list.length);
const rows = Math.ceil(list.length / cols);
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-pattern_type", "glob", "-i", path.join(dir, "f_*.png"),
  "-vf", `scale=270:-1,tile=${cols}x${rows}:padding=6:color=white`, "-frames:v", "1", `${dir}.jpg`,
]);
console.log(`✓ ${list.length} frames → ${dir}.jpg`);
