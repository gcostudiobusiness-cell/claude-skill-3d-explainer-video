// Fallback for any scene id/kind not registered yet: a plain studio, so a new script renders immediately
// and you can build scenes one at a time.
import { Cam, frameSubject } from "../engine/Cam";
import { Lights } from "../engine/Lights";
import { Studio } from "../engine/Studio";
import type { SceneDef } from "./types";

export const DefaultScene: SceneDef = {
  Scene3D: () => (
    <>
      <Cam {...frameSubject()} />
      <Lights />
      <Studio top="#cfd8ff" bottom="#8e9bd6" />
    </>
  ),
};
