// Composition wiring. You rarely edit this: add scenes in src/scenes/index.ts instead.
//  - one persistent ThreeCanvas; each scene's 3D lives in a <Sequence layout="none"> inside it
//  - each scene's HTML overlay in its own <Sequence> on top
//  - global overlays (captions, step header, cut flash, vignette, footer) read the timeline directly
import { FONT_FACES } from "./fonts";
import { useEffect, useState } from "react";
import { AbsoluteFill, Html5Audio, Sequence, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { TL } from "./timeline";
import { sceneFor } from "./scenes";
import { Captions } from "./ui/Captions";
import { StepHeader } from "./ui/StepHeader";
import { CutFlash, Footer, Vignette } from "./ui/Chrome";

function useFonts() {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f)))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}

export function Video() {
  useFonts();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: true, preserveDrawingBuffer: true }}>
        {TL.scenes.map((s) => {
          const { Scene3D } = sceneFor(s);
          return (
            <Sequence key={s.id} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame} layout="none">
              <Scene3D scene={s} />
            </Sequence>
          );
        })}
      </ThreeCanvas>
      {TL.scenes.map((s) => {
        const { SceneUI } = sceneFor(s);
        return SceneUI ? (
          <Sequence key={s.id} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame}>
            <SceneUI scene={s} />
          </Sequence>
        ) : null;
      })}
      <Vignette />
      <StepHeader />
      <Captions />
      <CutFlash />
      <Footer />
      <Html5Audio src={staticFile("audio/master.wav")} />
    </AbsoluteFill>
  );
}
