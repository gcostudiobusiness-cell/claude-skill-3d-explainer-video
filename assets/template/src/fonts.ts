// Fonts bundled with the video (local files, no network at render time).
// To use another font: `npm i @fontsource/<name>`, import its weights here, add it to FONT_FACES,
// then set "fonts" in script/style.json.
import "@fontsource/anton/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";

/** Faces to wait for before rendering (CSS font shorthand). */
export const FONT_FACES = ["400 80px Anton", "600 40px Poppins", "800 40px Poppins"];
