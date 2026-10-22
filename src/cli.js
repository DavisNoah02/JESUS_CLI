#!/usr/bin/env node

import { parseArgs } from "./args.js";
import { COMMANDS } from "./commands/index.js";
import { resolveLimit, resolveTheme, resolveTranslation } from "./context.js";
import { UsageError } from "./errors.js";
import { printError, printResult, printWarning } from "./logger.js";
import { load as loadState, statePath } from "./store/state.js";
import { shouldUseColor } from "./theme.js";
import { version } from "./version.js";

const USAGE = `Usage: Jesus <command> [<reference>]

Commands:
  read <reference>   Read verses (e.g. "John 3:16", "Psalm 23:1-6", "John 3")
  search <query>     Search the Bible, up to 50 results
  random             Show a random verse
  today              Show today's verse (stable for the current day)
  config <action>    Read or write settings (list | get | set)
  --version          Print the version
  --help             Show this help

Options:
  -t, --translation <CODE>   Translation to use (e.g. KJV, WEB, NIV)
      --theme <NAME>         Theme to use (Slate, Midnight)
  -n, --limit <N>            Maximum number of search results
      --no-color             Disable colored output
      --debug                Show stack traces for errors
  --                         Treat everything after this as plain arguments

Examples:
  Jesus read "John 3:16"
  Jesus --translation WEB read "John 3:16"
  Jesus config set translation WEB
  Jesus search faith --limit 10`;

const KNOWN_ERROR_NAMES = new Set([
  "ReferenceParseError",
  "BookNotFoundError",
  "VerseNotFoundError",
  "CacheCorruptError",
  "NetworkError",
  "UnsupportedTranslationError",
]);

async function buildContext(parsed) {
  const state = await loadState();
  let resolvedTheme = "Slate";

  const warn = (message) => {
    printWarning(message, resolvedTheme);
  };

  const theme = resolveTheme(parsed.flags.theme, state.theme, warn);
  resolvedTheme = theme;

  const translation = resolveTranslation(parsed.flags.translation, state.translation, warn);
  const limit = resolveLimit(parsed.flags.limit);

  const options = { onWarn: warn };
  if (limit !== undefined) {
    options.limit = limit;
  }

  return {
    state,
    statePath: statePath(),
    positionals: parsed.positionals,
    flags: parsed.flags,
    translation,
    theme,
    limit,
    colorEnabled: shouldUseColor() && !parsed.flags["no-color"],
    options,
  };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.flags.version) {
    printResult(`Jesus CLI ${version()}`);
    return;
  }

  if (parsed.flags.help) {
    printResult(USAGE);
    return;
  }

  const command = parsed.command;

  if (!command) {
    printError(USAGE);
    process.exitCode = 1;
    return;
  }

  const handler = COMMANDS[command];
  if (!handler) {
    printError(`Unknown command: ${command}`);
    process.exitCode = 1;
    return;
  }

  const context = await buildContext(parsed);
  await handler(context);
}

main().catch((error) => {
  const debug = process.argv.includes("--debug");
  const known = error instanceof UsageError || KNOWN_ERROR_NAMES.has(error?.name);

  if (known) {
    printError(debug && error?.stack ? error.stack : error.message);
    process.exitCode = 1;
    return;
  }

  printError(error?.stack ?? `Unexpected error: ${error?.message ?? String(error)}`);
  process.exitCode = 70;
});
