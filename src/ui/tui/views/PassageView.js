import React, { useContext, useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { useBible } from "../hooks/useBible.js";
import { VerseView } from "../components/VerseView.js";
import { Layout } from "../components/Layout.js";
import { isExitKey } from "../utils/keybindings.js";
import { saveReadingPosition } from "../hooks/usePosition.js";

export function PassageView({
  initialBook,
  initialChapter,
  initialVerseStart = null,
  initialVerseEnd = null,
}) {
  const { exit } = useApp();
  const ctx = useContext(BibleContext);
  const bible = useBible();
  const [verses, setVerses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const lockExit = true;
  const hint = "Press q or Esc to exit";

  useInput((input, key) => {
    if (lockExit && isExitKey(input, key)) {
      saveReadingPosition({
        book: initialBook,
        chapter: initialChapter,
        verseStart: initialVerseStart,
        verseEnd: initialVerseEnd,
        translation: ctx.translation,
      });
      exit();
      return;
    }
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await bible.getVerses(
          initialBook,
          initialChapter,
          initialVerseStart,
          initialVerseEnd,
        );
        if (mounted) {
          setVerses(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [initialBook, initialChapter, initialVerseStart, initialVerseEnd]);

  let reference = initialBook;
  if (initialChapter) reference += ` ${initialChapter}`;
  if (initialVerseStart && initialVerseEnd && initialVerseStart === initialVerseEnd) {
    reference += `:${initialVerseStart}`;
  } else if (initialVerseStart && initialVerseEnd) {
    reference += `:${initialVerseStart}-${initialVerseEnd}`;
  } else if (initialVerseStart && !initialVerseEnd) {
    reference += `:${initialVerseStart}`;
  }

  return React.createElement(
    Layout,
    { translation: ctx.translation, hint },
    React.createElement(
      Box,
      { flexDirection: "column", padding: 1 },
      loading ? React.createElement(Text, null, "Loading...") : null,
      error ? React.createElement(Text, { color: "red" }, error) : null,
      !loading && !error ? React.createElement(VerseView, { verses, reference }) : null,
    ),
  );
}
