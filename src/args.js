import { UsageError } from "./errors.js";

const STRING_OPTIONS = new Map([
  ["translation", "translation"],
  ["theme", "theme"],
  ["limit", "limit"],
]);

const BOOLEAN_OPTIONS = new Map([
  ["no-color", "no-color"],
  ["debug", "debug"],
  ["help", "help"],
  ["version", "version"],
]);

const SHORT_OPTIONS = new Map([
  ["t", "translation"],
  ["n", "limit"],
  ["h", "help"],
  ["V", "version"],
]);

function looksLikeOption(token) {
  if (typeof token !== "string") return false;
  if (!token.startsWith("-") || token.length < 2) return false;
  if (token === "--") return true;
  if (/^-\d/.test(token)) return false;
  return true;
}

function readValue(argv, index, label) {
  const next = argv[index + 1];
  if (next === undefined || next === "--" || looksLikeOption(next)) {
    throw new UsageError(`Option ${label} requires a value`);
  }
  return next;
}

/**
 * Split argv into a command, positionals, and flags.
 *
 * Positionals keep their order so that unquoted references such as
 * `read John 3:16` still join back into a single reference string.
 */
export function parseArgs(argv = []) {
  const positionals = [];
  const flags = {};
  let terminated = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (terminated) {
      positionals.push(arg);
      continue;
    }

    if (arg === "--") {
      terminated = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const equals = arg.indexOf("=");
      const name = equals === -1 ? arg.slice(2) : arg.slice(2, equals);
      const inline = equals === -1 ? null : arg.slice(equals + 1);

      if (BOOLEAN_OPTIONS.has(name)) {
        if (inline !== null) {
          throw new UsageError(`Option --${name} does not take a value`);
        }
        flags[BOOLEAN_OPTIONS.get(name)] = true;
        continue;
      }

      if (STRING_OPTIONS.has(name)) {
        if (inline !== null) {
          flags[STRING_OPTIONS.get(name)] = inline;
          continue;
        }
        flags[STRING_OPTIONS.get(name)] = readValue(argv, index, `--${name}`);
        index += 1;
        continue;
      }

      throw new UsageError(`Unknown option: ${arg}`);
    }

    if (/^-[^-]/.test(arg)) {
      const short = arg.slice(1);
      const long = SHORT_OPTIONS.get(short);

      if (long === undefined) {
        throw new UsageError(`Unknown option: ${arg}`);
      }

      if (BOOLEAN_OPTIONS.has(long)) {
        flags[long] = true;
        continue;
      }
      flags[long] = readValue(argv, index, `-${short}`);
      index += 1;
      continue;
    }

    positionals.push(arg);
  }

  const command = positionals.length > 0 ? positionals.shift() : undefined;

  return { command, positionals, flags };
}
