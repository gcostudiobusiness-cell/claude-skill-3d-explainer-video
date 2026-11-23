// Any command-line TTS (Piper, Kokoro, espeak-ng, Coqui, a script of your own…).
// cfg: { cmd: ["program", "arg", "{text}", "{out}"], ext = "wav", stdin = false }
//   {text} → the spoken text   {out} → the file the command must write
//   stdin: true sends the text on stdin instead of {text}.
// Runs without a shell (no injection through script text). No word timings unless your tool gives them.
import { execFileSync } from "node:child_process";

export default {
  name: "command",
  label: "Command-line TTS",
  voiceField: "voice",
  async synth({ spoken, cfg, tmp }) {
    if (!Array.isArray(cfg.cmd) || !cfg.cmd.length) throw new Error('command: set speaker.command.cmd to an array, e.g. ["piper", "--model", "en.onnx", "--output_file", "{out}"]');
    const out = `${tmp}.${cfg.ext ?? "wav"}`;
    const fill = (a) => a.replaceAll("{out}", out).replaceAll("{text}", spoken).replaceAll("{voice}", cfg.voice ?? "");
    const [prog, ...args] = cfg.cmd.map(fill);
    execFileSync(prog, args, { input: cfg.stdin ? spoken : undefined, stdio: [cfg.stdin ? "pipe" : "ignore", "ignore", "inherit"] });
    return { file: out };
  },
};
