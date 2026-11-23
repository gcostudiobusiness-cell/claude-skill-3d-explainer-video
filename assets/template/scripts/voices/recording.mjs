// Your own recordings — one audio file per line. No word timings (estimated).
// File per line: line.file, else <cfg.dir>/<sceneId>_<lineIndex>.<ext> (default recordings/hook_0.wav).
// Any format ffmpeg reads works (wav, m4a, mp3, aiff…). Re-recording a file invalidates its cache.
import fs from "node:fs";
import path from "node:path";

const fileFor = ({ line, sceneId, lineIndex }, cfg) =>
  line.file ?? path.join(cfg.dir ?? "recordings", `${sceneId}_${lineIndex}.${cfg.ext ?? "wav"}`);

export default {
  name: "recording",
  label: "Own recordings",
  cacheExtra: (ctx, cfg) => {
    const f = fileFor(ctx, cfg);
    if (!fs.existsSync(f)) return { f, missing: true };
    const st = fs.statSync(f);
    return { f, size: st.size, mtime: st.mtimeMs };
  },
  /** Checked for every line before anything is generated, so all missing files are listed at once. */
  check: (ctx, cfg) => {
    const f = fileFor(ctx, cfg);
    return fs.existsSync(f) ? null : `missing ${f} — record: "${ctx.line.text}"`;
  },
  async synth({ cfg, ctx }) {
    const file = fileFor(ctx, cfg);
    if (!fs.existsSync(file)) throw new Error(`recording: missing ${file} — record this line: "${ctx.line.text}"`);
    return { file };
  },
};
