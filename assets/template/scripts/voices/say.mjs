// macOS `say` — free, offline, robotic. No word timings (estimated from word length).
import { execFileSync } from "node:child_process";

export default {
  name: "say",
  label: "macOS say",
  voiceField: "voice",
  async synth({ spoken, cfg, tmp }) {
    const file = `${tmp}.aiff`;
    const args = ["-o", file];
    if (cfg.voice) args.push("-v", cfg.voice);
    if (cfg.rate) args.push("-r", String(cfg.rate));
    execFileSync("say", [...args, spoken]);
    return { file };
  },
};
