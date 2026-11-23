// Screen zones per format. Every overlay and example camera reads from here, so switching
// style.json "format" re-lays-out the whole video.
//   portrait 9:16 — stacked: header, cards, character, captions
//   landscape 16:9 — character on the left third, cards in a right-hand panel, captions along the bottom
//   square 1:1 — like portrait, tighter
import { useVideoConfig } from "remotion";
import { FORMAT, type Format } from "./style";
import { frameSubject } from "./engine/Cam";

type Zones = {
  header: { top: number };
  card: { top: number; left: number; width: number };
  stamp: { top: number; centerX: number; size: number };
  title: { top: number; centerX: number };
  /** where the main character stands: vertical span (0 = top) and horizontal centre */
  subject: { topFrac: number; bottomFrac: number; screenX: number };
  captions: { bottom: number; maxWidth: number };
  /** multiplies text sizes */
  fontScale: number;
};

export const ZONES: Record<Format, Zones> = {
  portrait: {
    header: { top: 0.06 },
    card: { top: 0.14, left: 0.13, width: 0.74 },
    stamp: { top: 0.17, centerX: 0.5, size: 1 },
    title: { top: 0.13, centerX: 0.5 },
    subject: { topFrac: 0.3, bottomFrac: 0.76, screenX: 0.5 },
    captions: { bottom: 0.15, maxWidth: 0.88 },
    fontScale: 1,
  },
  landscape: {
    header: { top: 0.05 },
    card: { top: 0.24, left: 0.56, width: 0.36 },
    stamp: { top: 0.3, centerX: 0.74, size: 1 },
    title: { top: 0.28, centerX: 0.7 },
    subject: { topFrac: 0.2, bottomFrac: 0.8, screenX: 0.3 },
    captions: { bottom: 0.07, maxWidth: 0.8 },
    fontScale: 0.75,
  },
  square: {
    header: { top: 0.04 },
    card: { top: 0.15, left: 0.17, width: 0.66 },
    stamp: { top: 0.17, centerX: 0.68, size: 0.7 },
    title: { top: 0.12, centerX: 0.5 },
    subject: { topFrac: 0.3, bottomFrac: 0.8, screenX: 0.5 },
    captions: { bottom: 0.06, maxWidth: 0.9 },
    fontScale: 0.8,
  },
};

/** Zones for the current format, plus a camera shot that puts a ~2-unit character in the subject zone. */
export function useLayout() {
  const { width, height } = useVideoConfig();
  const z = ZONES[FORMAT];
  const shot = frameSubject({ ...z.subject, aspect: width / height });
  return { format: FORMAT, width, height, ...z, shot };
}
