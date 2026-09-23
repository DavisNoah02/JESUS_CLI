import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
