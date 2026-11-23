// Loading and tokenising script/lines.json. Shared by validate, build-audio and eleven.
import fs from "node:fs";

export const SCRIPT_PATH = "script/lines.json";

export function loadScript(path = SCRIPT_PATH) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

// Display tokens = what the captions show, split on whitespace.
export const tokens = (text) => text.trim().split(/\s+/).filter(Boolean);

// Normalised word for matching highlights: lower-case, no surrounding punctuation.
export const norm = (w) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

// Text actually sent to the voice engine.
export const spokenText = (line, engine) =>
  (engine === "eleven" && line.pronEleven) || line.pron || line.text;

export function* eachLine(script) {
  for (const [si, scene] of script.scenes.entries()) {
    for (const [li, line] of (scene.lines ?? []).entries()) yield { scene, si, line, li };
  }
}
