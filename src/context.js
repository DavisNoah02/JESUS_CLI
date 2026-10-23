import { UsageError } from "./errors.js";
import {
  DEFAULT_TRANSLATION,
  isSupportedTranslation,
  normalizeTranslation,
  translationCodes,
} from "./api/translations.js";
import { DEFAULT_THEME, THEME_NAMES, isValidTheme, normalizeTheme } from "./theme.js";

/**
 * Resolve the translation for this invocation.
 *
 * Precedence: `--translation` flag, then the saved state, then KJV.
 *
 * An explicit flag is validated strictly (a typo should fail loudly). A saved
 * value that is no longer valid only warns and falls back, so a stale
 * state file can never lock the user out of every command.
 *
 * @param {string|undefined} flagValue value of the `--translation` flag
 * @param {string|undefined} stateValue the saved translation
 * @param {(message: string) => void} [warn] called when a fallback is used
 * @returns {string} the translation code to use
 */
export function resolveTranslation(flagValue, stateValue, warn = () => {}) {
  if (flagValue !== undefined) {
    const code = normalizeTranslation(flagValue);
    if (!code) {
      throw new UsageError(
        `--translation requires a translation code. Supported: ${translationCodes()}`,
      );
    }
    if (!isSupportedTranslation(code)) {
      throw new UsageError(
        `Unknown translation: ${code}. Supported translations: ${translationCodes()}`,
      );
    }
    return code;
  }

  const saved = normalizeTranslation(stateValue);
  if (saved && isSupportedTranslation(saved)) {
    return saved;
  }
  if (saved) {
    warn(`Saved translation "${saved}" is not supported; using ${DEFAULT_TRANSLATION}.`);
  }

  return DEFAULT_TRANSLATION;
}

/**
 * Resolve the theme for this invocation.
 *
 * Precedence: `--theme` flag, then the saved state, then the default theme.
 *
 * @param {string|undefined} flagValue value of the `--theme` flag
 * @param {string|undefined} stateValue the saved theme
 * @param {(message: string) => void} [warn] called when a fallback is used
 * @returns {string} the theme name to use
 */
export function resolveTheme(flagValue, stateValue, warn = () => {}) {
  if (flagValue !== undefined) {
    const theme = normalizeTheme(flagValue);
    if (!theme) {
      throw new UsageError(
        `Unknown theme: ${flagValue}. Available themes: ${THEME_NAMES.join(", ")}`,
      );
    }
    return theme;
  }

  if (stateValue && isValidTheme(stateValue)) {
    return stateValue;
  }
  if (stateValue) {
    warn(`Saved theme "${stateValue}" is not available; using ${DEFAULT_THEME}.`);
  }

  return DEFAULT_THEME;
}

/**
 * Resolve the maximum number of search results.
 */
export function resolveLimit(flagValue) {
  if (flagValue === undefined) {
    return undefined;
  }

  const limit = Number(flagValue);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new UsageError(`--limit must be a positive integer (got "${flagValue}")`);
  }

  return limit;
}

export function resolveOffset(flagValue) {
  if (flagValue === undefined) {
    return 0;
  }

  const offset = Number(flagValue);
  if (!Number.isInteger(offset) || offset < 0) {
    throw new UsageError(`--offset must be a non-negative integer (got "${flagValue}")`);
  }

  return offset;
}
