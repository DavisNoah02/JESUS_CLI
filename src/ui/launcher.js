import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI_PATH = fileURLToPath(new URL("../cli.js", import.meta.url));
const EMBEDDED_FLAG = "--tui-in-place";

/**
 * Commands whose result can be shown in the TUI. `config` is included only
 * without an action, because `config set` is a write command and must run as
 * typed.
 */
const TUI_COMMANDS = new Set(["start", "read", "search", "random", "today", "books", "config"]);

/**
 * @param {Record<string, string|undefined>} [env]
 * @returns {"tmux"|"kitty"|"wezterm"|"konsole"|"gnome-terminal"|null}
 */
export function detectTerminal(env = process.env) {
  if (env.TMUX) return "tmux";
  if (env.KITTY_WINDOW_ID) return "kitty";
  if (env.WEZTERM_PANE) return "wezterm";
  if (env.KONSOLE_VERSION) return "konsole";
  if (env.GNOME_TERMINAL_SERVICE) return "gnome-terminal";
  return null;
}

/**
 * Build the argv for the TUI child. The embedded flag stops the child from
 * spawning yet another tab.
 *
 * @param {string[]} argv original CLI arguments
 * @returns {string[]}
 */
export function buildChildArgs(argv) {
  const cleaned = argv.filter((arg) => arg !== EMBEDDED_FLAG);
  return [process.execPath, CLI_PATH, ...cleaned, EMBEDDED_FLAG];
}

/**
 * Spawn the TUI in a new tab/window of the host terminal.
 *
 * @param {ReturnType<typeof detectTerminal>} terminal
 * @param {string[]} argv original CLI arguments
 * @returns {Promise<boolean>} true when the host accepted the request
 */
export function spawnInNewTab(terminal, argv) {
  const child = buildChildArgs(argv);
  let command;
  let args;

  switch (terminal) {
    case "tmux":
      command = "tmux";
      args = ["new-window", "-n", "Jesus", ...child];
      break;
    case "kitty":
      command = "kitty";
      args = ["@", "launch", "--type=tab", "--", ...child];
      break;
    case "wezterm":
      command = "wezterm";
      args = ["cli", "spawn", "--new-window", "--", ...child];
      break;
    case "konsole":
      command = "konsole";
      args = ["--new-tab", "-e", ...child];
      break;
    case "gnome-terminal":
      command = "gnome-terminal";
      args = ["--tab", "--", ...child];
      break;
    default:
      return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: "ignore", detached: true });
    proc.once("error", () => resolve(false));
    proc.once("spawn", () => {
      proc.unref();
      resolve(true);
    });
  });
}

/**
 * Decide whether the TUI should take over, and where.
 *
 * Order: explicit opt-outs (non-TTY, --json, --no-tui) → child marker → new
 * terminal tab → in-place mount. A missing terminal integration falls back to
 * the in-place TUI rather than plain text, because the caller is already on a
 * TTY.
 *
 * @param {object} options
 * @param {string} options.command
 * @param {import("../api/types.js").CommandContext} options.context
 * @param {string[]} options.argv original CLI arguments
 * @param {Record<string, string|undefined>} [options.env]
 * @param {{ isTTY?: boolean, write?: (chunk: string) => unknown }} [options.stdout]
 * @param {{ isTTY?: boolean }} [options.stdin]
 * @returns {Promise<boolean>} true when the TUI was launched (or spawned)
 */
export async function maybeLaunchTui({
  command,
  context,
  argv,
  env = process.env,
  stdout = process.stdout,
  stdin = process.stdin,
}) {
  if (!TUI_COMMANDS.has(command)) return false;
  if (command === "config" && context.positionals.length > 0) return false;
  if (env.JESUS_NO_TUI === "1" || env.NODE_TEST_CONTEXT || env.NODE_ENV === "test") return false;
  if (context.flags["no-tui"] || context.flags.json) return false;
  if (!stdout.isTTY || !stdin.isTTY) return false;

  if (!context.flags["tui-in-place"]) {
    const terminal = detectTerminal(env);
    if (terminal && (await spawnInNewTab(terminal, argv))) {
      if (typeof stdout.write === "function") {
        stdout.write("Opening the TUI in a new terminal tab…\n");
      }
      return true;
    }
  }

  const { mountCommandTui } = await import("./index.js");
  return mountCommandTui({ command, context });
}
