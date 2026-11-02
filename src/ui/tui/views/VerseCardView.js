import React, { useContext, useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { NavContext } from "../context/NavContext.js";
import { useBible } from "../hooks/useBible.js";
import { Layout } from "../components/Layout.js";
import { colorsFor } from "../utils/theme.js";

export function VerseCardView({ kind = "random" }) {
  const { exit } = useApp();
  const ctx = useContext(BibleContext);
  const nav = useContext(NavContext);
  const bible = useBible();
  const colors = colorsFor(ctx.theme);
  const [verse, setVerse] = useState(
    /** @type {import("../../../api/types.js").RandomVerse|null} */ (null),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const load = kind === "today" ? bible.getVerseOfTheDay() : bible.getRandomVerse();
    load
      .then((result) => {
        if (mounted) setVerse(result);
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
  }, [kind, ctx.translation, reloadKey]);

  const title = kind === "today" ? "Verse of the day" : "Random verse";
  const hint =
    kind === "random"
      ? "Enter read • n another • t theme • v translation • q quit"
      : "Enter read • t theme • v translation • q quit";

  useInput((input, key) => {
    if (input === "q" || input === "Q" || key.escape) {
      exit();
      return;
    }
    if (input === "n" && kind === "random") {
      setReloadKey((value) => value + 1);
      return;
    }
    if (input === "t") {
      ctx.cycleTheme();
      return;
    }
    if (input === "v") {
      nav.openTranslations();
      return;
    }
    if (key.return && verse) {
      nav.openPassage(verse.book, verse.chapter, null, null, verse.verse);
    }
  });

  return React.createElement(
    Layout,
    { translation: ctx.translation, theme: ctx.theme, hint },
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(Text, { bold: true, color: colors.title }, title),
      loading ? React.createElement(Text, { dimColor: true }, "Loading…") : null,
      error ? React.createElement(Text, { color: colors.error }, error) : null,
      !loading && !error && verse
        ? React.createElement(
            Box,
            { flexDirection: "column", marginTop: 1 },
            React.createElement(
              Text,
              { bold: true, color: colors.accent },
              `${verse.book} ${verse.chapter}:${verse.verse}`,
            ),
            React.createElement(Text, null, verse.text),
          )
        : null,
    ),
  );
}
