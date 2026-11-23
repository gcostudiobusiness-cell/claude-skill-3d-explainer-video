// Glass card that flips in at frame `at`. Put any content inside (icons, stats, a fake phone screen…).
import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../engine/anim";

export function Card({ at, top = 0.2, width = 0.74, children, style }: { at: number; top?: number; width?: number; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const k = pop(frame, at, fps, 12);
  if (frame < at) return null;
  return (
    <div
      style={{
        // caller styles first, so they can't silently override the animation transform
        ...style,
        position: "absolute",
        left: (W * (1 - width)) / 2,
        top: H * top,
        width: W * width,
        padding: "36px 44px",
        borderRadius: 36,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        border: "4px solid rgba(255,255,255,0.9)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        transform: `perspective(1200px) rotateX(${(1 - k) * 70}deg) scale(${0.7 + 0.3 * k})`,
        opacity: Math.min(1, k * 2),
      }}
    >
      {children}
    </div>
  );
}
