import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Manrope bundled in public/fonts, so rendering works offline. */
export const FONT_FAMILY = "Manrope";

export const fontsReady = Promise.all([
  loadFont({ family: FONT_FAMILY, url: staticFile("fonts/manrope-latin-500-normal.woff2"), weight: "500" }),
  loadFont({ family: FONT_FAMILY, url: staticFile("fonts/manrope-latin-700-normal.woff2"), weight: "700" }),
  loadFont({ family: FONT_FAMILY, url: staticFile("fonts/manrope-latin-800-normal.woff2"), weight: "800" }),
]);
