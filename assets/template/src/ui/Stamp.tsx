// Rubber stamp that slams in at frame `at` ("NICE TRY", "0 FINISHED"…), in the format's stamp zone
// (clear of the character's face). Colour: style colors.stamp, or the `color` prop.
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../engine/anim";
import { useLayout } from "../layout";
import { STYLE, styleFor } from "../style";
import { fontStack } from "./text";

export function Stamp({ at, text, sceneId, color, rotate = -12 }: { at: number; text: string; sceneId?: string; color?: string; rotate?: number }) {
  const frame = useCurrentFrame();
  const L = useLayout();
  const st = sceneId ? styleFor(sceneId) : STYLE;
  if (frame < at || !text) return null;
  const f = frame - at;
  const scale = interpolate(f, [0, 5, 8], [3, 0.92, 1], clamp);
  const opacity = interpolate(f, [0, 3], [0, 1], clamp);
  const c = color ?? st.colors.stamp;
  const k = L.fontScale * L.stamp.size;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: L.height * L.stamp.top, left: L.width * L.stamp.centerX, transform: "translateX(-50%)" }}>
        <div
          style={{
            transform: `rotate(${rotate}deg) scale(${scale})`,
            opacity,
            fontFamily: fontStack(st.fonts.title),
            fontSize: 120 * k,
            color: c,
            border: `${12 * k}px solid ${c}`,
            borderRadius: 24 * k,
            padding: `${6 * k}px ${34 * k}px`,
            letterSpacing: 4,
            background: "rgba(255,255,255,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
}
