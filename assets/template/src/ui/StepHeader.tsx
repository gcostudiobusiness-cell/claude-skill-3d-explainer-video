// "STEP N · LABEL" header with progress dashes, for scenes that have a `step`. style: header.show/dashes/size.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TL, sceneAt } from "../timeline";
import { styleFor } from "../style";
import { useLayout } from "../layout";
import { pop } from "../engine/anim";
import { fontStack, outlined } from "./text";

export function StepHeader() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const s = sceneAt(frame);
  const st = styleFor(s.id);
  if (s.step == null || !TL.totalSteps || !st.header.show) return null;
  const k = L.fontScale * st.header.size;
  const p = pop(frame, s.startFrame + 2, fps, 13);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: L.height * L.header.top }}>
      <div style={{ transform: `translateY(${(1 - p) * -60}px)`, opacity: Math.min(1, p * 1.5), textAlign: "center" }}>
        <div style={{ fontFamily: fontStack(st.fonts.title), fontSize: 64 * k, letterSpacing: 2, color: st.colors.text, ...outlined(st, 10 * k) }}>
          STEP {s.step}
          {s.header ? <span style={{ color: st.colors.accent }}> · {s.header}</span> : null}
        </div>
        {st.header.dashes ? (
          <div style={{ display: "flex", gap: 12 * k, justifyContent: "center", marginTop: 14 * k }}>
            {Array.from({ length: TL.totalSteps }, (_, i) => (
              <div key={i} style={{ width: 110 * k, height: 18 * k, borderRadius: 9 * k, border: `${4 * k}px solid ${st.colors.outline}`, background: i < s.step! ? st.colors.accent : "rgba(255,255,255,.6)" }} />
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
