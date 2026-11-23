// Word-synced captions, driven entirely by timeline word times.
//  pop  : chunks of up to captions.maxWords, springy pop-in, thick outline, accent on highlight words
//  calm : the full line, words light up as spoken (serious sections)
//  none : no captions
// Everything (mode, size, case, outline, colours, position) comes from style.json / the scene's style.
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TL, sceneAt, type Line, type Word } from "../timeline";
import { styleFor } from "../style";
import { useLayout } from "../layout";
import { pop } from "../engine/anim";
import { fontStack, outlined } from "./text";

function chunks(words: Word[], max: number) {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= max || /[.!?,;:]$/.test(w.text)) {
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

export function Captions() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const st = styleFor(sceneAt(frame).id);
  const c = st.captions;
  const sec = frame / fps;
  const line = activeLine(sec);
  if (!line || !c.show || c.mode === "none") return null;
  const bottom = (c.bottom ?? L.captions.bottom) * L.height;
  const k = L.fontScale * c.size;
  const wrap = { justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom } as const;

  if (c.mode === "calm") {
    return (
      <AbsoluteFill style={wrap}>
        <div style={{ width: `${L.captions.maxWidth * 95}%`, textAlign: "center", fontFamily: fontStack(st.fonts.body), fontWeight: 600, fontSize: 54 * k, lineHeight: 1.35 }}>
          {line.words.map((w, i) => (
            <span key={i} style={{ color: sec >= w.start ? (w.hl ? st.colors.accent : st.colors.text) : st.colors.dimText, textShadow: "0 3px 12px rgba(0,0,0,.6)" }}>
              {w.text}{" "}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  const cs = chunks(line.words, Math.max(1, c.maxWords));
  const idx = cs.findLastIndex((ch) => sec >= ch[0].start - 0.03);
  const chunk = cs[Math.max(0, idx)];
  const s = pop(frame, Math.round(chunk[0].start * fps) - 1, fps, 9);
  return (
    <AbsoluteFill style={wrap}>
      <div
        style={{
          transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -4}deg)`,
          fontFamily: fontStack(st.fonts.body),
          fontWeight: c.weight,
          fontSize: 92 * k,
          lineHeight: 1.05,
          textTransform: c.uppercase ? "uppercase" : "none",
          textAlign: "center",
          maxWidth: `${L.captions.maxWidth * 100}%`,
          color: st.colors.text,
          ...outlined(st, c.outline * k),
        }}
      >
        {chunk.map((w, i) => (
          <span key={i} style={{ color: w.hl ? st.colors.accent : st.colors.text }}>
            {w.text}
            {i < chunk.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}
