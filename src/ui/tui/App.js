import React, { useCallback, useMemo, useState } from "react";
import { Box, useInput } from "ink";
import { BibleContext } from "./context/BibleContext.js";
import { NavContext } from "./context/NavContext.js";
import { cycleThemeName } from "./utils/theme.js";
import { ReadView } from "./views/ReadView.js";
import { BrowserView } from "./views/BrowserView.js";
import { SearchView } from "./views/SearchView.js";
import { TranslationPickerView } from "./views/TranslationPickerView.js";
import { VerseCardView } from "./views/VerseCardView.js";
import { ConfigView } from "./views/ConfigView.js";

/**
 * @typedef {object} AppProps
 * @property {string} [mode]
 * @property {import("../../api/types.js").Reference|null} [passage]
 * @property {string} [initialQuery]
 * @property {import("../../api/types.js").TuiContextInput} [context]
 */

const BLANK_ROUTE = Object.freeze({
  book: null,
  chapter: 1,
  verseStart: null,
  verseEnd: null,
  focusVerse: null,
});

/**
 * @param {AppProps} props
 */
export function App({ mode = "browser", passage = null, initialQuery = "", context = {} }) {
  const [translation, setTranslation] = useState(context.translation || "KJV");
  const [theme, setTheme] = useState(context.theme || "Slate");
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
      : { view: mode === "browser" ? "browser" : mode, ...BLANK_ROUTE },
  );
  const [returnRoute, setReturnRoute] = useState(/** @type {object|null} */ (null));

  const cycleTheme = useCallback(() => {
    setTheme((current) => cycleThemeName(current));
  }, []);

  const openPassage = useCallback(
    (book, chapter, verseStart = null, verseEnd = null, focusVerse = null) => {
      setRoute({ view: "passage", book, chapter, verseStart, verseEnd, focusVerse });
    },
    [],
  );

  const goBack = useCallback(() => {
    setRoute({ view: "browser", ...BLANK_ROUTE });
  }, []);

  const openSearch = useCallback(() => {
    setReturnRoute(route);
    setRoute({ view: "search", ...BLANK_ROUTE });
  }, [route]);

  const openTranslations = useCallback(() => {
    setReturnRoute(route);
    setRoute({ view: "translations", ...BLANK_ROUTE });
  }, [route]);

  const closeOverlay = useCallback(() => {
    if (returnRoute) {
      setRoute(returnRoute);
      setReturnRoute(null);
      return;
    }
    goBack();
  }, [returnRoute, goBack]);

  useInput((input) => {
    if (route.view !== "browser" && route.view !== "passage") return;
    if (input === "t") {
      cycleTheme();
    } else if (input === "v") {
      openTranslations();
    } else if (input === "/") {
      openSearch();
    }
  });

  const bibleValue = useMemo(
    () => ({
      translation,
      theme,
      options: context.options || {},
      onWarn: context.onWarn || (() => {}),
      state: context.state || null,
      statePath: context.statePath || null,
      setTranslation,
      setTheme,
      cycleTheme,
    }),
    [translation, theme, context, cycleTheme],
  );

  const nav = useMemo(
    () => ({
      view: route.view,
      book: route.book ?? null,
      chapter: route.chapter ?? 1,
      verseStart: route.verseStart ?? null,
      verseEnd: route.verseEnd ?? null,
      focusVerse: route.focusVerse ?? null,
      openPassage,
      openSearch,
      openTranslations,
      closeOverlay,
      goBack,
    }),
    [route, openPassage, openSearch, openTranslations, closeOverlay, goBack],
  );

  let screen;
  if (route.view === "passage") {
    screen = React.createElement(ReadView, {
      book: route.book,
      chapter: route.chapter,
      verseStart: route.verseStart,
      verseEnd: route.verseEnd,
      focusVerse: route.focusVerse,
    });
  } else if (route.view === "search") {
    screen = React.createElement(SearchView, { initialQuery });
  } else if (route.view === "random" || route.view === "today") {
    screen = React.createElement(VerseCardView, { kind: route.view });
  } else if (route.view === "config") {
    screen = React.createElement(ConfigView);
  } else if (route.view === "translations") {
    screen = React.createElement(TranslationPickerView);
  } else {
    screen = React.createElement(BrowserView);
  }

  return React.createElement(
    BibleContext.Provider,
    { value: bibleValue },
    React.createElement(
      NavContext.Provider,
      { value: nav },
      React.createElement(Box, { flexDirection: "column", height: "100%" }, screen),
    ),
  );
}
