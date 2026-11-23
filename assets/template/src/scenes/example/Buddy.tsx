// EXAMPLE character — shows the techniques (primitives + toy material, joint groups, pose presets,
// expressions, blink, lip-sync from the timeline). Don't reuse it as-is: design each video's characters
// from its sample.
import { RoundedBox } from "@react-three/drei";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { toy } from "../../engine/materials";
import { blendPose, blink, breathe, sway } from "../../engine/anim";
import { mouthAt } from "../../timeline";

type Pose = { armL: number[]; armR: number[]; head: number[] };
const POSES: Record<string, Pose> = {
  idle: { armL: [0, 0, -0.18], armR: [0, 0, 0.18], head: [0, 0, 0] },
  shrug: { armL: [0, 0, -1.1], armR: [0, 0, 1.1], head: [0, 0, 0.18] },
  point: { armL: [0, 0, -0.18], armR: [0, 0.4, 1.6], head: [0, 0.25, 0] },
  wave: { armL: [0, 0, -0.18], armR: [0, 0, 2.6], head: [0, 0, -0.08] },
  cheer: { armL: [0, 0, -2.5], armR: [0, 0, 2.5], head: [-0.15, 0, 0] },
};
const EXPR = {
  neutral: { brow: 0, browY: 0 },
  worried: { brow: 0.35, browY: 0.02 },
  happy: { brow: -0.1, browY: 0.04 },
  sure: { brow: -0.3, browY: -0.01 },
};

export type BuddyProps = {
  /** absolute frame offset of the scene (scene.startFrame) — needed for lip-sync */
  sceneStart: number;
  speaker?: string;
  color?: string;
  poses?: [number, keyof typeof POSES][];
  expression?: keyof typeof EXPR;
  position?: number[];
  rotationY?: number;
  scale?: number;
};

function Arm({ side, rot, color }: { side: 1 | -1; rot: number[]; color: string }) {
  return (
    <group position={[0.42 * side, 1.08, 0]} rotation={rot as [number, number, number]}>
      <mesh position={[0, -0.28, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.4, 6, 12]} />
        <meshPhysicalMaterial {...toy(color)} />
      </mesh>
      <mesh position={[0, -0.6, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshPhysicalMaterial {...toy("#ffd2b0")} />
      </mesh>
    </group>
  );
}

export function Buddy({ sceneStart, speaker = "narrator", color = "#3a86ff", poses = [[0, "idle"]], expression = "neutral", position = [0, 0, 0], rotationY = 0, scale = 1 }: BuddyProps) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = blendPose(f, POSES, poses);
  const waving = poses.some(([at, n]) => n === "wave" && f >= at);
  const armR = waving ? [p.armR[0], p.armR[1], p.armR[2] + 0.25 * Math.sin((f / fps) * Math.PI * 5)] : p.armR;
  const m = mouthAt(speaker, f + sceneStart);
  const lid = blink(f, fps);
  const e = EXPR[expression];
  const b = breathe(f, fps);
  const skin = "#ffd2b0";
  return (
    <group position={position as [number, number, number]} rotation-y={rotationY + sway(f, fps, 0.05)} scale={scale}>
      {/* legs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.16 * s, 0.24, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.3, 6, 12]} />
          <meshPhysicalMaterial {...toy("#22223b")} />
        </mesh>
      ))}
      {/* body */}
      <group scale={[1, b, 1]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.38, 0.42, 8, 20]} />
          <meshPhysicalMaterial {...toy(color)} />
        </mesh>
      </group>
      <Arm side={-1} rot={p.armL} color={color} />
      <Arm side={1} rot={armR} color={color} />
      {/* head (neck pivot) */}
      <group position={[0, 1.3, 0]} rotation={p.head as [number, number, number]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <sphereGeometry args={[0.42, 32, 24]} />
          <meshPhysicalMaterial {...toy(skin)} />
        </mesh>
        {/* hair: rounded cap */}
        <RoundedBox args={[0.78, 0.22, 0.7]} radius={0.1} position={[0, 0.66, -0.04]} castShadow>
          <meshPhysicalMaterial {...toy("#3d2c1e")} />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <group key={s} position={[0.15 * s, 0.38, 0.36]}>
            {/* eye: white + pupil, squashed by blink */}
            <group scale={[1, 1 - lid * 0.9, 1]}>
              <mesh>
                <sphereGeometry args={[0.085, 16, 12]} />
                <meshStandardMaterial color="#fff" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.06]}>
                <sphereGeometry args={[0.045, 12, 10]} />
                <meshStandardMaterial color="#111" roughness={0.2} />
              </mesh>
            </group>
            {/* brow */}
            <mesh position={[0, 0.13 + e.browY, 0.02]} rotation-z={e.brow * -s}>
              <boxGeometry args={[0.13, 0.03, 0.03]} />
              <meshStandardMaterial color="#3d2c1e" />
            </mesh>
          </group>
        ))}
        {/* mouth: opens with the timeline mouth envelope */}
        <mesh position={[0, 0.18, 0.39]} scale={[0.11 + 0.02 * m, 0.025 + 0.09 * m, 0.04]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#5a1f2b" />
        </mesh>
      </group>
    </group>
  );
}
