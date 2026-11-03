import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "../src/args.js";
import { THEME_NAMES, palette } from "../src/theme.js";
import { colorsFor, cycleThemeName, TUI_COLORS } from "../src/ui/tui/utils/theme.js";
import { isExitKey, isPrintable } from "../src/ui/tui/utils/keybindings.js";
import { loadReadingPosition, saveReadingPosition } from "../src/ui/tui/hooks/usePosition.js";

test("--tui and --no-tui are boolean flags", () => {
  assert.deepEqual(parseArgs(["read", "John 3:16", "--tui"]).flags, { tui: true });
  assert.deepEqual(parseArgs(["read", "John 3:16", "--no-tui"]).flags, { "no-tui": true });
});

test("--tui rejects an inline value", () => {
  assert.throws(() => parseArgs(["--tui=yes"]), /does not take a value/);
});

test("the TUI offers four selectable themes", () => {
  assert.deepEqual([...THEME_NAMES], ["Slate", "Midnight", "Forest", "Ember"]);
  assert.equal(new Set(THEME_NAMES.map((name) => palette(name).ref)).size, THEME_NAMES.length);
});

test("every theme has an Ink colour mapping and unknown names fall back", () => {
  for (const name of THEME_NAMES) {
    assert.ok(TUI_COLORS[name], `missing Ink colours for ${name}`);
  }
  assert.deepEqual(colorsFor("nope"), TUI_COLORS.Slate);
});

test("cycleThemeName walks the registry and wraps", () => {
  assert.equal(cycleThemeName("Slate"), "Midnight");
  assert.equal(cycleThemeName("Midnight"), "Forest");
  assert.equal(cycleThemeName("Forest"), "Ember");
  assert.equal(cycleThemeName("Ember"), "Slate");
  assert.equal(cycleThemeName("unknown"), "Midnight");
});

test("exit keys are q, Q, and Escape", () => {
  assert.equal(isExitKey("q", {}), true);
  assert.equal(isExitKey("Q", {}), true);
  assert.equal(isExitKey("", { escape: true }), true);
  assert.equal(isExitKey("x", {}), false);
});

test("isPrintable accepts single characters and rejects control keys", () => {
  assert.equal(isPrintable("a", {}), true);
  assert.equal(isPrintable(" ", {}), true);
  assert.equal(isPrintable("ab", {}), false);
  assert.equal(isPrintable("c", { ctrl: true }), false);
  assert.equal(isPrintable("", { return: true }), false);
});

test("reading position survives a save/load round-trip", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-tui-"));
  const previous = process.env.JESUS_CLI_DATA_DIR;
  process.env.JESUS_CLI_DATA_DIR = dir;
  try {
    const position = { book: "John", chapter: 3, verse: 16, translation: "KJV" };
    assert.equal(await saveReadingPosition(position), true);
    assert.deepEqual(await loadReadingPosition(), position);
  } finally {
    if (previous === undefined) {
      delete process.env.JESUS_CLI_DATA_DIR;
    } else {
      process.env.JESUS_CLI_DATA_DIR = previous;
    }
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadReadingPosition returns null when nothing is saved", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-tui-empty-"));
  const previous = process.env.JESUS_CLI_DATA_DIR;
  process.env.JESUS_CLI_DATA_DIR = dir;
  try {
    assert.equal(await loadReadingPosition(), null);
  } finally {
    if (previous === undefined) {
      delete process.env.JESUS_CLI_DATA_DIR;
    } else {
      process.env.JESUS_CLI_DATA_DIR = previous;
    }
    await rm(dir, { recursive: true, force: true });
  }
});

test("detectTerminal recognises supported hosts", async () => {
  const { detectTerminal } = await import("../src/ui/launcher.js");
  assert.equal(detectTerminal({ TMUX: "/tmp/tmux" }), "tmux");
  assert.equal(detectTerminal({ KITTY_WINDOW_ID: "1" }), "kitty");
  assert.equal(detectTerminal({ WEZTERM_PANE: "1" }), "wezterm");
  assert.equal(detectTerminal({ KONSOLE_VERSION: "240000" }), "konsole");
  assert.equal(detectTerminal({ GNOME_TERMINAL_SERVICE: ":1.1" }), "gnome-terminal");
  assert.equal(detectTerminal({ TERM: "xterm" }), null);
});

test("buildChildArgs appends one embedded marker", async () => {
  const { buildChildArgs } = await import("../src/ui/launcher.js");
  const args = buildChildArgs(["read", "John 3:16", "--tui-in-place"]);
  assert.equal(args[0], process.execPath);
  assert.match(args[1], /cli\.js$/);
  assert.deepEqual(args.slice(2), ["read", "John 3:16", "--tui-in-place"]);
  assert.equal(args.filter((arg) => arg === "--tui-in-place").length, 1);
});

test("an unsupported terminal does not spawn a tab", async () => {
  const { spawnInNewTab } = await import("../src/ui/launcher.js");
  assert.equal(await spawnInNewTab(null, ["read", "John 3:16"]), false);
});

/**
 * @param {Partial<import("../src/api/types.js").CommandContext>} [overrides]
 * @returns {import("../src/api/types.js").CommandContext}
 */
function makeContext(overrides = {}) {
  return {
    state: {},
    statePath: "/tmp/jesus-state.json",
    positionals: ["John 3:16"],
    flags: {},
    translation: "KJV",
    theme: "Slate",
    limit: undefined,
    offset: 0,
    colorEnabled: false,
    options: {},
    ...overrides,
  };
}

test("maybeLaunchTui opts out for pipes, JSON, --no-tui, and tests", async () => {
  const { maybeLaunchTui } = await import("../src/ui/launcher.js");
  const tty = { isTTY: true };
  const base = {
    command: "read",
    context: makeContext(),
    argv: ["read", "John 3:16"],
    env: /** @type {Record<string, string|undefined>} */ ({}),
    stdin: tty,
    stdout: tty,
  };

  assert.equal(await maybeLaunchTui({ ...base, stdout: {} }), false);
  assert.equal(
    await maybeLaunchTui({ ...base, context: makeContext({ flags: { json: true } }) }),
    false,
  );
  assert.equal(
    await maybeLaunchTui({ ...base, context: makeContext({ flags: { "no-tui": true } }) }),
    false,
  );
  assert.equal(await maybeLaunchTui({ ...base, env: { NODE_TEST_CONTEXT: "1" } }), false);
  assert.equal(await maybeLaunchTui({ ...base, env: { JESUS_NO_TUI: "1" } }), false);
});

test("config with an action stays on the plain-text path", async () => {
  const { maybeLaunchTui } = await import("../src/ui/launcher.js");
  const tty = { isTTY: true };
  const launched = await maybeLaunchTui({
    command: "config",
    context: makeContext({ positionals: ["set", "theme", "Midnight"] }),
    argv: ["config", "set", "theme", "Midnight"],
    env: {},
    stdin: tty,
    stdout: tty,
  });
  assert.equal(launched, false);
});

test("--tui-in-place is a recognised flag", () => {
  assert.deepEqual(parseArgs(["start", "--tui-in-place"]).flags, { "tui-in-place": true });
});
