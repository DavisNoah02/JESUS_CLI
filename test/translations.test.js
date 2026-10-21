import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TRANSLATION,
  TRANSLATIONS,
  isSupportedTranslation,
  listTranslations,
  normalizeTranslation,
  translationCodes,
  translationName
} from "../src/api/translations.js";

test("normalizes casing and whitespace", () => {
  assert.equal(normalizeTranslation("web"), "WEB");
  assert.equal(normalizeTranslation("  web  "), "WEB");
  assert.equal(normalizeTranslation("kjv"), "KJV");
  assert.equal(normalizeTranslation(undefined), "");
  assert.equal(normalizeTranslation(null), "");
});

test("recognises supported translations", () => {
  assert.equal(isSupportedTranslation("KJV"), true);
  assert.equal(isSupportedTranslation("web"), true);
  assert.equal(isSupportedTranslation("ZZZ"), false);
  assert.equal(isSupportedTranslation(""), false);
});

test("exposes display names for known translations", () => {
  assert.equal(translationName("WEB"), "World English Bible");
  assert.equal(translationName("ZZZ"), null);
  assert.equal(translationName("kjv"), "King James Version");
});

test("lists every translation with a code and a name", () => {
  const list = listTranslations();
  assert.equal(list.length, Object.keys(TRANSLATIONS).length);
  assert.ok(list.length >= 10);
  assert.ok(list.every((entry) => entry.code && entry.name));
  assert.ok(list.some((entry) => entry.code === "KJV"));
});

test("renders the supported codes as a comma separated list", () => {
  const codes = translationCodes();
  assert.ok(codes.includes("KJV"));
  assert.ok(codes.includes("WEB"));
  assert.equal(codes.split(", ").length, Object.keys(TRANSLATIONS).length);
});

test("defaults to KJV", () => {
  assert.equal(DEFAULT_TRANSLATION, "KJV");
});
