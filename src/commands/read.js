import { getVerses } from "../api/resolver.js";
import { parseReference } from "../data/reference.js";
import { UsageError } from "../errors.js";
import { printVerse } from "./output.js";

export async function readCommand(context) {
  const referenceValue = context.positionals.join(" ").trim();

  if (!referenceValue) {
    throw new UsageError(
      `Usage: jesuschrist read <reference>  (e.g. jesuschrist read "John 3:16")`,
    );
  }

  const reference = parseReference(referenceValue);
  const verses = await getVerses(
    reference.book,
    reference.chapter,
    reference.verseStart,
    reference.verseEnd,
    context.translation,
    context.options,
  );

  for (const verse of verses) {
    printVerse({ book: reference.book, chapter: reference.chapter, ...verse }, context);
  }
}
