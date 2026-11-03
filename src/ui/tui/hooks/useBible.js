import { useContext } from "react";
import { BibleContext } from "../context/BibleContext.js";
import * as resolver from "../../../api/resolver.js";

export function useBible() {
  const ctx = useContext(BibleContext);
  const translation = ctx.translation || "KJV";
  const options = ctx.options || {};

  return {
    translation,
    options,
    getChapter: (book, chapter) => resolver.getChapter(book, chapter, translation, options),
    getVerses: (book, chapter, verseStart = null, verseEnd = null) =>
      resolver.getVerses(book, chapter, verseStart, verseEnd, translation, options),
    getVerseOfTheDay: () => resolver.getVerseOfTheDay(translation, options),
    getRandomVerse: () => resolver.getRandomVerse(translation, options),
    search: (query) => resolver.search(query, translation, options),
  };
}
