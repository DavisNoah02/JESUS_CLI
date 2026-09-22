import { ReferenceParseError } from "../errors.js";
import { BOOKS, normalizeBook } from "./books.js";

const bookPattern = BOOKS.map((book) => [book.name, ...book.aliases])
  .flat()
  .sort((left, right) => right.length - left.length)
  .map((book) => book.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const referencePattern = new RegExp(`^(${bookPattern})\\s*(\\d+)(?::(\\d+)(?:-(\\d+))?)?$`, "i");

export function parseReference(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ReferenceParseError("A Bible reference is required");
  }

  const match = value.trim().match(referencePattern);
  if (!match) {
    throw new ReferenceParseError(`Invalid Bible reference: ${value}`);
  }

  const [, bookValue, chapterValue, verseStartValue, verseEndValue] = match;
  const verseStart = verseStartValue ? Number(verseStartValue) : null;
  const verseEnd = verseEndValue ? Number(verseEndValue) : verseStart;

  if (verseEnd !== null && verseEnd < verseStart) {
    throw new ReferenceParseError(`Invalid verse range: ${value}`);
  }

  return {
    book: normalizeBook(bookValue),
    chapter: Number(chapterValue),
    verseStart,
    verseEnd
  };
}