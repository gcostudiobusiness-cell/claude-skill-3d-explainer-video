// Offline lighting: hemisphere + shadowed key + coloured rim + an Environment built from Lightformers
// (no HDR preset → no network fetch at render time).
import { Environment, Lightformer } from "@react-three/drei";

export function Lights({ rim = "#7aa2ff", key = 2.2 }: { rim?: string; key?: number }) {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#8a7a9a", 0.9]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={key}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, 3, -3]} intensity={1.4} color={rim} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={1.6} position={[0, 4, 4]} scale={[8, 4, 1]} />
        <Lightformer intensity={0.8} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color={rim} />
        <Lightformer intensity={0.6} position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
    </>
  );
}
