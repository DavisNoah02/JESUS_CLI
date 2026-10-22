const PALETTES = Object.freeze({
  Slate: Object.freeze({
    ref: "36;1",
    muted: "2",
    error: "31;1",
    warning: "33;1",
    accent: "32",
  }),
  Midnight: Object.freeze({
    ref: "35;1",
    muted: "2",
    error: "31;1",
    warning: "93;1",
    accent: "94",
  }),
});

const DEFAULT_PALETTE = "Slate";

export const THEME_NAMES = Object.freeze(Object.keys(PALETTES));
export const DEFAULT_THEME = DEFAULT_PALETTE;

/**
 * Decide whether ANSI colour should be used for a stream.
 *
 * @param {object} [options]
 * @param {Record<string, string|undefined>} [options.env] environment to read
 * @param {{ isTTY?: boolean }} [options.stream] the stream that will be written to
 * @returns {boolean}
 */
export function shouldUseColor({ env = process.env, stream = process.stdout } = {}) {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== "") return false;
  if (env.TERM === "dumb") return false;
  if (!stream || !stream.isTTY) return false;
  return true;
}

export function palette(name) {
  return PALETTES[name] ?? PALETTES[DEFAULT_PALETTE];
}

export function isValidTheme(name) {
  return THEME_NAMES.includes(name);
}

/**
 * Resolve a user-supplied theme name to its canonical casing.
 * Matching is case-insensitive ("midnight" -> "Midnight").
 */
export function normalizeTheme(name) {
  if (typeof name !== "string") return DEFAULT_THEME;
  const wanted = name.trim().toLowerCase();
  return THEME_NAMES.find((theme) => theme.toLowerCase() === wanted) ?? null;
}

export function paint(text, style, { enabled = shouldUseColor(), theme = DEFAULT_PALETTE } = {}) {
  const codes = palette(theme)[style];
  if (!enabled || !codes) return String(text ?? "");
  return `\u001b[${codes}m${text}\u001b[0m`;
}
