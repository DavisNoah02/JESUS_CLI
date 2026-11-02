import React, { useCallback, useMemo, useState } from "react";
import { Box } from "ink";
import { BibleContext } from "./context/BibleContext.js";
import { NavContext } from "./context/NavContext.js";
import { ReadView } from "./views/ReadView.js";
import { BrowserView } from "./views/BrowserView.js";

/**
 * @typedef {object} AppProps
 * @property {string} [mode]
 * @property {import("../../api/types.js").Reference|null} [passage]
 * @property {import("../../api/types.js").TuiContextInput} [context]
 */

/**
 * @param {AppProps} props
 */
export function App({ mode = "browser", passage = null, context = {} }) {
  const ctx = {
    translation: context.translation || "KJV",
    theme: context.theme || "Slate",
    options: context.options || {},
    onWarn: context.onWarn || (() => {}),
    state: context.state || null,
    statePath: context.statePath || null,
  };

  const [route, setRoute] = useState(() =>
    mode === "passage" && passage
      ? {
          view: "passage",
          book: passage.book,
          chapter: passage.chapter,
          verseStart: passage.verseStart ?? null,
          verseEnd: passage.verseEnd ?? null,
          focusVerse: null,
        }
      : {
          view: "browser",
          book: null,
          chapter: 1,
          verseStart: null,
          verseEnd: null,
          focusVerse: null,
        },
  );

  const openPassage = useCallback(
    (book, chapter, verseStart = null, verseEnd = null, focusVerse = null) => {
      setRoute({ view: "passage", book, chapter, verseStart, verseEnd, focusVerse });
    },
    [],
  );

  const goBack = useCallback(() => {
    setRoute({
      view: "browser",
      book: null,
      chapter: 1,
      verseStart: null,
      verseEnd: null,
      focusVerse: null,
    });
  }, []);

  const nav = useMemo(
    () => ({
      view: route.view,
      book: route.book,
      chapter: route.chapter,
      verseStart: route.verseStart,
      verseEnd: route.verseEnd,
      focusVerse: route.focusVerse,
      openPassage,
      goBack,
    }),
    [route, openPassage, goBack],
  );

  const screen =
    route.view === "passage"
      ? React.createElement(ReadView, {
          book: route.book,
          chapter: route.chapter,
          verseStart: route.verseStart,
          verseEnd: route.verseEnd,
          focusVerse: route.focusVerse,
        })
      : React.createElement(BrowserView);

  return React.createElement(
    BibleContext.Provider,
    { value: ctx },
    React.createElement(
      NavContext.Provider,
      { value: nav },
      React.createElement(Box, { flexDirection: "column", height: "100%" }, screen),
    ),
  );
}
