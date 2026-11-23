// Toy / clay look: physical material with clearcoat.
import type { MeshPhysicalMaterialParameters } from "three";

export const toy = (color: string, extra: MeshPhysicalMaterialParameters = {}): MeshPhysicalMaterialParameters => ({
  color,
  roughness: 0.45,
  metalness: 0,
  clearcoat: 0.6,
  clearcoatRoughness: 0.35,
  ...extra,
});
