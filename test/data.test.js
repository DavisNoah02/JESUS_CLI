import test from "node:test";
import assert from "node:assert/strict";
import { BOOKS, getBook, getBookByBollsId, normalizeBook } from "../src/data/books.js";
import { loadKjv, getChapter, getVerses, randomVerse, search, verseOfTheDay } from "../src/data/kjv.js";
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

test("maps bolls ids back to books", () => {
  assert.equal(getBookByBollsId(19).name, "Psalms");
  assert.equal(getBookByBollsId(66).name, "Revelation");
  assert.equal(getBookByBollsId(999), null);
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

test("searches case-insensitively in canonical order", async () => {
  const results = await search("FOR GOD SO LOVED");
  assert.ok(results.length >= 1);
  const hit = results.find((entry) => entry.book === "John" && entry.chapter === 3 && entry.verse === 16);
  assert.match(hit.text, /For God so loved the world/);
});

test("caps search at 50 results, starting at Genesis 1:1", async () => {
  const results = await search("the");
  assert.equal(results.length, 50);
  assert.deepEqual(
    { book: results[0].book, chapter: results[0].chapter, verse: results[0].verse },
    { book: "Genesis", chapter: 1, verse: 1 }
  );
});

test("randomVerse returns real verses and varies across runs", async () => {
  const seen = new Set();
  for (let i = 0; i < 8; i += 1) {
    const verse = await randomVerse();
    assert.ok(verse.text.length > 0);
    assert.ok(seen.size >= 0);
    seen.add(`${verse.book} ${verse.chapter}:${verse.verse}`);
  }
  assert.ok(seen.size > 1, "expected variation across randomVerse runs");
});

test("verseOfTheDay is stable per date and varies across days", async () => {
  const morning = await verseOfTheDay(new Date("2026-09-23T10:00:00Z"));
  const evening = await verseOfTheDay(new Date("2026-09-23T23:59:00Z"));
  assert.deepEqual(morning, evening);

  const days = [];
  for (let d = 0; d < 10; d += 1) {
    const verse = await verseOfTheDay(new Date(`2026-09-2${d}T12:00:00Z`));
    days.push(`${verse.book} ${verse.chapter}:${verse.verse}`);
  }
  assert.ok(new Set(days).size > 1, "expected different verses across days");
});