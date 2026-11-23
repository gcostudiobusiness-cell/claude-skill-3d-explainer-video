import { Composition } from "remotion";
import { Video } from "./Video";
import { TL } from "./timeline";
import { FORMAT, FORMATS, STYLE } from "./style";

// Size comes from style.json "format" (live). fps is baked into the timeline, so it must match.
if (TL.fps !== STYLE.fps) {
  throw new Error(`style.json fps is ${STYLE.fps} but the timeline was built at ${TL.fps} fps — run \`npm run audio\``);
}

export const Root = () => (
  <Composition id="Main" component={Video} durationInFrames={TL.durationInFrames} fps={TL.fps} width={FORMATS[FORMAT].width} height={FORMATS[FORMAT].height} />
);
