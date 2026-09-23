const PALETTES = Object.freeze({
  Slate: Object.freeze({
    ref: "36;1",
    muted: "2",
    error: "31;1",
    accent: "32"
  }),
  Midnight: Object.freeze({
    ref: "35;1",
    muted: "2",
    error: "31;1",
    accent: "94"
  })
});

const DEFAULT_PALETTE = "Slate";

export function shouldUseColor({ env = process.env, stream = process.stdout } = {}) {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== "") return false;
  if (env.TERM === "dumb") return false;
  if (!stream || !stream.isTTY) return false;
  return true;
}

export function palette(name) {
  return PALETTES[name] ?? PALETTES[DEFAULT_PALETTE];
}

export function paint(text, style, { enabled = shouldUseColor(), theme = DEFAULT_PALETTE } = {}) {
  const codes = palette(theme)[style];
  if (!enabled || !codes) return String(text ?? "");
  return `\u001b[${codes}m${text}\u001b[0m`;
}