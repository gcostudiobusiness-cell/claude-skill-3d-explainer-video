// "STEP N · LABEL" header with progress dashes. Shown for scenes that have a `step`.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TL, sceneAt } from "../timeline";
import { pop } from "../engine/anim";
import { theme } from "./theme";

export function StepHeader() {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const s = sceneAt(frame);
  if (s.step == null || !TL.totalSteps) return null;
  const k = pop(frame, s.startFrame + 2, fps, 13);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: height * 0.06 }}>
      <div style={{ transform: `translateY(${(1 - k) * -60}px)`, opacity: Math.min(1, k * 1.5), textAlign: "center" }}>
        <div style={{ fontFamily: theme.title, fontSize: 64, letterSpacing: 2, color: "#fff", WebkitTextStroke: "10px #000", paintOrder: "stroke fill" }}>
          STEP {s.step}
          {s.header ? <span style={{ color: theme.accent }}> · {s.header}</span> : null}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14 }}>
          {Array.from({ length: TL.totalSteps }, (_, i) => (
            <div key={i} style={{ width: 110, height: 18, borderRadius: 9, border: "4px solid #000", background: i < s.step! ? theme.accent : "rgba(255,255,255,.6)" }} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}
