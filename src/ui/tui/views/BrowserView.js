import React, { useContext, useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { NavContext } from "../context/NavContext.js";
import { Layout } from "../components/Layout.js";
import { BOOKS } from "../../../data/books.js";
import { loadReadingPosition } from "../hooks/usePosition.js";
import { colorsFor } from "../utils/theme.js";

const BOOK_WINDOW = 6;
const CHAPTERS_PER_ROW = 10;

export function BrowserView() {
  const { exit } = useApp();
  const ctx = useContext(BibleContext);
  const nav = useContext(NavContext);
  const [pane, setPane] = useState("books");
  const [bookIndex, setBookIndex] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [resume, setResume] = useState(
    /** @type {import("../../../api/types.js").ReadingPosition|null} */ (null),
  );

  useEffect(() => {
    let mounted = true;
    loadReadingPosition()
      .then((position) => {
        if (mounted && position && position.book) setResume(position);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const selectedBook = BOOKS[bookIndex];
  const colors = colorsFor(ctx.theme);
  const hint =
    pane === "books"
      ? "↑/↓ books • Enter chapters • / search • t theme • v translation • q quit"
      : "↑/↓ ±10 • ←/→ ±1 • Enter open • h back • q quit";

  useInput((input, key) => {
    if (input === "q" || input === "Q") {
      exit();
      return;
    }

    if (pane === "chapters" && (key.escape || key.backspace || input === "h")) {
      setPane("books");
      return;
    }
    if (key.escape) {
      exit();
      return;
    }

    if (pane === "books") {
      if (key.downArrow || input === "j") {
        setBookIndex((index) => Math.min(index + 1, BOOKS.length - 1));
      } else if (key.upArrow || input === "k") {
        setBookIndex((index) => Math.max(index - 1, 0));
      } else if (input === "g") {
        setBookIndex(0);
      } else if (input === "G") {
        setBookIndex(BOOKS.length - 1);
      } else if (key.return || input === "l") {
        setChapter(1);
        setPane("chapters");
      } else if (input === "r" && resume) {
        nav.openPassage(resume.book, resume.chapter, null, null, resume.verse ?? null);
      }
      return;
    }

    const chapters = selectedBook.chapters;
    if (key.downArrow || input === "j") {
      setChapter((value) => Math.min(value + CHAPTERS_PER_ROW, chapters));
    } else if (key.upArrow || input === "k") {
      setChapter((value) => Math.max(value - CHAPTERS_PER_ROW, 1));
    } else if (key.rightArrow || input === "l") {
      setChapter((value) => Math.min(value + 1, chapters));
    } else if (key.leftArrow) {
      setChapter((value) => Math.max(value - 1, 1));
    } else if (input === "g") {
      setChapter(1);
    } else if (input === "G") {
      setChapter(chapters);
    } else if (key.return || input === " ") {
      nav.openPassage(selectedBook.name, chapter);
    }
  });

  const windowStart = Math.max(
    0,
    Math.min(bookIndex - BOOK_WINDOW, BOOKS.length - (BOOK_WINDOW * 2 + 1)),
  );
  const bookRows = BOOKS.slice(windowStart, windowStart + BOOK_WINDOW * 2 + 1).map(
    (book, offset) => {
      const index = windowStart + offset;
      const isSelected = index === bookIndex;
      const prefix = isSelected ? "> " : "  ";
      return React.createElement(
        Text,
        { key: book.name, color: isSelected ? colors.accent : undefined, bold: isSelected },
        prefix + book.name,
      );
    },
  );

  const chapterCells = Array.from({ length: selectedBook.chapters }, (_, index) => index + 1).map(
    (number) => {
      const isSelected = number === chapter;
      return React.createElement(
        Text,
        {
          key: number,
          color: isSelected ? "black" : undefined,
          backgroundColor: isSelected ? colors.highlight : undefined,
          bold: isSelected,
        },
        `${String(number).padStart(3, " ")} `,
      );
    },
  );

  return React.createElement(
    Layout,
    { translation: ctx.translation, theme: ctx.theme, hint },
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      resume
        ? React.createElement(
            Text,
            { color: colors.accent },
            `Continue: ${resume.book} ${resume.chapter} — press r to resume`,
          )
        : null,
      React.createElement(
        Box,
        { flexDirection: "row", marginTop: resume ? 1 : 0 },
        React.createElement(
          Box,
          { flexDirection: "column", width: 30, marginRight: 2 },
          React.createElement(Text, { bold: true }, "Books"),
          ...bookRows,
        ),
        React.createElement(
          Box,
          { flexDirection: "column", flexGrow: 1 },
          pane === "books"
            ? React.createElement(Text, null, "Select a book with Enter")
            : React.createElement(
                Box,
                { flexDirection: "column" },
                React.createElement(Text, { bold: true }, selectedBook.name),
                React.createElement(
                  Box,
                  {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 1,
                    width: CHAPTERS_PER_ROW * 4,
                  },
                  ...chapterCells,
                ),
                React.createElement(
                  Text,
                  { dimColor: true },
                  `Chapter ${chapter} of ${selectedBook.chapters}`,
                ),
              ),
        ),
      ),
    ),
  );
}
