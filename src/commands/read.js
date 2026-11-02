import { getVerses } from "../api/resolver.js";
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

  // If interactive TTY and not JSON, launch TUI in passage view (must stay open until q/Esc)
  const forceTui = process.env.JESUS_USE_TUI === "1" || context.flags.tui === true;
  const disableTui =
    process.env.JESUS_NO_TUI === "1" ||
    process.env.NODE_TEST_CONTEXT ||
    process.env.NODE_ENV === "test";
  const isTty = process.stdout.isTTY && process.stdin.isTTY;
  if (!disableTui && forceTui && isTty && !context.flags.json) {
    try {
      const { startTui } = await import("../ui/index.js");
      startTui({
        mode: "passage",
        passage: {
          book: reference.book,
          chapter: reference.chapter,
          verseStart: reference.verseStart,
          verseEnd: reference.verseEnd,
        },
        context,
      });
      return;
    } catch {
      // Fall back to plain text if the TUI cannot start
    }
  }

  const verses = await getVerses(
    reference.book,
    reference.chapter,
    reference.verseStart,
    reference.verseEnd,
    context.translation,
    context.options,
  );

  const results = verses.map((verse) => ({
    book: reference.book,
    chapter: reference.chapter,
    ...verse,
  }));
  if (context.flags.json) {
    printJson("read", {
      reference: {
        book: reference.book,
        chapter: reference.chapter,
        verseStart: reference.verseStart,
        verseEnd: reference.verseEnd,
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
