import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../src/args.js";

test("splits a command and its positionals", () => {
  const parsed = parseArgs(["read", "John 3:16"]);
  assert.equal(parsed.command, "read");
  assert.deepEqual(parsed.positionals, ["John 3:16"]);
  assert.deepEqual(parsed.flags, {});
});

test("keeps unquoted references as separate positionals", () => {
  const parsed = parseArgs(["read", "John", "3:16"]);
  assert.equal(parsed.command, "read");
  assert.deepEqual(parsed.positionals, ["John", "3:16"]);
});

test("reads long options with a separate value", () => {
  const parsed = parseArgs(["--translation", "WEB", "read", "John 3:16"]);
  assert.equal(parsed.command, "read");
  assert.equal(parsed.flags.translation, "WEB");
  assert.deepEqual(parsed.positionals, ["John 3:16"]);
});

test("reads long options in the = form", () => {
  const parsed = parseArgs(["read", "John 3:16", "--translation=WEB"]);
  assert.equal(parsed.flags.translation, "WEB");
  assert.deepEqual(parsed.positionals, ["John 3:16"]);
});

test("reads boolean options", () => {
  const parsed = parseArgs(["read", "John 3:16", "--no-color", "--debug"]);
  assert.equal(parsed.flags["no-color"], true);
  assert.equal(parsed.flags.debug, true);
  assert.deepEqual(parsed.positionals, ["John 3:16"]);
});

test("reads short options", () => {
  const parsed = parseArgs(["-t", "WEB", "-n", "5", "-h"]);
  assert.equal(parsed.flags.translation, "WEB");
  assert.equal(parsed.flags.limit, "5");
  assert.equal(parsed.flags.help, true);
});

test("treats everything after -- as positional", () => {
  const parsed = parseArgs(["search", "--", "--help"]);
  assert.equal(parsed.command, "search");
  assert.deepEqual(parsed.positionals, ["--help"]);
  assert.deepEqual(parsed.flags, {});
});

test("finds options before, between, and after positionals", () => {
  const before = parseArgs(["--translation", "WEB", "read", "John 3:16"]);
  const between = parseArgs(["read", "--translation", "WEB", "John 3:16"]);
  const after = parseArgs(["read", "John 3:16", "--translation", "WEB"]);

  for (const parsed of [before, between, after]) {
    assert.equal(parsed.command, "read");
    assert.equal(parsed.flags.translation, "WEB");
    assert.deepEqual(parsed.positionals, ["John 3:16"]);
  }
});

test("rejects unknown options", () => {
  assert.throws(() => parseArgs(["read", "John 3:16", "--bogus"]), {
    name: "UsageError",
    message: /Unknown option: --bogus/,
  });
  assert.throws(() => parseArgs(["read", "-z"]), {
    name: "UsageError",
    message: /Unknown option: -z/,
  });
});

test("rejects options that are missing a value", () => {
  assert.throws(() => parseArgs(["read", "--translation"]), {
    name: "UsageError",
    message: /Option --translation requires a value/,
  });
  assert.throws(() => parseArgs(["read", "-t"]), {
    name: "UsageError",
    message: /Option -t requires a value/,
  });
  assert.throws(() => parseArgs(["read", "--translation", "--no-color"]), {
    name: "UsageError",
    message: /Option --translation requires a value/,
  });
});

test("rejects a value passed to a boolean option", () => {
  assert.throws(() => parseArgs(["read", "--no-color=yes"]), {
    name: "UsageError",
    message: /Option --no-color does not take a value/,
  });
});

test("returns an undefined command for empty input", () => {
  const parsed = parseArgs([]);
  assert.equal(parsed.command, undefined);
  assert.deepEqual(parsed.positionals, []);
  assert.deepEqual(parsed.flags, {});
});
