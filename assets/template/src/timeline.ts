// Typed access to the GENERATED src/timeline.json (run `npm run audio` first).
// Every animation keys off these times — never hand-time to seconds.
import raw from "./timeline.json";

export type Word = { text: string; start: number; end: number; hl: boolean };
export type Line = { speaker: string; text: string; start: number; end: number; words: Word[] };
export type Cue = { name: string; t: number; sound: boolean };
export type Scene = {
  id: string;
  kind: string;
  index: number;
  step: number | null;
  header: string | null;
  captions: "pop" | "calm" | "none";
  music: string;
  props: Record<string, unknown>;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
  lines: Line[];
  cues: Cue[];
};
export type Timeline = {
  fps: number;
  width: number;
  height: number;
  duration: number;
  durationInFrames: number;
  title: string;
  footer: string;
  accent: string;
  totalSteps: number;
  scenes: Scene[];
  mouth: Record<string, number[]>;
};

export const TL = raw as unknown as Timeline;
export const toFrame = (sec: number) => Math.round(sec * TL.fps);

export function sceneById(id: string): Scene {
  const s = TL.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`no scene "${id}" in timeline.json — rebuild audio?`);
  return s;
}

/** Scene at an absolute frame (the last scene once past the end). */
export const sceneAt = (frame: number): Scene =>
  TL.scenes.find((s) => frame >= s.startFrame && frame < s.endFrame) ?? TL.scenes[TL.scenes.length - 1];

/**
 * Scene-relative frame helpers. Use inside a scene component, where useCurrentFrame() is scene-relative.
 *   const t = sf(scene);  t.line(1)  t.word(1, 3)  t.cue("stamp")  t.cues("pop")
 */
export function sf(scene: Scene | string) {
  const s = typeof scene === "string" ? sceneById(scene) : scene;
  const rel = (sec: number) => toFrame(sec) - s.startFrame;
  return {
    scene: s,
    duration: s.endFrame - s.startFrame,
    line: (i: number) => rel(s.lines[i].start),
    lineEnd: (i: number) => rel(s.lines[i].end),
    word: (li: number, wi: number) => rel(s.lines[li].words[wi].start),
    cues: (name: string) => s.cues.filter((c) => c.name === name).map((c) => rel(c.t)),
    /** nth cue with this name; Infinity if missing so `frame >= cue` stays false */
    cue: (name: string, n = 0) => {
      const c = s.cues.filter((x) => x.name === name)[n];
      return c ? rel(c.t) : Infinity;
    },
  };
}

/** Mouth openness 0..1 for a speaker at an absolute frame. */
export const mouthAt = (speaker: string, absFrame: number) => TL.mouth[speaker]?.[absFrame] ?? 0;
