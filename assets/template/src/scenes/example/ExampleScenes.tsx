// EXAMPLE scenes for the demo script. Each shows one way to key visuals off the timeline (sf helpers).
// Replace all of this for a real video.
import { CalendarClock, FileText } from "lucide-react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Cam, frameSubject } from "../../engine/Cam";
import { Lights } from "../../engine/Lights";
import { Studio } from "../../engine/Studio";
import { lerp, pop, ramp } from "../../engine/anim";
import { sf } from "../../timeline";
import { Card } from "../../ui/Card";
import { Stamp } from "../../ui/Stamp";
import { theme } from "../../ui/theme";
import type { SceneDef } from "../types";
import { Buddy } from "./Buddy";
import { EqBars, Paper } from "./Props";

// Character in the middle band (30–76 % of height): header/cards above, captions below.
// At this framing only x ≈ ±1.2 is visible at z = 0 — keep props inside that.
const SHOT = frameSubject();

export const Hook: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    const f = useCurrentFrame();
    // slow push-in across the scene
    const z = lerp(SHOT.position[2] + 0.8, SHOT.position[2], ramp(f, 0, t.duration));
    return (
      <>
        <Cam position={[0, SHOT.position[1], z]} lookAt={SHOT.lookAt} />
        <Lights rim="#ff7a59" />
        <Studio top="#ffe1b3" bottom="#ff9a76" />
        <Buddy sceneStart={scene.startFrame} expression="worried" poses={[[0, "idle"], [t.cue("pop") - 4, "shrug"]]} />
      </>
    );
  },
  SceneUI: ({ scene }) => {
    const t = sf(scene);
    return (
      <Card at={t.cue("pop") - 2} top={0.14} width={0.56}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: theme.title, fontSize: 72 }}>
          <CalendarClock size={84} strokeWidth={2.4} color="#e23b3b" />
          FRIDAY
        </div>
      </Card>
    );
  },
};

export const ScriptStep: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    return (
      <>
        <Cam {...SHOT} />
        <Lights rim="#59a5ff" />
        <Studio top="#d6ecff" bottom="#7fb3ff" />
        <Buddy sceneStart={scene.startFrame} color="#ff006e" expression="sure" position={[-0.35, 0, 0]} rotationY={0.25} poses={[[0, "idle"], [t.cue("card"), "point"]]} />
        <Paper at={t.cue("card")} position={[0.6, 1.45, 0.3]} />
      </>
    );
  },
  SceneUI: ({ scene }) => {
    const t = sf(scene);
    return (
      <Card at={t.cue("card")} top={0.14} width={0.66}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontFamily: theme.body, fontWeight: 800, fontSize: 52 }}>
          <FileText size={70} strokeWidth={2.4} color="#3a86ff" />
          lines.json
        </div>
      </Card>
    );
  },
};

export const AudioStep: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    const f = useCurrentFrame();
    const { fps } = useVideoConfig();
    const slam = pop(f, t.cue("stamp"), fps, 7);
    return (
      <>
        <Cam {...SHOT} position={[0, SHOT.position[1] + 0.05 * Math.sin(slam * Math.PI), SHOT.position[2]]} />
        <Lights rim="#b26bff" />
        <Studio top="#e7d6ff" bottom="#9d6bff" />
        <Buddy sceneStart={scene.startFrame} color="#06d6a0" expression="happy" position={[-0.4, 0, 0]} poses={[[0, "idle"], [t.line(1), "point"]]} rotationY={0.3} />
        <EqBars sceneStart={scene.startFrame} position={[0.5, 0, 0.3]} />
      </>
    );
  },
  SceneUI: ({ scene }) => <Stamp at={sf(scene).cue("stamp")} text="SYNCED" color="#06a77d" />,
};

export const Outro: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    return (
      <>
        <Cam {...SHOT} />
        <Lights rim="#ffd23f" />
        <Studio top="#fff6c7" bottom="#ffc94d" />
        <Buddy sceneStart={scene.startFrame} expression="happy" poses={[[0, "wave"], [t.cue("sparkle"), "cheer"]]} />
      </>
    );
  },
  SceneUI: ({ scene }) => {
    const t = sf(scene);
    const f = useCurrentFrame();
    const { fps, height } = useVideoConfig();
    const k = pop(f, t.cue("sparkle"), fps, 10);
    return (
      <AbsoluteFill style={{ alignItems: "center", paddingTop: height * 0.13 }}>
        <div style={{ transform: `scale(${k})`, fontFamily: theme.title, fontSize: 150, color: theme.accent, WebkitTextStroke: "14px #000", paintOrder: "stroke fill", letterSpacing: 3 }}>
          YOUR TURN
        </div>
      </AbsoluteFill>
    );
  },
};
