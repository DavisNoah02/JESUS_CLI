import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BOOKS, getBookByBollsId } from "../data/books.js";
import { APP_DIR, defaultDataDir } from "./state.js";

export const COMPLETE_MARKER = ".complete";
export const BOOK_NAMES_FILE = "books.json";
const CHAPTER_FILE = /^\d+_\d+\.json$/;

export function translationDir(translation, { dataDir = defaultDataDir() } = {}) {
  return join(dataDir, APP_DIR, "translations", String(translation).toUpperCase());
}

/**
 * The cache used to live at <dataDir>/translations while state lived under
 * <dataDir>/jesus-cli. This is the legacy location, kept only so existing
 * caches can be migrated on first use.
 */
export function legacyTranslationsDir({ dataDir = defaultDataDir() } = {}) {
  return join(dataDir, "translations");
}

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Move a pre-namespace cache into <dataDir>/jesus-cli/translations.
 *
 * Runs at most once per data directory per process. Anything that already
 * exists in the target is left alone; the legacy directory is only removed
 * once it is empty.
 */
export async function migrateLegacyCache(options = {}) {
  const dataDir = options.dataDir ?? defaultDataDir();
  const legacy = legacyTranslationsDir({ dataDir });

  if (!(await pathExists(legacy))) {
    return false;
  }

  const target = join(dataDir, APP_DIR, "translations");
  await mkdir(join(dataDir, APP_DIR), { recursive: true });

  if (!(await pathExists(target))) {
    await rename(legacy, target);
    return true;
  }

  const entries = await readdir(legacy);
  for (const entry of entries) {
    const from = join(legacy, entry);
    const to = join(target, entry);
    if (await pathExists(to)) continue;
    await rename(from, to);
  }

  const remaining = await readdir(legacy).catch(() => []);
  if (remaining.length === 0) {
    await rm(legacy, { recursive: true, force: true });
  }

  return true;
}

function chapterFile(bollsId, chapter) {
  return `${bollsId}_${chapter}.json`;
}

const migratedDirs = new Set();

/**
 * Run the legacy-cache migration once per data directory per process.
 * Failures are ignored: a stale cache is a performance issue, never a crash.
 */
async function ensureMigrated(options = {}) {
  const dataDir = options.dataDir ?? defaultDataDir();
  if (migratedDirs.has(dataDir)) return;
  try {
    await migrateLegacyCache({ dataDir });
    migratedDirs.add(dataDir);
  } catch {
    /* leave the legacy cache in place and carry on */
  }
}

export async function saveChapter(translation, bollsId, chapter, verses, options = {}) {
  await ensureMigrated(options);
  const dir = translationDir(translation, options);
  const target = join(dir, chapterFile(bollsId, chapter));
  const tmp = `${target}.tmp`;
  await mkdir(dir, { recursive: true });
  await writeFile(tmp, JSON.stringify(verses), "utf8");
  await rename(tmp, target);
}

export async function loadChapter(translation, bollsId, chapter, options = {}) {
  await ensureMigrated(options);
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
  await ensureMigrated(options);
  const dir = translationDir(translation, options);
  const target = join(dir, BOOK_NAMES_FILE);
  const tmp = `${target}.tmp`;
  await mkdir(dir, { recursive: true });
  await writeFile(tmp, JSON.stringify(names), "utf8");
  await rename(tmp, target);
}

export async function loadBookNames(translation, options = {}) {
  await ensureMigrated(options);
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
  await ensureMigrated(options);
  try {
    await readFile(join(translationDir(translation, options), COMPLETE_MARKER), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function markComplete(translation, options = {}) {
  await ensureMigrated(options);
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
  await ensureMigrated(options);
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

  await ensureMigrated(options);
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