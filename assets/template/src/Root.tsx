import { Composition } from "remotion";
import { Video } from "./Video";
import { TL } from "./timeline";

export const Root = () => (
  <Composition id="Main" component={Video} durationInFrames={TL.durationInFrames} fps={TL.fps} width={TL.width} height={TL.height} />
);
