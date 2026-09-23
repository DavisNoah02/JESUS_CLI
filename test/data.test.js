import test from "node:test";
import assert from "node:assert/strict";
import { BOOKS, getBook, normalizeBook } from "../src/data/books.js";
import { loadKjv, getChapter, getVerses } from "../src/data/kjv.js";
import { parseReference } from "../src/data/reference.js";

test("contains the 66 canonical books", () => {
  assert.equal(BOOKS.length, 66);
  assert.equal(normalizeBook("jn"), "John");
  assert.equal(normalizeBook("1cor"), "1 Corinthians");
});

test("exposes bollsId and chapter counts for every book", () => {
  for (const book of BOOKS) {
    assert.equal(book.bollsId, book.number);
    assert.ok(book.chapters >= 1, `${book.name} chapter count`);
  }
  assert.equal(getBook("Genesis").chapters, 50);
  assert.equal(getBook("Psalms").chapters, 150);
  assert.equal(getBook("Obadiah").chapters, 1);
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

test("rejects out-of-range chapters", () => {
  assert.throws(
    () => parseReference("Genesis 51"),
    { name: "ReferenceParseError", message: /Genesis has 50 chapters, but chapter 51 was requested/ }
  );
  assert.throws(
    () => parseReference("John 0"),
    { name: "ReferenceParseError" }
  );
});

test("loads KJV verses lazily", async () => {
  const data = await loadKjv();
  assert.equal(data.length, 66);
  const chapter = await getChapter("John", 3);
  assert.match(chapter[15].text, /For God so loved the world/);
  const verses = await getVerses(parseReference("John 3:16"));
  assert.equal(verses[0].verse, 16);
});

test("resolves ranges and whole chapters", async () => {
  const range = await getVerses(parseReference("Psalm 23:1-6"));
  assert.equal(range.length, 6);
  assert.equal(range[0].verse, 1);
  assert.equal(range[5].verse, 6);

  const chapter = await getVerses(parseReference("John 3"));
  assert.equal(chapter.length, 36);
  assert.equal(chapter[0].verse, 1);
  assert.equal(chapter[35].verse, 36);
});

test("rejects verse ranges beyond the chapter", async () => {
  await assert.rejects(
    getVerses(parseReference("John 3:99")),
    { name: "VerseNotFoundError" }
  );
});
