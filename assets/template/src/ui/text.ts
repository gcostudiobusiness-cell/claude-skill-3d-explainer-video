// Shared text styling derived from the style (fonts, colours, outline).
import type { CSSProperties } from "react";
import type { Style } from "../style";

export const fontStack = (name: string) => `"${name}", Helvetica, Arial, sans-serif`;

/** Thick outline drawn behind the fill (paint-order), so letters stay readable on any background. */
export const outlined = (s: Style, width: number): CSSProperties => ({
  WebkitTextStroke: `${width}px ${s.colors.outline}`,
  paintOrder: "stroke fill",
});
