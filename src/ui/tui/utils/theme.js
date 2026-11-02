import { DEFAULT_THEME, THEME_NAMES, normalizeTheme } from "../../../theme.js";

/**
 * Map the CLI's ANSI palettes onto named Ink colors. Ink accepts a small set of
 * named colors, so the TUI keeps a separate, explicit mapping rather than
 * parsing the escape codes in src/theme.js.
 */
export const TUI_COLORS = Object.freeze({
  Slate: Object.freeze({
    accent: "cyan",
    title: "white",
    muted: "gray",
    error: "red",
    highlight: "cyan",
  }),
  Midnight: Object.freeze({
    accent: "magenta",
    title: "white",
    muted: "gray",
    error: "red",
    highlight: "magenta",
  }),
  Forest: Object.freeze({
    accent: "green",
    title: "white",
    muted: "gray",
    error: "red",
    highlight: "green",
  }),
  Ember: Object.freeze({
    accent: "yellow",
    title: "white",
    muted: "gray",
    error: "red",
    highlight: "yellow",
  }),
});

/**
 * @param {string|null|undefined} name
 */
export function colorsFor(name) {
  const canonical = normalizeTheme(name) ?? DEFAULT_THEME;
  return TUI_COLORS[canonical] ?? TUI_COLORS[DEFAULT_THEME];
}

/**
 * @param {string|null|undefined} name
 */
export function cycleThemeName(name) {
  const canonical = normalizeTheme(name) ?? DEFAULT_THEME;
  const index = THEME_NAMES.indexOf(canonical);
  return THEME_NAMES[(index + 1) % THEME_NAMES.length];
}
