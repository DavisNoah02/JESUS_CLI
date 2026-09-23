import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BOOKS, getBookByBollsId } from "../data/books.js";
import { defaultDataDir } from "./state.js";

export const COMPLETE_MARKER = ".complete";
export const BOOK_NAMES_FILE = "books.json";
const CHAPTER_FILE = /^\d+_\d+\.json$/;

export function translationDir(translation, { dataDir = defaultDataDir() } = {}) {
  return join(dataDir, "translations", String(translation).toUpperCase());
}

function chapterFile(bollsId, chapter) {
  return `${bollsId}_${chapter}.json`;
}

export async function saveChapter(translation, bollsId, chapter, verses, options = {}) {
  const dir = translationDir(translation, options);
  const target = join(dir, chapterFile(bollsId, chapter));
  const tmp = `${target}.tmp`;
  await mkdir(dir, { recursive: true });
  await writeFile(tmp, JSON.stringify(verses), "utf8");
  await rename(tmp, target);
}

export async function loadChapter(translation, bollsId, chapter, options = {}) {
  try {
    const contents = JSON.parse(
      await readFile(join(translationDir(translation, options), chapterFile(bollsId, chapter)), "utf8")
    );
    return Array.isArray(contents) ? contents : null;
  } catch {
    return null;
  }
}

export async function saveBookNames(translation, names, options = {}) {
  const dir = translationDir(translation, options);
  const target = join(dir, BOOK_NAMES_FILE);
  const tmp = `${target}.tmp`;
  await mkdir(dir, { recursive: true });
  await writeFile(tmp, JSON.stringify(names), "utf8");
  await rename(tmp, target);
}

export async function loadBookNames(translation, options = {}) {
  try {
    const names = JSON.parse(
      await readFile(join(translationDir(translation, options), BOOK_NAMES_FILE), "utf8")
    );
    return Array.isArray(names) ? names : null;
  } catch {
    return null;
  }
}

export async function isFullyCached(translation, options = {}) {
  try {
    await readFile(join(translationDir(translation, options), COMPLETE_MARKER), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function markComplete(translation, options = {}) {
  const dir = translationDir(translation, options);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, COMPLETE_MARKER), "", "utf8");
}

export async function removeCompleteMarker(translation, options = {}) {
  try {
    await rm(join(translationDir(translation, options), COMPLETE_MARKER), { force: true });
  } catch {
    // already gone
  }
}

export async function hasCachedData(translation, options = {}) {
  try {
    const entries = await readdir(translationDir(translation, options));
    return entries.some((entry) => CHAPTER_FILE.test(entry));
  } catch {
    return false;
  }
}

export async function search(translation, query, options = {}) {
  const needle = String(query ?? "").toLowerCase();
  if (!needle) return [];

  const dir = translationDir(translation, options);
  let files;
  try {
    files = (await readdir(dir)).filter((entry) => CHAPTER_FILE.test(entry));
  } catch {
    return [];
  }

  const raw = [];
  for (const file of files) {
    const [, bollsIdValue, chapterValue] = file.match(/^(\d+)_(\d+)\.json$/);
    const bollsId = Number(bollsIdValue);
    const chapter = Number(chapterValue);

    let verses;
    try {
      verses = JSON.parse(await readFile(join(dir, file), "utf8"));
    } catch {
      continue;
    }

    for (const { verse, text } of verses) {
      if (String(text).toLowerCase().includes(needle)) {
        raw.push({ bollsId, chapter, verse, text });
      }
    }
  }

  return raw
    .sort((a, b) => a.bollsId - b.bollsId || a.chapter - b.chapter || a.verse - b.verse)
    .map(({ bollsId, chapter, verse, text }) => {
      const bookInfo = getBookByBollsId(bollsId);
      return { book: bookInfo ? bookInfo.name : `#${bollsId}`, chapter, verse, text };
    });
}

export function totalChapters() {
  return BOOKS.reduce((sum, book) => sum + book.chapters, 0);
}