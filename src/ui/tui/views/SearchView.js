import React, { useContext, useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { NavContext } from "../context/NavContext.js";
import { useBible } from "../hooks/useBible.js";
import { Layout } from "../components/Layout.js";
import { isPrintable } from "../utils/keybindings.js";
import { colorsFor } from "../utils/theme.js";

const VISIBLE_RESULTS = 12;

export function SearchView({ initialQuery = "" }) {
  const ctx = useContext(BibleContext);
  const nav = useContext(NavContext);
  const bible = useBible();
  const colors = colorsFor(ctx.theme);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(
    /** @type {import("../../../api/types.js").SearchResult[]} */ ([]),
  );
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(initialQuery.trim().length === 0);

  async function runSearch(value = query) {
    const term = value.trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    try {
      const found = await bible.search(term);
      setResults(found);
      setCursor(0);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery.trim()) void runSearch(initialQuery);
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      nav.closeOverlay();
      return;
    }
    if (input === "q" && !editing) {
      nav.closeOverlay();
      return;
    }

    if (editing) {
      if (key.return) {
        void runSearch();
        return;
      }
      if (key.backspace || key.delete) {
        setQuery((value) => value.slice(0, -1));
        return;
      }
      if (isPrintable(input, key)) {
        setQuery((value) => value + input);
      }
      return;
    }

    if (input === "i" || input === "/") {
      setEditing(true);
      return;
    }
    if (key.return && results[cursor]) {
      nav.openPassage(
        results[cursor].book,
        results[cursor].chapter,
        null,
        null,
        results[cursor].verse,
      );
      return;
    }
    if (key.downArrow || input === "j") {
      setCursor((value) => Math.min(value + 1, Math.max(0, results.length - 1)));
    } else if (key.upArrow || input === "k") {
      setCursor((value) => Math.max(value - 1, 0));
    }
  });

  const windowStart = Math.max(
    0,
    Math.min(
      cursor - Math.floor(VISIBLE_RESULTS / 2),
      Math.max(0, results.length - VISIBLE_RESULTS),
    ),
  );
  const visible = results.slice(windowStart, windowStart + VISIBLE_RESULTS);

  const rows = visible.map((result, offset) => {
    const index = windowStart + offset;
    const isActive = index === cursor;
    const summary = result.text.length > 90 ? `${result.text.slice(0, 90)}…` : result.text;
    return React.createElement(
      Text,
      {
        key: `${result.book}-${result.chapter}-${result.verse}`,
        color: isActive ? colors.accent : undefined,
      },
      `${isActive ? ">" : " "} ${result.book} ${result.chapter}:${result.verse}  ${summary}`,
    );
  });

  const hint = editing
    ? "Type a query • Enter search • Esc cancel"
    : "j/k results • Enter open • i edit • Esc back";

  return React.createElement(
    Layout,
    { translation: ctx.translation, theme: ctx.theme, hint },
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(Text, { bold: true, color: colors.title }, "Search"),
      React.createElement(Text, null, `${editing ? "› " : "  "}${query}${editing ? "▌" : ""}`),
      loading ? React.createElement(Text, { dimColor: true }, "Searching…") : null,
      error ? React.createElement(Text, { color: colors.error }, error) : null,
      !editing && !loading && !error && results.length === 0
        ? React.createElement(Text, { dimColor: true }, "No matches.")
        : null,
      results.length > 0
        ? React.createElement(
            Box,
            { flexDirection: "column", marginTop: 1 },
            React.createElement(Text, { color: colors.muted }, `${results.length} match(es)`),
            ...rows,
          )
        : null,
    ),
  );
}
