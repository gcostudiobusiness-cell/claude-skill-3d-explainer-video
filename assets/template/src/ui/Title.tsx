// Big title that pops in at frame `at` (end cards, chapter titles), in the format's title zone.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../engine/anim";
import { useLayout } from "../layout";
import { STYLE, styleFor } from "../style";
import { fontStack, outlined } from "./text";

export function Title({ at, text, sceneId, size = 150 }: { at: number; text: string; sceneId?: string; size?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const st = sceneId ? styleFor(sceneId) : STYLE;
  if (!text) return null;
  const k = pop(frame, at, fps, 10);
  const fs = size * L.fontScale;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: L.height * L.title.top, left: L.width * L.title.centerX, transform: `translateX(-50%) scale(${k})`, whiteSpace: "nowrap" }}>
        <div style={{ fontFamily: fontStack(st.fonts.title), fontSize: fs, color: st.colors.accent, letterSpacing: 3, ...outlined(st, fs / 11) }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
}
