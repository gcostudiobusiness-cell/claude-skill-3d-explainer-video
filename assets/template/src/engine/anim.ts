// Small animation helpers on top of Remotion's interpolate/spring. Frames in, numbers out.
import { interpolate, spring, Easing } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 between frames a and b, eased. */
export const ramp = (f: number, a: number, b: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

/** Springy 0→1 (with overshoot) starting at frame `at`. */
export const pop = (f: number, at: number, fps: number, damping = 11) =>
  f < at ? 0 : spring({ frame: f - at, fps, config: { damping, stiffness: 160, mass: 0.6 } });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t));

/** Blend named poses: poses[name] = { joint: [x,y,z] }. keys = [[frame, poseName], ...] sorted by frame. */
export function blendPose<P extends Record<string, number[]>>(
  f: number,
  poses: Record<string, P>,
  keys: [number, string][],
  blendFrames = 8,
): P {
  let cur = poses[keys[0][1]];
  for (const [at, name] of keys.slice(1)) {
    if (f < at) break;
    const t = ramp(f, at, at + blendFrames);
    const next = poses[name];
    cur = Object.fromEntries(Object.keys(next).map((k) => [k, lerp3(cur[k] ?? next[k], next[k], t)])) as P;
  }
  return cur;
}

/** Procedural life: breathing scale, gentle sway. */
export const breathe = (f: number, fps: number) => 1 + 0.015 * Math.sin((f / fps) * Math.PI * 1.2);
export const sway = (f: number, fps: number, amt = 0.04) => amt * Math.sin((f / fps) * Math.PI * 0.7);

/** Blink: returns eyelid closure 0..1, closing briefly every ~3.5 s (deterministic). */
export function blink(f: number, fps: number, seed = 0) {
  const period = Math.round(fps * (3.2 + (seed % 3) * 0.4));
  const p = (f + seed * 17) % period;
  return p < 3 ? [0.6, 1, 0.5][p] : 0;
}
