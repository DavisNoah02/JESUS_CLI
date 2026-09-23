import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BookNotFoundError, VerseNotFoundError } from "../errors.js";
import { normalizeBook } from "./books.js";

const dataPath = fileURLToPath(new URL("../../data/kjv.json", import.meta.url));
let kjvData;

export async function loadKjv() {
  if (!kjvData) {
    const contents = await readFile(dataPath, "utf8");
    kjvData = JSON.parse(contents);
  }

  return kjvData;
}

export async function getChapter(bookValue, chapterNumber) {
  const bookName = normalizeBook(bookValue);
  const data = await loadKjv();
  const book = data.find((entry) => entry.book === bookName);
  const chapter = book?.chapters.find((entry) => Number(entry.chapter) === Number(chapterNumber));

  if (!chapter) {
    throw new VerseNotFoundError(`Chapter not found: ${bookName} ${chapterNumber}`);
  }

  return chapter.verses.map((verse) => ({
    verse: Number(verse.verse),
    text: verse.text
  }));
}

export async function getVerses(referenceOrBook, chapterNumber, verseStart, verseEnd) {
  const reference =
    typeof referenceOrBook === "object" && referenceOrBook !== null
      ? referenceOrBook
      : {
          book: referenceOrBook,
          chapter: chapterNumber,
          verseStart,
          verseEnd
        };

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