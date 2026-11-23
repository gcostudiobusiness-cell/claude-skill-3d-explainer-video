// Frame-wide chrome: cut flash at scene boundaries, vignette, footer label. All switchable in style.json:
// effects.cutFlash, effects.vignette (0 = off … 1 = strong), effects.footer + "footer" text, colors.flash.
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TL, sceneAt } from "../timeline";
import { STYLE, styleFor } from "../style";
import { useLayout } from "../layout";
import { clamp } from "../engine/anim";
import { fontStack } from "./text";

export function CutFlash() {
  const frame = useCurrentFrame();
  const cut = TL.scenes.slice(1).find((s) => frame >= s.startFrame && frame < s.startFrame + 6);
  if (!cut) return null;
  const st = styleFor(cut.id);
  if (!st.effects.cutFlash) return null;
  const o = interpolate(frame - cut.startFrame, [0, 6], [0.85, 0], clamp);
  return <AbsoluteFill style={{ background: st.colors.flash, opacity: o }} />;
}

export function Vignette() {
  const frame = useCurrentFrame();
  const v = styleFor(sceneAt(frame).id).effects.vignette;
  if (!v) return null;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${v}) 100%)` }} />;
}

export function Footer() {
  const L = useLayout();
  if (!STYLE.footer || !STYLE.effects.footer) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 48 * L.fontScale }}>
      <div style={{ fontFamily: fontStack(STYLE.fonts.body), fontWeight: 600, fontSize: 30 * L.fontScale, color: "rgba(255,255,255,.9)", textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
        {STYLE.footer}
      </div>
    </AbsoluteFill>
  );
}
