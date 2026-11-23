// Live style for the visuals: engine defaults ← script/style.json ← a scene's `style` block in lines.json.
// These files are imported directly, so Remotion Studio updates as soon as you save them (no audio rebuild),
// except fps, which changes frame timing (re-run `npm run audio`).
import defaults from "./style.defaults.json";
import overrides from "../script/style.json";
import script from "../script/lines.json";

export type Style = typeof defaults;
export type Format = "portrait" | "landscape" | "square";

export const FORMATS: Record<Format, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(over)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = isObj(v) && isObj(b) ? deepMerge(b, v) : v;
  }
  return out as T;
}

export const STYLE: Style = deepMerge(defaults, overrides);
export const FORMAT = (STYLE.format in FORMATS ? STYLE.format : "portrait") as Format;

type SceneSrc = { id: string; style?: unknown; props?: Record<string, unknown> };
const SCENES = (script as { scenes: SceneSrc[] }).scenes;
const cache = new Map<string, Style>();

/** Style for one scene: global style with that scene's `style` overrides applied. */
export function styleFor(sceneId: string): Style {
  if (!cache.has(sceneId)) cache.set(sceneId, deepMerge(STYLE, SCENES.find((s) => s.id === sceneId)?.style));
  return cache.get(sceneId)!;
}

/** On-screen text and other per-scene values from lines.json (`props`), read live. */
export function sceneProps<T extends Record<string, unknown> = Record<string, string>>(sceneId: string): Partial<T> {
  return (SCENES.find((s) => s.id === sceneId)?.props ?? {}) as Partial<T>;
}
