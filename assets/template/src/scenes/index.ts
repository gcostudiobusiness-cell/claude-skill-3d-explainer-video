// Scene registry — THE place you change for each video.
// Keys match a scene's `kind` in lines.json (kind defaults to its id), so one component can serve several scenes.
// Anything not listed falls back to DefaultScene.
//
// The `example/` scenes and character are a demo of the engine, not a kit to reuse. Design each video's
// characters, sets and scenes fresh from its sample's style notes, then replace these entries.
import type { Scene } from "../timeline";
import type { SceneDef } from "./types";
import { DefaultScene } from "./Default";
import { Hook, ScriptStep, AudioStep, Outro } from "./example/ExampleScenes";

const registry: Record<string, SceneDef> = {
  hook: Hook,
  script: ScriptStep,
  audio: AudioStep,
  outro: Outro,
};

export const sceneFor = (s: Scene): SceneDef => registry[s.kind] ?? DefaultScene;
