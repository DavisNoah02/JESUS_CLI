import test from "node:test";
import assert from "node:assert/strict";
import { paint, palette, shouldUseColor } from "../src/theme.js";

test("shouldUseColor honors NO_COLOR", () => {
  const tty = { isTTY: true };
  assert.equal(shouldUseColor({ env: {}, stream: tty }), true);
  assert.equal(shouldUseColor({ env: { NO_COLOR: "1" }, stream: tty }), false);
  assert.equal(shouldUseColor({ env: { NO_COLOR: "" }, stream: tty }), true);
});

test("shouldUseColor returns false for non-TTY streams and dumb terminals", () => {
  assert.equal(shouldUseColor({ env: {}, stream: {} }), false);
  assert.equal(shouldUseColor({ env: {}, stream: { isTTY: false } }), false);
  assert.equal(shouldUseColor({ env: { TERM: "dumb" }, stream: { isTTY: true } }), false);
});

test("paint leaves output plain when disabled and wraps in ANSI codes when enabled", () => {
  const text = "John 3:16";
  assert.equal(paint(text, "ref", { enabled: false }), text);
  assert.match(paint(text, "ref", { enabled: true }), /^\u001b\[36;1mJohn 3:16\u001b\[0m$/);
});

test("unknown styles and themes fall back safely", () => {
  assert.equal(paint("x", "nope", { enabled: true }), "x");
  assert.equal(paint("x", "ref", { enabled: true, theme: "Nope" }), "\u001b[36;1mx\u001b[0m");
});

test("palette() falls back to Slate and Midnight differs", () => {
  assert.equal(palette("Slate").ref, "36;1");
  assert.equal(palette("Midnight").ref, "35;1");
  assert.equal(palette("Unknown"), palette("Slate"));
});