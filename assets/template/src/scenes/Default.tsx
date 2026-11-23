// Fallback for any scene id/kind not registered yet: a plain studio, so a new script renders immediately
// and you can build scenes one at a time.
import { Cam } from "../engine/Cam";
import { Lights } from "../engine/Lights";
import { Studio } from "../engine/Studio";
import { useLayout } from "../layout";
import type { SceneDef } from "./types";

function DefaultStudio() {
  const { shot } = useLayout();
  return (
    <>
      <Cam {...shot} />
      <Lights />
      <Studio top="#cfd8ff" bottom="#8e9bd6" />
    </>
  );
}

export const DefaultScene: SceneDef = { Scene3D: DefaultStudio };
