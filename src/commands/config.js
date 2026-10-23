import {
  isSupportedTranslation,
  normalizeTranslation,
  translationCodes,
} from "../api/translations.js";
import { UsageError } from "../errors.js";
import { printResult } from "../logger.js";
import { save } from "../store/state.js";
import { THEME_NAMES, normalizeTheme } from "../theme.js";

const SETTINGS = ["translation", "theme"];

const USAGE = `Usage: jesuschrist config <action> [key] [value]

Actions:
  list                 Show every setting
  get <key>            Show one setting
  set <key> <value>    Change a setting and save it

Settings:
  translation          ${translationCodes()}
  theme                ${THEME_NAMES.join(", ")}`;

function validateSetting(key, value) {
  if (key === "theme") {
    const theme = normalizeTheme(value);
    if (!theme) {
      throw new UsageError(`Unknown theme: ${value}. Available themes: ${THEME_NAMES.join(", ")}`);
    }
    return theme;
  }

  if (key === "translation") {
    const code = normalizeTranslation(value);
    if (!code) {
      throw new UsageError(
        `Unknown translation: ${value}. Supported translations: ${translationCodes()}`,
      );
    }
    if (!isSupportedTranslation(code)) {
      throw new UsageError(
        `Unknown translation: ${code}. Supported translations: ${translationCodes()}`,
      );
    }
    return code;
  }

  throw new UsageError(`Unknown setting: ${key}. Valid settings: ${SETTINGS.join(", ")}`);
}

export async function configCommand(context) {
  const [action, key, ...rest] = context.positionals;

  if (action === undefined) {
    throw new UsageError(USAGE);
  }

  if (action === "list") {
    for (const setting of SETTINGS) {
      printResult(`${setting} = ${context.state[setting]}`);
    }
    return;
  }

  if (action === "get") {
    if (!key) {
      throw new UsageError(
        `Usage: jesuschrist config get <key>  (keys: ${SETTINGS.join(", ")})`,
      );
    }
    if (!SETTINGS.includes(key)) {
      throw new UsageError(`Unknown setting: ${key}. Valid settings: ${SETTINGS.join(", ")}`);
    }
    printResult(String(context.state[key]));
    return;
  }

  if (action === "set") {
    if (!key || rest.length === 0) {
      throw new UsageError(
        `Usage: jesuschrist config set <key> <value>  (keys: ${SETTINGS.join(", ")})`,
      );
    }
    if (!SETTINGS.includes(key)) {
      throw new UsageError(`Unknown setting: ${key}. Valid settings: ${SETTINGS.join(", ")}`);
    }

    const value = validateSetting(key, rest.join(" "));
    const next = { ...context.state, [key]: value };
    await save(next, { path: context.statePath });

    context.state = next;
    printResult(`${key} = ${value}`);
    return;
  }

  throw new UsageError(`Unknown config action: ${action}. Valid actions: list, get, set`);
}
