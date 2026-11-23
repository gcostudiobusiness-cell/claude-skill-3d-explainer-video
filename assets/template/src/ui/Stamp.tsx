// Rubber stamp that slams in at frame `at` ("NICE TRY", "0 FINISHED"…). Defaults to the card zone, clear of faces.
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../engine/anim";
import { theme } from "./theme";

export function Stamp({ at, text, color = "#e23b3b", rotate = -12, top = "17%" }: { at: number; text: string; color?: string; rotate?: number; top?: string }) {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const f = frame - at;
  const scale = interpolate(f, [0, 5, 8], [3, 0.92, 1], clamp);
  const opacity = interpolate(f, [0, 3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", top }}>
      <div
        style={{
          transform: `rotate(${rotate}deg) scale(${scale})`,
          opacity,
          fontFamily: theme.title,
          fontSize: 120,
          color,
          border: `12px solid ${color}`,
          borderRadius: 24,
          padding: "6px 34px",
          letterSpacing: 4,
          background: "rgba(255,255,255,0.15)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
