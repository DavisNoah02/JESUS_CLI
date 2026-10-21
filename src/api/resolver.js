import { getBook, getBookByBollsId } from "../data/books.js";
import {
  getChapter as getKjvChapter,
  getVerses as getKjvVerses,
  randomVerse as getKjvRandomVerse,
  search as searchKjv,
  verseOfTheDay as getKjvVerseOfTheDay
} from "../data/kjv.js";
import { UnsupportedTranslationError, VerseNotFoundError } from "../errors.js";
import {
  hasCachedData,
  isFullyCached,
  loadChapter,
  removeCompleteMarker,
  saveChapter,
  search as searchCache
} from "../store/cache.js";
import * as bolls from "./bolls.js";
import { isSupportedTranslation, normalizeTranslation } from "./translations.js";

const MAX_SEARCH_RESULTS = 50;

export function isKjv(translation) {
  return normalizeTranslation(translation) === "KJV";
}

function warn(options, message) {
  if (typeof options?.onWarn === "function") {
    options.onWarn(message);
  }
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

export async function getChapter(book, chapter, translation = "KJV", options = {}) {
  const bookInfo = resolveBook(book);
  const code = normalizeTranslation(translation);

  if (isKjv(code)) {
    return getKjvChapter(bookInfo.name, chapter);
  }

  assertChapterBounds(bookInfo, chapter);

  const cached = await loadChapter(code, bookInfo.bollsId, chapter, options);
  if (cached) return cached;

  if (await isFullyCached(code, options)) {
    await removeCompleteMarker(code, options);
  }

  const verses = await bolls.getChapter(code, bookInfo.bollsId, chapter);
  if (verses.length === 0) {
    if (!isSupportedTranslation(code)) {
      throw new UnsupportedTranslationError(
        `Unknown translation: ${code}. bolls.life does not serve it.`
      );
    }
    throw new VerseNotFoundError(
      `Chapter not found: ${bookInfo.name} ${chapter} (${code})`
    );
  }
  await saveChapter(code, bookInfo.bollsId, chapter, verses, options);
  return verses;
}

export async function getVerses(
  book,
  chapter,
  verseStart = null,
  verseEnd = null,
  translation = "KJV",
  options = {}
) {
  const bookInfo = resolveBook(book);
  const code = normalizeTranslation(translation);

  if (isKjv(code)) {
    return getKjvVerses({ book: bookInfo.name, chapter, verseStart, verseEnd });
  }

  const chapterVerses = await getChapter(bookInfo.name, chapter, code, options);
  if (chapterVerses.length === 0) {
    throw new VerseNotFoundError(`Chapter not found: ${bookInfo.name} ${chapter} (${code})`);
  }

  const start = verseStart ?? 1;
  const end =
    verseEnd ?? Math.max(...chapterVerses.map((entry) => Number(entry.verse)));
  const range = chapterVerses.filter((verse) => verse.verse >= start && verse.verse <= end);

  if (range.length !== end - start + 1) {
    throw new VerseNotFoundError(
      `Verse not found: ${bookInfo.name} ${chapter}:${start}-${end}`
    );
  }

  return range;
}

export function getVerse(book, chapter, verse, translation = "KJV", options = {}) {
  return getVerses(book, chapter, verse, verse, translation, options).then(
    (verses) => verses[0]
  );
}

export function getVerseRange(book, chapter, verseStart, verseEnd, translation = "KJV", options = {}) {
  return getVerses(book, chapter, verseStart, verseEnd, translation, options);
}

export async function search(query, translation = "KJV", options = {}) {
  const needle = String(query ?? "").trim();
  if (!needle) return [];

  const code = normalizeTranslation(translation);
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? options.limit
    : MAX_SEARCH_RESULTS;

  if (isKjv(code)) {
    return searchKjv(needle, limit);
  }

  if (await hasCachedData(code, options)) {
    return (await searchCache(code, needle, options)).slice(0, limit);
  }

  const results = await bolls.search(code, needle);
  return results.slice(0, limit).map(mapBollsSearchResult);
}

export async function getRandomVerse(translation = "KJV", options = {}) {
  const code = normalizeTranslation(translation);

  if (isKjv(code)) {
    return getKjvRandomVerse();
  }

  try {
    const verse = await bolls.getRandomVerse(code);
    const bookInfo = getBookByBollsId(verse.book);
    return {
      book: bookInfo ? bookInfo.name : `#${verse.book}`,
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text
    };
  } catch (error) {
    if (error?.name !== "NetworkError") {
      throw error;
    }
    warn(
      options,
      `Could not reach bolls.life for ${code} (${error.message}); showing a KJV verse instead.`
    );
    return getKjvRandomVerse();
  }
}

/**
 * The verse of the day for a translation.
 *
 * The day resolves to one deterministic KJV reference, which is then looked up
 * in the requested translation. If that translation cannot supply it, the KJV
 * text is used and the fallback is reported on stderr.
 */
export async function getVerseOfTheDay(translation = "KJV", options = {}) {
  const code = normalizeTranslation(translation);
  const base = await getKjvVerseOfTheDay();

  if (isKjv(code)) {
    return base;
  }

  try {
    const chapter = await getChapter(base.book, base.chapter, code, options);
    const match = chapter.find((entry) => Number(entry.verse) === Number(base.verse));

    if (match) {
      return { ...base, text: match.text };
    }

    warn(
      options,
      `Verse ${base.chapter}:${base.verse} is not present in ${code}; showing the KJV text instead.`
    );
  } catch (error) {
    if (error?.name === "NetworkError" || error?.name === "UnsupportedTranslationError") {
      warn(
        options,
        `Could not load ${code} for ${base.book} ${base.chapter} (${error.message}); showing the KJV text instead.`
      );
    } else {
      throw error;
    }
  }

  return base;
}
