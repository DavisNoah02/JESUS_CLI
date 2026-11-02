import React from "react";
import { Box } from "ink";
import { BibleContext } from "./context/BibleContext.js";
import { PassageView } from "./views/PassageView.js";
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

  return React.createElement(
    BibleContext.Provider,
    { value: ctx },
    React.createElement(
      Box,
      { flexDirection: "column", height: "100%" },
      mode === "passage" && passage
        ? React.createElement(PassageView, {
            initialBook: passage.book,
            initialChapter: passage.chapter,
            initialVerseStart: passage.verseStart,
            initialVerseEnd: passage.verseEnd,
          })
        : React.createElement(BrowserView, null),
    ),
  );
}
