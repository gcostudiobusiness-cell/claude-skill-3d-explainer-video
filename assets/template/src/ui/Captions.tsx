// Word-synced captions, driven entirely by timeline word times.
//  pop  : 1–3 word chunks, springy pop-in, thick outline (paint-order), accent on highlight words
//  calm : the full line, words light up as they are spoken (for serious sections)
//  none : no captions for this scene
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TL, sceneAt, type Line, type Word } from "../timeline";
import { pop } from "../engine/anim";
import { theme } from "./theme";

const CHUNK_MAX = 3;

/** Split a line's words into chunks of ≤3, breaking after punctuation. */
function chunks(words: Word[]) {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= CHUNK_MAX || /[.!?,;:]$/.test(w.text)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

function activeLine(sec: number): Line | null {
  for (const s of TL.scenes) for (const l of s.lines) if (sec >= l.start - 0.05 && sec <= l.end + 0.25) return l;
  return null;
}

export function Captions({ bottom = 0.15 }: { bottom?: number }) {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const mode = sceneAt(frame).captions;
  const sec = frame / fps;
  const line = activeLine(sec);
  if (!line || mode === "none") return null;

  const outline = {
    WebkitTextStroke: "14px #000",
    paintOrder: "stroke fill",
  } as const;

  if (mode === "calm") {
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * bottom }}>
        <div style={{ width: "84%", textAlign: "center", fontFamily: theme.body, fontWeight: 600, fontSize: 54, lineHeight: 1.35 }}>
          {line.words.map((w, i) => (
            <span key={i} style={{ color: sec >= w.start ? (w.hl ? theme.accent : "#fff") : "rgba(255,255,255,0.35)", textShadow: "0 3px 12px rgba(0,0,0,.6)" }}>
              {w.text}{" "}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  const cs = chunks(line.words);
  const idx = cs.findLastIndex((c) => sec >= c[0].start - 0.03);
  const chunk = cs[Math.max(0, idx)];
  const at = Math.round(chunk[0].start * fps);
  const s = pop(frame, at - 1, fps, 9);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * bottom }}>
      <div
        style={{
          transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -4}deg)`,
          fontFamily: theme.body,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.05,
          textTransform: "uppercase",
          textAlign: "center",
          maxWidth: "88%",
          color: "#fff",
          ...outline,
        }}
      >
        {chunk.map((w, i) => (
          <span key={i} style={{ color: w.hl ? theme.accent : "#fff" }}>
            {w.text}
            {i < chunk.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}
