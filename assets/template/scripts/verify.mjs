#!/usr/bin/env node
// Final MP4 checks — all must pass before delivery.
//   npm run verify            (checks out/video.mp4)
// 1. decodes with zero errors   2. integrated loudness ≈ −14 LUFS
// 3. contact sheet FROM THE MP4  4. last-second frame (end card)  → look at both images
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const file = process.argv[2] ?? "out/video.mp4";
if (!fs.existsSync(file)) {
  console.error(`${file} not found — run npm run render first`);
  process.exit(1);
}
const run = (args) => spawnSync("ffmpeg", ["-hide_banner", ...args], { encoding: "utf8" });
const results = [];

const dec = run(["-v", "error", "-i", file, "-f", "null", "-"]);
const decErr = dec.stderr.trim() ? dec.stderr.trim().split("\n").length : 0;
results.push(["decode errors = 0", dec.status === 0 && decErr === 0, `${decErr} error line(s)`]);

const lu = run(["-i", file, "-af", "ebur128", "-f", "null", "-"]);
const I = Number(lu.stderr.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/)?.[1]);
results.push(["loudness ≈ −14 LUFS (±1)", Math.abs(I + 14) <= 1, `${I} LUFS`]);

fs.mkdirSync("out/verify", { recursive: true });
const sheet = run(["-y", "-v", "error", "-i", file, "-vf", "fps=1/2,scale=200:-1,tile=6x3:padding=4:color=white", "-frames:v", "1", "out/verify/mp4-sheet.jpg"]);
results.push(["contact sheet from MP4", sheet.status === 0, "out/verify/mp4-sheet.jpg"]);

const last = run(["-y", "-v", "error", "-sseof", "-1", "-i", file, "-frames:v", "1", "-update", "1", "out/verify/endcard.png"]);
results.push(["last-second frame", last.status === 0, "out/verify/endcard.png"]);

const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate,codec_name", "-of", "csv=p=0", file], { encoding: "utf8" });
console.log(probe.stdout.trim().split("\n").join(" · "));
for (const [name, ok, info] of results) console.log(`${ok ? "✓" : "✗"} ${name}  (${info})`);
console.log("Now LOOK at out/verify/mp4-sheet.jpg and out/verify/endcard.png.");
process.exit(results.every((r) => r[1]) ? 0 : 1);
