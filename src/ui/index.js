import React from "react";
import { render } from "ink";
import { App } from "./tui/App.js";

/**
 * @typedef {object} StartTuiOptions
 * @property {string} [mode]
 * @property {import("../api/types.js").Reference|null} [passage]
 * @property {import("../api/types.js").TuiContextInput} [context]
 */

/**
 * @param {StartTuiOptions} [options]
 */
export function startTui({ mode = "browser", passage = null, context = {} } = {}) {
  const app = render(React.createElement(App, { mode, passage, context }));
  return app;
}
