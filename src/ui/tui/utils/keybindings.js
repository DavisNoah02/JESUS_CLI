export function isExitKey(input, key) {
  if (input === "q" || input === "Q") return true;
  if (key && key.escape) return true;
  return false;
}

/**
 * True for a single printable character. Used by text-entry panes so that
 * control and navigation keys are never appended to a query.
 */
export function isPrintable(input, key) {
  if (typeof input !== "string" || input.length !== 1) return false;
  if (key && (key.ctrl || key.meta)) return false;
  return true;
}
