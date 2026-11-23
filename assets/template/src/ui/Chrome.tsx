// Frame-wide chrome: cut flash at every scene boundary, vignette, footer label.
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TL } from "../timeline";
import { clamp } from "../engine/anim";
import { theme } from "./theme";

export function CutFlash() {
  const frame = useCurrentFrame();
  const cut = TL.scenes.slice(1).find((s) => frame >= s.startFrame && frame < s.startFrame + 6);
  if (!cut) return null;
  const o = interpolate(frame - cut.startFrame, [0, 6], [0.85, 0], clamp);
  return <AbsoluteFill style={{ background: "#fff", opacity: o }} />;
}

export const Vignette = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
);

export function Footer() {
  if (!TL.footer) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 48 }}>
      <div style={{ fontFamily: theme.body, fontWeight: 600, fontSize: 30, color: "rgba(255,255,255,.9)", textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
        {TL.footer}
      </div>
    </AbsoluteFill>
  );
}
