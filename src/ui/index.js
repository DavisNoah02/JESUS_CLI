import React from "react";
import { render } from "ink";
import { App } from "./tui/App.js";
import { parseReference } from "../data/reference.js";

/**
 * @typedef {object} StartTuiOptions
 * @property {string} [mode]
 * @property {import("../api/types.js").Reference|null} [passage]
 * @property {string} [initialQuery]
 * @property {import("../api/types.js").TuiContextInput} [context]
 */

/**
 * @param {StartTuiOptions} [options]
 */
export function startTui({
  mode = "browser",
  passage = null,
  initialQuery = "",
  context = {},
} = {}) {
  const app = render(React.createElement(App, { mode, passage, initialQuery, context }));
  return app;
}

/**
 * Mount the TUI for a CLI command, reusing the same resolver and views.
 *
 * @param {object} options
 * @param {string} options.command
 * @param {import("../api/types.js").CommandContext} options.context
 * @returns {boolean} false when the command cannot be represented (the caller
 *   should fall through to the plain-text path, e.g. an invalid reference)
 */
export function mountCommandTui({ command, context }) {
  if (command === "start" || command === "books") {
    startTui({ mode: "browser", context });
    return true;
  }
  if (command === "read") {
    const value = context.positionals.join(" ").trim();
    try {
      const reference = parseReference(value);
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
      return true;
    } catch {
      return false;
    }
  }
  if (command === "search") {
    startTui({ mode: "search", initialQuery: context.positionals.join(" ").trim(), context });
    return true;
  }
  if (command === "random" || command === "today" || command === "config") {
    startTui({ mode: command, context });
    return true;
  }
  return false;
}
