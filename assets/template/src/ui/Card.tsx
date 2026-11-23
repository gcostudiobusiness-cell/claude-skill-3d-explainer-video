// Card that flips in at frame `at`, placed in the format's card zone. Put any content inside.
// style: effects.cardStyle = glass | solid. Pass `scene` so per-scene style applies.
import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../engine/anim";
import { useLayout } from "../layout";
import { STYLE, styleFor } from "../style";

export function Card({ at, sceneId, children, style }: { at: number; sceneId?: string; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const st = sceneId ? styleFor(sceneId) : STYLE;
  const k = pop(frame, at, fps, 12);
  if (frame < at) return null;
  const glass = st.effects.cardStyle === "glass";
  return (
    <div
      style={{
        // caller styles first, so they can't silently override the animation transform
        ...style,
        position: "absolute",
        left: L.width * L.card.left,
        top: L.height * L.card.top,
        width: L.width * L.card.width,
        padding: `${36 * L.fontScale}px ${44 * L.fontScale}px`,
        borderRadius: 36 * L.fontScale,
        background: glass ? "rgba(255,255,255,0.72)" : "#ffffff",
        backdropFilter: glass ? "blur(12px)" : undefined,
        border: glass ? "4px solid rgba(255,255,255,0.9)" : `5px solid ${st.colors.outline}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        transform: `perspective(1200px) rotateX(${(1 - k) * 70}deg) scale(${0.7 + 0.3 * k})`,
        opacity: Math.min(1, k * 2),
        fontSize: 52 * L.fontScale,
      }}
    >
      {children}
    </div>
  );
}
