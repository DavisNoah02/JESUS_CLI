import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../src/cli.js", import.meta.url));

let dataDir;

test.before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "jesus-cli-"));
});

test.after(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

/**
 * Every CLI test runs against a throwaway data directory, so no test ever
 * reads or writes the developer's real state or cache.
 */
function runCli(...args) {
  return runCliIn(dataDir, ...args);
}

function runCliIn(dir, ...args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    env: { ...process.env, JESUS_CLI_DATA_DIR: dir },
  });
}

test("read prints a single verse to stdout", () => {
  const result = runCli("read", "John 3:16");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^John 3:16 - For God so loved the world.*\(KJV\)\n$/);
});

test("read prints a verse range", () => {
  const result = runCli("read", "Psalm 23:1-6");
  assert.equal(result.status, 0);
  const lines = result.stdout.trim().split("\n");
  assert.equal(lines.length, 6);
  assert.match(lines[0], /^Psalms 23:1 - /);
  assert.match(lines[5], /^Psalms 23:6 - /);
});

test("read prints a whole chapter", () => {
  const result = runCli("read", "John 3");
  assert.equal(result.status, 0);
  const lines = result.stdout.trim().split("\n");
  assert.equal(lines.length, 36);
  assert.match(lines[0], /^John 3:1 - /);
});

test("read sends out-of-range chapter errors to stderr with exit code 1", () => {
  const result = runCli("read", "Genesis 51");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Genesis has 50 chapters, but chapter 51 was requested/);
});

test("read sends unknown book errors to stderr with exit code 1", () => {
  const result = runCli("read", "Fakiosity 1:1");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Invalid Bible reference|Book not found/);
});

test("unknown commands fail with exit code 1", () => {
  const result = runCli("nope");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown command: nope/);
});

test("search caps results at 50 in canonical order", () => {
  const result = runCli("search", "the");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const lines = result.stdout.trim().split("\n");
  assert.equal(lines.length, 50);
  assert.match(lines[0], /^Genesis 1:1 - /);
});

test("search prints matching verses in canonical order", () => {
  const result = runCli("search", "love one another");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const lines = result.stdout.trim().split("\n");
  assert.ok(lines.length >= 1);
  assert.match(lines[0], /^John 13:34 - /);
});

test("search with no hits exits 0 and prints a message", () => {
  const result = runCli("search", "zzzzzzzzzz");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, 'No results for "zzzzzzzzzz"\n');
});

test("search with no query fails with exit code 1", () => {
  const result = runCli("search");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Usage: Jesus search/);
});

test("random prints a single verse and varies per run", () => {
  const one = runCli("random");
  const two = runCli("random");
  assert.equal(one.status, 0);
  assert.equal(one.stderr, "");
  assert.match(one.stdout, /^[A-Za-z0-9 ]+ \d+:\d+ - .* \(KJV\)\n$/);
  assert.notEqual(one.stdout, two.stdout);
});

test("today is stable within a day and exits 0", () => {
  const one = runCli("today");
  const two = runCli("today");
  assert.equal(one.status, 0);
  assert.equal(one.stderr, "");
  assert.match(one.stdout, /^[A-Za-z0-9 ]+ \d+:\d+ - .* \(KJV\)\n$/);
  assert.equal(one.stdout, two.stdout);
});

test("--version prints a semver", () => {
  const result = runCli("--version");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout.trim(), /^Jesus CLI \d+\.\d+\.\d+$/);
});

test("--help prints usage to stdout", () => {
  const result = runCli("--help");
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /^Usage: Jesus <command>/);
});

test("search tolerates an early-closing pipe", () => {
  const command = `"${process.execPath}" "${cliPath}" search the | head -1`;
  const output = execSync(command, { encoding: "utf8", shell: "/bin/sh" });
  assert.match(output, /^Genesis 1:1 - /);
  assert.doesNotMatch(output, /EPIPE/);
});

test("read accepts an unquoted reference", () => {
  const result = runCli("read", "John", "3:16");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^John 3:16 - For God so loved the world/);
});

test("a flag is never swallowed into the reference", () => {
  const result = runCli("read", "John", "3:16", "--translation", "KJV");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^John 3:16 - For God so loved the world/);
});

