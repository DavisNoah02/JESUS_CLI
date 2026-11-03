import { getVerses } from "../api/resolver.js";
import { getBook } from "../data/books.js";
import { parseReference } from "../data/reference.js";
import { UsageError } from "../errors.js";
import { printJson, printVerse } from "./output.js";

export async function readCommand(context) {
  const referenceValue = context.positionals.join(" ").trim();

  if (!referenceValue) {
    throw new UsageError(
      `Usage: jesuschrist read <reference>  (e.g. jesuschrist read "John 3:16")`,
    );
  }

  const reference = parseReference(referenceValue);
  let { chapter, verseStart, verseEnd, chapterEnd } = reference;

  if (context.flags.next && context.flags.previous) {
    throw new UsageError("Use either --next or --previous, not both");
  }

  if (context.flags.next || context.flags.previous) {
    const book = getBook(reference.book);
    const target = chapter + (context.flags.next ? 1 : -1);
    if (target < 1 || target > book.chapters) {
      throw new UsageError(
        context.flags.next
          ? `${book.name} has no chapter after ${chapter}`
          : `${book.name} has no chapter before ${chapter}`,
      );
    }
    chapter = target;
    verseStart = null;
    verseEnd = null;
    chapterEnd = null;
  }

  const verses = await getVerses(
    reference.book,
    chapter,
    verseStart,
    verseEnd,
    context.translation,
    context.options,
    chapterEnd,
  );

  const results = verses.map((verse) => ({
    book: reference.book,
    chapter,
    ...verse,
  }));
  if (context.flags.json) {
    printJson("read", {
      reference: {
        book: reference.book,
        chapter,
        verseStart,
        verseEnd,
        chapterEnd,
      },
      translation: context.translation,
      verses: results,
    });
    return;
  }

  for (const verse of results) {
    printVerse(verse, context);
  }
}
