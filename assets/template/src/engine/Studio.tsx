// Reusable gradient "void" studio: shader sky-sphere + shadow-catching floor + fog. Recolour per scene.
import { BackSide, Color } from "three";
import { useMemo } from "react";

const vert = `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = `uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
void main(){ float h = smoothstep(-0.25, 0.6, vP.y); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }`;

export function Studio({ top = "#ffd9a8", bottom = "#ff8fb1", floor }: { top?: string; bottom?: string; floor?: string }) {
  const uniforms = useMemo(() => ({ top: { value: new Color(top) }, bottom: { value: new Color(bottom) } }), [top, bottom]);
  const floorColor = floor ?? bottom;
  return (
    <>
      <mesh scale={40}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>
      <fog attach="fog" args={[floorColor, 9, 26]} />
    </>
  );
}