test("flags work before, between, and after the command", () => {
  const before = runCli("--translation", "KJV", "read", "John 3:16");
  const between = runCli("read", "--translation", "KJV", "John 3:16");
  const after = runCli("read", "John 3:16", "--translation", "KJV");

  for (const result of [before, between, after]) {
    assert.equal(result.status, 0);
    assert.match(result.stdout, /^John 3:16 - For God so loved the world.*\(KJV\)\n$/);
  }
});

test("an unknown option fails with a usage error", () => {
  const result = runCli("read", "John 3:16", "--bogus");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown option: --bogus/);
});

test("an unknown translation fails and lists the supported codes", () => {
  const result = runCli("--translation", "ZZZ", "read", "John 3:16");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown translation: ZZZ/);
  assert.match(result.stderr, /KJV, WEB/);
});

test("an unknown theme fails and lists the available themes", () => {
  const result = runCli("--theme", "Neon", "read", "John 3:16");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown theme: Neon/);
  assert.match(result.stderr, /Slate, Midnight/);
});

test("--no-color produces plain output", () => {
  const result = runCli("read", "John 3:16", "--no-color");
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test("config list prints every setting", () => {
  const result = runCli("config", "list");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^translation = KJV$/m);
  assert.match(result.stdout, /^theme = Slate$/m);
});

test("config get prints one setting", () => {
  const result = runCli("config", "get", "translation");
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "KJV");
});

test("config get rejects an unknown setting", () => {
  const result = runCli("config", "get", "nope");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown setting: nope/);
});

test("config set persists a setting to disk and applies it", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-config-"));
  try {
    const set = runCliIn(dir, "config", "set", "theme", "Midnight");
    assert.equal(set.status, 0);
    assert.match(set.stdout, /^theme = Midnight$/m);

    const saved = JSON.parse(await readFile(join(dir, "jesus-cli", "state.json"), "utf8"));
    assert.equal(saved.theme, "Midnight");

    const listed = runCliIn(dir, "config", "list");
    assert.match(listed.stdout, /^theme = Midnight$/m);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("config set normalizes theme casing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-config-"));
  try {
    const result = runCliIn(dir, "config", "set", "theme", "midnight");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /^theme = Midnight$/m);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("config set rejects an invalid value", () => {
  const result = runCli("config", "set", "theme", "Neon");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown theme: Neon/);
});

test("a saved translation is used by later commands", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-config-"));
  try {
    const set = runCliIn(dir, "config", "set", "translation", "WEB");
    assert.equal(set.status, 0);

    const result = runCliIn(dir, "read", "John 3:16");
    if (
      result.status !== 0 &&
      /bolls\.life|Bolls request failed|Bolls API responded/i.test(result.stderr)
    ) {
      return;
    }
    assert.equal(result.status, 0);
    assert.match(result.stdout, /John 3:16 - .*\(WEB\)/);
    assert.match(result.stdout, /one and only Son/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the --translation flag is ephemeral and never writes state", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-config-"));
  try {
    runCliIn(dir, "--translation", "KJV", "read", "John 3:16");

    const listed = runCliIn(dir, "config", "list");
    assert.match(listed.stdout, /^translation = KJV$/m);

    const wroteState = await readFile(join(dir, "jesus-cli", "state.json"), "utf8").then(
      () => true,
      () => false,
    );
    assert.equal(wroteState, false, "a flag must not create a state file");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("search honours --limit", () => {
  const result = runCli("search", "shepherd", "--limit", "2");
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim().split("\n").length, 2);
});

test("search rejects a non positive --limit", () => {
  const result = runCli("search", "faith", "--limit", "0");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--limit must be a positive integer/);
});

test("search treats everything after -- as the query", () => {
  const result = runCli("search", "--", "--help");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /No results for "--help"/);
});

test("today is stable within a day", () => {
  const one = runCli("today");
  const two = runCli("today");
  assert.equal(one.status, 0);
  assert.equal(one.stdout, two.stdout);
});

test("JESUS_CLI_DATA_DIR redirects the state file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jesus-data-"));
  try {
    const result = runCliIn(dir, "config", "set", "theme", "Midnight");
    assert.equal(result.status, 0);

    const saved = JSON.parse(await readFile(join(dir, "jesus-cli", "state.json"), "utf8"));
    assert.equal(saved.theme, "Midnight");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
