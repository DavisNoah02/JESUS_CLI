import { ReferenceParseError } from "../errors.js";
import { BOOK_KEYS, getBook, suggestBook } from "./books.js";

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const bookPattern = BOOK_KEYS.slice()
  .sort((left, right) => right.length - left.length)
  .map((key) => key.split(" ").map(escapePattern).join("\\s*"))
  .join("|");

const segmentPattern = "(\\d+)(?:[\\s.:](\\d+))?";
const referencePattern = new RegExp(
  `^(${bookPattern})\\s*${segmentPattern}(?:\\s*-\\s*${segmentPattern})?$`,
  "i",
);

function bookCandidate(value) {
  return value
    .trim()
    .replace(/[\s.:-]*\d[\d\s.:-]*$/, "")
    .trim();
}

function invalidReference(value) {
  const candidate = bookCandidate(value);
  if (candidate) {
    try {
      getBook(candidate);
      return new ReferenceParseError(`Invalid Bible reference: ${value}`);
    } catch {
      const suggestion = suggestBook(candidate);
      if (suggestion) {
        return new ReferenceParseError(
          `Invalid Bible reference: ${value}. Did you mean ${suggestion.name}?`,
        );
      }
    }
  }

  return new ReferenceParseError(`Invalid Bible reference: ${value}`);
}

export function parseReference(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ReferenceParseError("A Bible reference is required");
  }

  const match = value.trim().match(referencePattern);
  if (!match) {
    throw invalidReference(value);
  }

  const [, bookValue, chapterValue, verseStartValue, endValue, endVerseValue] = match;
  const book = getBook(bookValue);
  const chapter = Number(chapterValue);
  const verseStart = verseStartValue ? Number(verseStartValue) : null;
  let verseEnd = verseStart;
  let chapterEnd = null;

  if (endValue !== undefined) {
    if (endVerseValue !== undefined) {
      chapterEnd = Number(endValue);
      verseEnd = Number(endVerseValue);
    } else if (verseStart !== null) {
      verseEnd = Number(endValue);
    } else {
      chapterEnd = Number(endValue);
    }
  }

  if (chapterEnd !== null && chapterEnd === chapter) {
    chapterEnd = null;
  }

  if (chapter < 1 || chapter > book.chapters) {
    throw new ReferenceParseError(
      `${book.name} has ${book.chapters} chapter${book.chapters === 1 ? "" : "s"}, but chapter ${chapter} was requested`,
    );
  }

  if (chapterEnd !== null && (chapterEnd < 1 || chapterEnd > book.chapters)) {
    throw new ReferenceParseError(
      `${book.name} has ${book.chapters} chapter${book.chapters === 1 ? "" : "s"}, but chapter ${chapterEnd} was requested`,
    );
  }

  if (chapterEnd !== null && chapterEnd < chapter) {
    throw new ReferenceParseError(`Invalid verse range: ${value}`);
  }

  if (chapterEnd === null && verseEnd !== null && verseStart !== null && verseEnd < verseStart) {
    throw new ReferenceParseError(`Invalid verse range: ${value}`);
  }

  return {
    book: book.name,
    chapter,
    verseStart,
    verseEnd,
    chapterEnd,
  };
}
