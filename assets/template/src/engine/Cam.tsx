// Camera control inside ThreeCanvas. Runs in useLayoutEffect so it applies before Remotion advances the frame.
import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";

export function Cam({ position, lookAt, fov = 35 }: { position: number[]; lookAt: number[]; fov?: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
  });
  return null;
}

/**
 * Portrait framing maths. At distance d with vertical fov, the visible half-height is d·tan(fov/2)
 * and the visible half-width is that × (9/16). Keep important objects inside ±halfWidth.
 */
export function frustum(d: number, fov = 35, aspect = 9 / 16) {
  const halfH = d * Math.tan(((fov / 2) * Math.PI) / 180);
  return { halfH, halfW: halfH * aspect };
}

/**
 * Camera that puts a subject spanning world heights [bottom, top] between screen fractions
 * [topFrac, bottomFrac] (0 = top edge, 1 = bottom edge). Default keeps a ~2-unit character
 * in the middle band: below the header/card zone, above the captions (~85 %). screenX moves it sideways
 * (landscape puts it on the left third). Prefer useLayout().shot, which fills these in per format.
 * Returns { position, lookAt, fov, halfW } — halfW is the visible half-width at z = 0.
 */
export function frameSubject({ top = 2.05, bottom = 0, topFrac = 0.3, bottomFrac = 0.76, screenX = 0.5, fov = 35, aspect = 9 / 16 } = {}) {
  const halfH = (top - bottom) / (2 * (bottomFrac - topFrac));
  const cy = bottom - (0.5 - bottomFrac) * 2 * halfH;
  const d = halfH / Math.tan(((fov / 2) * Math.PI) / 180);
  const halfW = halfH * aspect;
  // shift the camera sideways so world x = 0 lands at screenX (0 = left edge, 1 = right edge)
  const cx = (0.5 - screenX) * 2 * halfW;
  return { position: [cx, cy, d], lookAt: [cx, cy, 0], fov, halfW };
}
