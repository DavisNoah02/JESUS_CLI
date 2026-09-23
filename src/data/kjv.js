import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { VerseNotFoundError } from "../errors.js";
import { BOOKS, normalizeBook } from "./books.js";

const dataPath = fileURLToPath(new URL("../../data/kjv.json", import.meta.url));

let kjvData;
let kjvByName;
let verseIndex;
let bookLayout;

export async function loadKjv() {
  if (!kjvData) {
    const contents = await readFile(dataPath, "utf8");
    kjvData = JSON.parse(contents);
    kjvByName = new Map(kjvData.map((entry) => [entry.book, entry]));
  }

  return kjvData;
}

export async function getChapter(bookValue, chapterNumber) {
  const bookName = normalizeBook(bookValue);
  await loadKjv();
  const book = kjvByName.get(bookName);
  const chapter = book?.chapters.find((entry) => Number(entry.chapter) === Number(chapterNumber));

  if (!chapter) {
    throw new VerseNotFoundError(`Chapter not found: ${bookName} ${chapterNumber}`);
  }

  return chapter.verses.map((verse) => ({
    verse: Number(verse.verse),
    text: verse.text
  }));
}

export async function getVerses(reference) {
  const chapter = await getChapter(reference.book, reference.chapter);
  const start = reference.verseStart ?? 1;
  const end = reference.verseEnd ?? chapter.length;
  const verses = chapter.filter((verse) => verse.verse >= start && verse.verse <= end);

  if (verses.length !== end - start + 1) {
    throw new VerseNotFoundError(
      `Verse not found: ${reference.book} ${reference.chapter}:${start}-${end}`
    );
  }

  return verses;
}

async function getVerseIndex() {
  if (!verseIndex) {
    const data = await loadKjv();
    verseIndex = [];
    for (const book of BOOKS) {
      const entry = kjvByName.get(book.name);
      if (!entry) continue;
      for (const storedChapter of entry.chapters) {
        const chapter = Number(storedChapter.chapter);
        for (const storedVerse of storedChapter.verses) {
          const text = storedVerse.text;
          verseIndex.push({
            book: book.name,
            chapter,
            verse: Number(storedVerse.verse),
            text,
            lower: text.toLowerCase()
          });
        }
      }
    }
  }

  return verseIndex;
}

export async function search(query, limit = 50) {
  const index = await getVerseIndex();
  const needle = String(query).toLowerCase();
  const matches = [];

  for (const item of index) {
    if (item.lower.includes(needle)) {
      matches.push({ book: item.book, chapter: item.chapter, verse: item.verse, text: item.text });
      if (matches.length >= limit) break;
    }
  }

  return matches;
}

async function getBookLayout() {
  if (!bookLayout) {
    const data = await loadKjv();
    bookLayout = BOOKS.map((book) => {
      const entry = kjvByName.get(book.name);
      return {
        name: book.name,
        chapters: book.chapters,
        chapterVerseCounts: entry ? entry.chapters.map((stored) => stored.verses.length) : []
      };
    });
  }

  return bookLayout;
}

async function pickVerseBySeed(seed) {
  const index = await getVerseIndex();
  const layout = await getBookLayout();

  const book = layout[seed % layout.length];
  const chapter = Math.floor(seed / 7) % book.chapters + 1;
  const verseCount = book.chapterVerseCounts[chapter - 1] ?? 0;
  const verse = verseCount > 0 ? (Math.floor(seed / 13) % verseCount) + 1 : 1;

  const item = index.find(
    (entry) => entry.book === book.name && entry.chapter === chapter && entry.verse === verse
  );
  if (!item) {
    throw new VerseNotFoundError(`Verse not found: ${book.name} ${chapter}:${verse}`);
  }

  return { book: item.book, chapter: item.chapter, verse: item.verse, text: item.text };
}

export async function randomVerse() {
  const seed = Number(process.hrtime.bigint() % BigInt(2 ** 32));
  return pickVerseBySeed(seed);
}

export async function verseOfTheDay(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return pickVerseBySeed(fnv1a(day));
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}