import { getBook, getBookByBollsId } from "../data/books.js";
import {
  getChapter as getKjvChapter,
  getVerses as getKjvVerses,
  randomVerse as getKjvRandomVerse,
  search as searchKjv
} from "../data/kjv.js";
import { VerseNotFoundError } from "../errors.js";
import * as bolls from "./bolls.js";

const MAX_SEARCH_RESULTS = 50;

export function isKjv(translation) {
  return String(translation).toUpperCase() === "KJV";
}

function resolveBook(book) {
  const bookInfo = getBook(book);
  return bookInfo;
}

function assertChapterBounds(bookInfo, chapter) {
  if (chapter < 1 || chapter > bookInfo.chapters) {
    throw new VerseNotFoundError(
      `${bookInfo.name} has ${bookInfo.chapters} chapter${bookInfo.chapters === 1 ? "" : "s"}, but chapter ${chapter} was requested`
    );
  }
}

function mapBollsSearchResult(entry) {
  const bookInfo = getBookByBollsId(entry.book);
  return {
    book: bookInfo ? bookInfo.name : `#${entry.book}`,
    chapter: entry.chapter,
    verse: entry.verse,
    text: entry.text
  };
}

export async function getChapter(book, chapter, translation = "KJV") {
  const bookInfo = resolveBook(book);

  if (isKjv(translation)) {
    return getKjvChapter(bookInfo.name, chapter);
  }

  assertChapterBounds(bookInfo, chapter);
  const verses = await bolls.getChapter(translation, bookInfo.bollsId, chapter);
  if (verses.length === 0) {
    throw new VerseNotFoundError(
      `Chapter not found: ${bookInfo.name} ${chapter} (${translation})`
    );
  }
  return verses;
}

export async function getVerses(
  book,
  chapter,
  verseStart = null,
  verseEnd = null,
  translation = "KJV"
) {
  const bookInfo = resolveBook(book);

  if (isKjv(translation)) {
    return getKjvVerses({ book: bookInfo.name, chapter, verseStart, verseEnd });
  }

  const chapterVerses = await getChapter(bookInfo.name, chapter, translation);
  const start = verseStart ?? 1;
  const end = verseEnd ?? chapterVerses.length;
  const range = chapterVerses.filter((verse) => verse.verse >= start && verse.verse <= end);

  if (range.length !== end - start + 1) {
    throw new VerseNotFoundError(
      `Verse not found: ${bookInfo.name} ${chapter}:${start}-${end}`
    );
  }

  return range;
}

export function getVerse(book, chapter, verse, translation = "KJV") {
  return getVerses(book, chapter, verse, verse, translation).then(
    (verses) => verses[0]
  );
}

export function getVerseRange(book, chapter, verseStart, verseEnd, translation = "KJV") {
  return getVerses(book, chapter, verseStart, verseEnd, translation);
}

export async function search(query, translation = "KJV") {
  const needle = String(query ?? "").trim();
  if (!needle) return [];

  if (isKjv(translation)) {
    return searchKjv(needle, MAX_SEARCH_RESULTS);
  }

  const results = await bolls.search(translation, needle);
  return results.slice(0, MAX_SEARCH_RESULTS).map(mapBollsSearchResult);
}

export async function getRandomVerse(translation = "KJV") {
  if (isKjv(translation)) {
    return getKjvRandomVerse();
  }

  try {
    const verse = await bolls.getRandomVerse(translation);
    const bookInfo = getBookByBollsId(verse.book);
    return {
      book: bookInfo ? bookInfo.name : `#${verse.book}`,
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text
    };
  } catch {
    return getKjvRandomVerse();
  }
}