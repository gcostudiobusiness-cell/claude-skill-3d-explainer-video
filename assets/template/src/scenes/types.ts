import type { FC } from "react";
import type { Scene } from "../timeline";

export type SceneProps = { scene: Scene };
/** A scene = 3D content (inside the canvas) + optional HTML overlay. Both get scene-relative frames. */
export type SceneDef = { Scene3D: FC<SceneProps>; SceneUI?: FC<SceneProps> };
