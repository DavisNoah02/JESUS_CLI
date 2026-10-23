import { paint } from "../theme.js";
import { printResult } from "../logger.js";

export function printJson(type, data) {
  printResult(JSON.stringify({ schemaVersion: 1, type, data }, null, 2));
}

/**
 * Render one verse as a single line:
 *
 *   John 3:16 - For God so loved the world... (KJV)
 */
export function printVerse(verse, context) {
  const reference = paint(`${verse.book} ${verse.chapter}:${verse.verse}`, "ref", {
    theme: context.theme,
    enabled: context.colorEnabled,
  });
  const label = paint(`(${context.translation})`, "muted", {
    theme: context.theme,
    enabled: context.colorEnabled,
  });

  printResult(`${reference} - ${verse.text} ${label}`);
}
