import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getChapter, getRandomVerse, getVerse, getVerseRange, getVerses, isKjv, search } from "../src/api/resolver.js";
import { loadChapter, saveChapter } from "../src/store/cache.js";

const newDir = () => mkdtemp(join(tmpdir(), "resolver-"));

test("isKjv normalizes casing", () => {
  assert.equal(isKjv("KJV"), true);
  assert.equal(isKjv("kjv"), true);
  assert.equal(isKjv("kjV"), true);
  assert.equal(isKjv("WEB"), false);
});

test("KJV chapters resolve locally without network", async () => {
  const chapter = await getChapter("John", 3, "KJV");
  assert.equal(chapter.length, 36);
  assert.match(chapter[15].text, /For God so loved the world/);
});

test("KJV aliases and single verses resolve locally", async () => {
  const verse = await getVerse("jn", 3, 16, "KJV");
  assert.equal(verse.verse, 16);
  const range = await getVerseRange("Psalm", 23, 1, 6, "KJV");
  assert.equal(range.length, 6);
  const whole = await getVerses("John", 3, null, null, "kjv");
  assert.equal(whole.length, 36);
});

test("KJV search caps at 50 in canonical order", async () => {
  const results = await search("the", "KJV");
  assert.equal(results.length, 50);
  assert.equal(results[0].book, "Genesis");
  assert.match(results[0].text, /^In the beginning/);
});

test("KJV random verse returns a shaped verse", async () => {
  const verse = await getRandomVerse("KJV");
  assert.ok(verse.book.length > 0);
  assert.ok(verse.chapter >= 1);
  assert.ok(verse.text.length > 0);
});

test("rejects bad chapter bounds locally", async () => {
  const dir = await newDir();
  await assert.rejects(
    getChapter("Genesis", 51, "WEB"),
    { name: "VerseNotFoundError", message: /Genesis has 50 chapters/ }
  );
  await assert.rejects(
    getVerse("John", 3, 99, "KJV"),
    { name: "VerseNotFoundError" }
  );
  await assert.rejects(
    getChapter("Genesis", 51, "WEB", { dataDir: dir }),
    { name: "VerseNotFoundError", message: /Genesis has 50 chapters/ }
  );
});

test("WEB chapters resolve over the network and write through to the cache", async (t) => {
  const dir = await newDir();
  try {
    const chapter = await getChapter("John", 3, "WEB", { dataDir: dir });
    assert.ok(chapter.length >= 1);
    assert.equal(chapter[0].verse, 1);
    assert.doesNotMatch(chapter[0].text, /<|>/);

    const cached = await loadChapter("WEB", 43, 3, { dataDir: dir });
    assert.ok(cached.length >= 1);
    assert.equal(cached[0].verse, 1);
  } catch (error) {
    if (error.name === "NetworkError") return t.skip("bolls.life unreachable");
    throw error;
  }
});

test("WEB search returns shaped results with book names", async (t) => {
  const dir = await newDir();
  try {
    const results = await search("faith", "WEB", { dataDir: dir });
    assert.ok(results.length >= 1);
    assert.match(results[0].book, /^[A-Za-z]/);
  } catch (error) {
    if (error.name === "NetworkError") return t.skip("bolls.life unreachable");
    throw error;
  }
});

test("WEB chapters are served from cache without hitting the network", async () => {
  const dir = await newDir();
  await saveChapter("WEB", 43, 3, [{ verse: 16, text: "For God so loved the world." }], { dataDir: dir });

  const chapter = await getChapter("John", 3, "WEB", { dataDir: dir });
  assert.equal(chapter.length, 1);
  assert.equal(chapter[0].verse, 16);
});

test("WEB cached chapters disappear when corrupt files are detected", async (t) => {
  const dir = await newDir();
  await saveChapter("WEB", 43, 3, [{ verse: 16, text: "For God so loved the world." }], { dataDir: dir });
  await writeFile(
    join(dir, "translations", "WEB", "43_3.json"),
    "{ not valid json",
    "utf8"
  );

  try {
    const chapter = await getChapter("John", 3, "WEB", { dataDir: dir });
    assert.equal(chapter.length, 36);
  } catch (error) {
    if (error.name === "NetworkError") return t.skip("bolls.life unreachable");
    throw error;
  }
});

test("WEB search uses the cache once a translation has cached data", async () => {
  const dir = await newDir();
  await saveChapter("WEB", 43, 3, [{ verse: 16, text: "For God so loved the world." }], { dataDir: dir });

  const results = await search("shepherd", "WEB", { dataDir: dir });
  assert.deepEqual(results, []);
});