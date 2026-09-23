import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../src/cli.js", import.meta.url));

function runCli(...args) {
  return spawnSync(process.execPath, [cliPath, ...args], { encoding: "utf8" });
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
