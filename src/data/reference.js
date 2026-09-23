import { ReferenceParseError } from "../errors.js";
import { BOOKS, getBook } from "./books.js";

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
  const book = getBook(bookValue);
  const chapter = Number(chapterValue);
  const verseStart = verseStartValue ? Number(verseStartValue) : null;
  const verseEnd = verseEndValue ? Number(verseEndValue) : verseStart;

  if (chapter < 1 || chapter > book.chapters) {
    throw new ReferenceParseError(
      `${book.name} has ${book.chapters} chapter${book.chapters === 1 ? "" : "s"}, but chapter ${chapter} was requested`
    );
  }

  if (verseEnd !== null && verseEnd < verseStart) {
    throw new ReferenceParseError(`Invalid verse range: ${value}`);
  }

  return {
    book: book.name,
    chapter,
    verseStart,
    verseEnd
  };
}
