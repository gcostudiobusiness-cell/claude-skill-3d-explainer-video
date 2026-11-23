// EXAMPLE props — floating paper sheet and equaliser bars.
import { RoundedBox } from "@react-three/drei";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { toy } from "../../engine/materials";
import { pop } from "../../engine/anim";
import { mouthAt } from "../../timeline";

export function Paper({ at, position }: { at: number; position: number[] }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = pop(f, at, fps);
  return (
    <group position={position as [number, number, number]} scale={k} rotation={[0.2, Math.sin(f / 20) * 0.4, 0.1]}>
      <RoundedBox args={[0.6, 0.8, 0.03]} radius={0.015} castShadow>
        <meshPhysicalMaterial {...toy("#ffffff")} />
      </RoundedBox>
      {[0.22, 0.1, -0.02, -0.14].map((y, i) => (
        <mesh key={y} position={[-0.04 * (i % 2), y, 0.02]}>
          <boxGeometry args={[0.4 - 0.08 * (i % 2), 0.035, 0.01]} />
          <meshStandardMaterial color="#9aa5b1" />
        </mesh>
      ))}
    </group>
  );
}

export function EqBars({ sceneStart, position, color = "#ffbe0b" }: { sceneStart: number; position: number[]; color?: string }) {
  const f = useCurrentFrame();
  const m = mouthAt("narrator", f + sceneStart);
  return (
    <group position={position as [number, number, number]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const h = 0.15 + 0.7 * m * (0.6 + 0.4 * Math.sin(f * 0.7 + i * 1.7));
        return (
          <mesh key={i} position={[(i - 2) * 0.17, h / 2, 0]} castShadow>
            <boxGeometry args={[0.12, h, 0.12]} />
            <meshPhysicalMaterial {...toy(color)} />
          </mesh>
        );
      })}
    </group>
  );
}
