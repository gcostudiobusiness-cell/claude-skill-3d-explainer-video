// EXAMPLE scenes for the demo script. Each shows one way to key visuals off the timeline (sf helpers),
// adapt to any format (useLayout), and take on-screen text from lines.json (sceneProps).
// Replace all of this for a real video.
import { CalendarClock, FileText } from "lucide-react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Cam } from "../../engine/Cam";
import { Lights } from "../../engine/Lights";
import { Studio } from "../../engine/Studio";
import { lerp, pop, ramp } from "../../engine/anim";
import { sf } from "../../timeline";
import { useLayout } from "../../layout";
import { sceneProps, styleFor } from "../../style";
import { Card } from "../../ui/Card";
import { Stamp } from "../../ui/Stamp";
import { Title } from "../../ui/Title";
import { fontStack } from "../../ui/text";
import type { SceneDef } from "../types";
import { Buddy } from "./Buddy";
import { EqBars, Paper } from "./Props";

/** Icon + label row used inside cards. */
function CardRow({ sceneId, icon, label, title = false }: { sceneId: string; icon: React.ReactNode; label?: string; title?: boolean }) {
  const st = styleFor(sceneId);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.45em", fontFamily: fontStack(title ? st.fonts.title : st.fonts.body), fontWeight: 800, fontSize: title ? "1.4em" : "1em" }}>
      {icon}
      {label}
    </div>
  );
}

export const Hook: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    const f = useCurrentFrame();
    const { shot } = useLayout();
    // slow push-in across the scene
    const z = lerp(shot.position[2] + 0.8, shot.position[2], ramp(f, 0, t.duration));
    return (
      <>
        <Cam {...shot} position={[shot.position[0], shot.position[1], z]} />
        <Lights rim="#ff7a59" />
        <Studio top="#ffe1b3" bottom="#ff9a76" />
        <Buddy sceneStart={scene.startFrame} expression="worried" poses={[[0, "idle"], [t.cue("pop") - 4, "shrug"]]} />
      </>
    );
  },
  SceneUI: ({ scene }) => (
    <Card at={sf(scene).cue("pop") - 2} sceneId={scene.id}>
      <CardRow sceneId={scene.id} title icon={<CalendarClock size="1.2em" strokeWidth={2.4} color="#e23b3b" />} label={sceneProps(scene.id).card} />
    </Card>
  ),
};

export const ScriptStep: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    const { shot } = useLayout();
    return (
      <>
        <Cam {...shot} />
        <Lights rim="#59a5ff" />
        <Studio top="#d6ecff" bottom="#7fb3ff" />
        <Buddy sceneStart={scene.startFrame} color="#ff006e" expression="sure" position={[-0.35, 0, 0]} rotationY={0.25} poses={[[0, "idle"], [t.cue("card"), "point"]]} />
        <Paper at={t.cue("card")} position={[0.6, 1.45, 0.3]} />
      </>
    );
  },
  SceneUI: ({ scene }) => (
    <Card at={sf(scene).cue("card")} sceneId={scene.id}>
      <CardRow sceneId={scene.id} icon={<FileText size="1.3em" strokeWidth={2.4} color="#3a86ff" />} label={sceneProps(scene.id).card} />
    </Card>
  ),
};

export const AudioStep: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    const f = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { shot } = useLayout();
    const slam = pop(f, t.cue("stamp"), fps, 7);
    return (
      <>
        <Cam {...shot} position={[shot.position[0], shot.position[1] + 0.05 * Math.sin(slam * Math.PI), shot.position[2]]} />
        <Lights rim="#b26bff" />
        <Studio top="#e7d6ff" bottom="#9d6bff" />
        <Buddy sceneStart={scene.startFrame} color="#06d6a0" expression="happy" position={[-0.4, 0, 0]} poses={[[0, "idle"], [t.line(1), "point"]]} rotationY={0.3} />
        <EqBars sceneStart={scene.startFrame} position={[0.5, 0, 0.3]} />
      </>
    );
  },
  SceneUI: ({ scene }) => <Stamp at={sf(scene).cue("stamp")} sceneId={scene.id} text={sceneProps(scene.id).stamp ?? ""} />,
};

export const Outro: SceneDef = {
  Scene3D: ({ scene }) => {
    const t = sf(scene);
    const { shot } = useLayout();
    return (
      <>
        <Cam {...shot} />
        <Lights rim="#ffd23f" />
        <Studio top="#fff6c7" bottom="#ffc94d" />
        <Buddy sceneStart={scene.startFrame} expression="happy" poses={[[0, "wave"], [t.cue("sparkle"), "cheer"]]} />
      </>
    );
  },
  SceneUI: ({ scene }) => <Title at={sf(scene).cue("sparkle")} sceneId={scene.id} text={sceneProps(scene.id).title ?? ""} />,
};
