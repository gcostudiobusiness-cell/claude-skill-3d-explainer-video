// Style = how the video looks and sounds. Engine defaults live in src/style.defaults.json (don't edit);
// your overrides live in script/style.json (only the keys you want to change). Scenes can override visual
// keys with a `style` block in lines.json.
import fs from "node:fs";

export const DEFAULTS_PATH = "src/style.defaults.json";
export const STYLE_PATH = "script/style.json";

export const FORMATS = {
  portrait: { width: 1080, height: 1920, label: "9:16 portrait (TikTok, Reels, Shorts)" },
  landscape: { width: 1920, height: 1080, label: "16:9 landscape (YouTube, web)" },
  square: { width: 1080, height: 1080, label: "1:1 square (feeds)" },
};
const ENUMS = {
  format: Object.keys(FORMATS),
  "captions.mode": ["pop", "calm", "none"],
  "effects.cardStyle": ["glass", "solid"],
};
// keys whose value is free-form (any keys allowed inside)
const OPEN = new Set(["audio.sfxGain"]);

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

export function deepMerge(base, over) {
  if (!isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(base?.[k]) ? deepMerge(base[k], v) : v;
  return out;
}

export function loadStyle() {
  const defaults = JSON.parse(fs.readFileSync(DEFAULTS_PATH, "utf8"));
  const overrides = fs.existsSync(STYLE_PATH) ? JSON.parse(fs.readFileSync(STYLE_PATH, "utf8")) : {};
  return { defaults, overrides, style: deepMerge(defaults, overrides) };
}

/** Closest known key, for "did you mean" hints. */
function suggest(key, options) {
  const d = (a, b) => {
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  };
  const best = options.map((o) => [o, d(key.toLowerCase(), o.toLowerCase())]).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] <= 3 ? ` — did you mean "${best[0]}"?` : "";
}

/** Check overrides against the defaults: unknown keys (typos), wrong types, invalid choices. */
export function validateStyle(over, defaults, where = "style.json", prefix = "") {
  const p = [];
  if (!isObj(over)) return [`${where}: must be an object`];
  for (const [k, v] of Object.entries(over)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (!(k in defaults)) {
      p.push(`${where}: unknown key "${path}"${suggest(k, Object.keys(defaults))}`);
      continue;
    }
    const dv = defaults[k];
    if (OPEN.has(path)) {
      if (!isObj(v)) p.push(`${where}: "${path}" must be an object`);
      continue;
    }
    if (isObj(dv)) {
      if (!isObj(v)) p.push(`${where}: "${path}" must be an object`);
      else p.push(...validateStyle(v, dv, where, path));
      continue;
    }
    if (ENUMS[path] && !ENUMS[path].includes(v)) p.push(`${where}: "${path}" must be one of ${ENUMS[path].join(", ")} (got "${v}")`);
    else if (dv !== null && v !== null && typeof v !== typeof dv) p.push(`${where}: "${path}" should be a ${typeof dv} (got ${JSON.stringify(v)})`);
  }
  return p;
}

/** Visual keys a scene may override in lines.json (`scene.style`). */
export const SCENE_STYLE_KEYS = ["colors", "fonts", "captions", "header", "effects"];
