import test from "node:test";
import assert from "node:assert/strict";
import { UsageError } from "../src/errors.js";
import { resolveLimit, resolveTheme, resolveTranslation } from "../src/context.js";

function collector() {
  const messages = [];
  return { messages, warn: (message) => messages.push(message) };
}

test("an explicit translation flag wins and is validated strictly", () => {
  const { messages } = collector();
  assert.equal(resolveTranslation("WEB", "KJV", collector().warn), "WEB");
  assert.equal(messages.length, 0);
  assert.throws(() => resolveTranslation("ZZZ", "KJV", collector().warn), {
    name: "UsageError",
    message: /Unknown translation: ZZZ/,
  });
});

test("falls back to the saved translation when no flag is given", () => {
  assert.equal(resolveTranslation(undefined, "WEB", collector().warn), "WEB");
});

test("falls back to KJV when nothing is saved", () => {
  assert.equal(resolveTranslation(undefined, undefined, collector().warn), "KJV");
  assert.equal(resolveTranslation(undefined, "KJV", collector().warn), "KJV");
});

test("warns and falls back when the saved translation is no longer valid", () => {
  const { messages, warn } = collector();
  assert.equal(resolveTranslation(undefined, "ZZZ", warn), "KJV");
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Saved translation "ZZZ" is not supported/);
});

test("resolves themes case-insensitively to their canonical name", () => {
  assert.equal(resolveTheme("midnight", "Slate", collector().warn), "Midnight");
  assert.equal(resolveTheme("MIDNIGHT", "Slate", collector().warn), "Midnight");
  assert.equal(resolveTheme("Slate", "Midnight", collector().warn), "Slate");
});

test("rejects an unknown theme flag and lists the valid ones", () => {
  assert.throws(() => resolveTheme("Neon", "Slate", collector().warn), {
    name: "UsageError",
    message: /Unknown theme: Neon.*Slate, Midnight/,
  });
});

test("warns and falls back when the saved theme is no longer available", () => {
  const { messages, warn } = collector();
  assert.equal(resolveTheme(undefined, "Neon", warn), "Slate");
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Saved theme "Neon" is not available/);
});

test("resolves the search limit", () => {
  assert.equal(resolveLimit(undefined), undefined);
  assert.equal(resolveLimit("10"), 10);
});

test("rejects a non positive or non integer limit", () => {
  assert.throws(() => resolveLimit("0"), { name: "UsageError", message: /positive integer/ });
  assert.throws(() => resolveLimit("-3"), { name: "UsageError", message: /positive integer/ });
  assert.throws(() => resolveLimit("abc"), { name: "UsageError", message: /positive integer/ });
  assert.throws(() => resolveLimit("1.5"), { name: "UsageError", message: /positive integer/ });
});

test("every usage failure is a UsageError", () => {
  assert.throws(() => resolveLimit("0"), UsageError);
});
