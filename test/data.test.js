import test from "node:test";
import assert from "node:assert/strict";
import { BOOKS, normalizeBook } from "../src/data/books.js";
import { loadKjv, getChapter, getVerses } from "../src/data/kjv.js";
import { parseReference } from "../src/data/reference.js";

test("contains the 66 canonical books", () => {
  assert.equal(BOOKS.length, 66);
  assert.equal(normalizeBook("jn"), "John");
  assert.equal(normalizeBook("1cor"), "1 Corinthians");
});

test("parses chapter and verse references", () => {
  assert.deepEqual(parseReference("jn3:16"), {
    book: "John",
    chapter: 3,
    verseStart: 16,
    verseEnd: 16
  });
  assert.deepEqual(parseReference("Psalm 23:1-6"), {
    book: "Psalms",
    chapter: 23,
    verseStart: 1,
    verseEnd: 6
  });
  assert.deepEqual(parseReference("1 Cor 13"), {
    book: "1 Corinthians",
    chapter: 13,
    verseStart: null,
    verseEnd: null
  });
});

test("loads KJV verses lazily", async () => {
  const data = await loadKjv();
  assert.equal(data.length, 66);
  const chapter = await getChapter("John", 3);
  assert.match(chapter[15].text, /For God so loved the world/);
  const verses = await getVerses(parseReference("John 3:16"));
  assert.equal(verses[0].verse, 16);
});