export function isExitKey(input, key) {
  if (input === "q" || input === "Q") return true;
  if (key && key.escape) return true;
  return false;
}
