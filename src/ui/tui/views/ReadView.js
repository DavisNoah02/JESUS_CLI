import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { NavContext } from "../context/NavContext.js";
import { useBible } from "../hooks/useBible.js";
import { Layout } from "../components/Layout.js";
import { saveReadingPosition } from "../hooks/usePosition.js";
import { getBook } from "../../../data/books.js";

const VISIBLE_VERSES = 20;

export function ReadView({ book, chapter, verseStart = null, verseEnd = null, focusVerse = null }) {
  const { exit } = useApp();
  const ctx = useContext(BibleContext);
  const nav = useContext(NavContext);
  const bible = useBible();
  const [verses, setVerses] = useState(/** @type {import("../../../api/types.js").Verse[]} */ ([]));
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [loading, setLoading] = useState(true);

  const bookInfo = useMemo(() => {
    try {
      return getBook(book);
    } catch {
      return null;
    }
  }, [book]);
  const chapterCount = bookInfo?.chapters || 1;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    bible
      .getVerses(book, chapter, verseStart, verseEnd)
      .then((result) => {
        if (!mounted) return;
        setVerses(result);
        const focusIndex = focusVerse ? result.findIndex((verse) => verse.verse === focusVerse) : 0;
        setCursor(focusIndex > 0 ? focusIndex : 0);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [book, chapter, verseStart, verseEnd, focusVerse, ctx.translation]);

  const hint = "j/k scroll • [ ] chapter • b books • q quit";

  useInput((input, key) => {
    if (input === "q" || input === "Q" || key.escape) {
      saveReadingPosition({
        book,
        chapter,
        verse: verses[cursor]?.verse ?? verseStart ?? 1,
        translation: ctx.translation,
      });
      exit();
      return;
    }
    if (input === "b") {
      nav.goBack();
      return;
    }
    if (loading || error) return;

    if (input === "g") {
      setCursor(0);
    } else if (input === "G") {
      setCursor(Math.max(0, verses.length - 1));
    } else if (key.downArrow || input === "j") {
      setCursor((value) => Math.min(value + 1, Math.max(0, verses.length - 1)));
    } else if (key.upArrow || input === "k") {
      setCursor((value) => Math.max(value - 1, 0));
    } else if (input === "]" && chapter < chapterCount) {
      nav.openPassage(book, chapter + 1);
    } else if (input === "[" && chapter > 1) {
      nav.openPassage(book, chapter - 1);
    }
  });

  const windowStart = Math.max(
    0,
    Math.min(cursor - Math.floor(VISIBLE_VERSES / 2), Math.max(0, verses.length - VISIBLE_VERSES)),
  );
  const visible = verses.slice(windowStart, windowStart + VISIBLE_VERSES);
  const hasMoreAbove = windowStart > 0;
  const hasMoreBelow = windowStart + VISIBLE_VERSES < verses.length;

  const rows = visible.map((verse, offset) => {
    const index = windowStart + offset;
    const isActive = index === cursor;
    return React.createElement(
      Text,
      { key: verse.verse, color: isActive ? "cyan" : undefined, bold: isActive },
      `${isActive ? ">" : " "} ${String(verse.verse).padStart(3, " ")} ${verse.text}`,
    );
  });

  return React.createElement(
    Layout,
    { translation: ctx.translation, hint },
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(Text, { bold: true }, `${book} ${chapter}`),
      loading ? React.createElement(Text, { dimColor: true }, "Loading…") : null,
      error ? React.createElement(Text, { color: "red" }, error) : null,
      !loading && !error
        ? React.createElement(
            Box,
            { flexDirection: "column", marginTop: 1 },
            hasMoreAbove ? React.createElement(Text, { dimColor: true }, "  ↑ more") : null,
            ...rows,
            hasMoreBelow ? React.createElement(Text, { dimColor: true }, "  ↓ more") : null,
          )
        : null,
    ),
  );
}
