import React, { useContext, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { Layout } from "../components/Layout.js";
import { isExitKey } from "../utils/keybindings.js";
import { BOOKS } from "../../../data/books.js";
import { saveReadingPosition } from "../hooks/usePosition.js";

export function BrowserView() {
  const { exit } = useApp();
  const ctx = useContext(BibleContext);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookIndex, setBookIndex] = useState(0);

  const hint = "↑/↓ navigate • Enter select • q/Esc exit";

  useInput((input, key) => {
    if (isExitKey(input, key)) {
      saveReadingPosition({
        book: selectedBook?.name || BOOKS[bookIndex]?.name,
        chapter: selectedChapter,
        translation: ctx.translation,
      });
      exit();
      return;
    }

    if (!selectedBook) {
      if (key.downArrow || input === "j") {
        setBookIndex((i) => Math.min(i + 1, BOOKS.length - 1));
      } else if (key.upArrow || input === "k") {
        setBookIndex((i) => Math.max(i - 1, 0));
      } else if (key.return || input === "l" || input === " ") {
        const book = BOOKS[bookIndex];
        setSelectedBook(book);
        setSelectedChapter(1);
      }
    } else {
      const chapters = selectedBook.chapters || 1;
      if (key.downArrow || input === "j") {
        setSelectedChapter((chapter) => Math.min(chapter + 1, chapters));
      } else if (key.upArrow || input === "k") {
        setSelectedChapter((chapter) => Math.max(chapter - 1, 1));
      } else if (key.leftArrow || input === "h" || key.backspace) {
        setSelectedBook(null);
      }
    }
  });

  const bookSlice = BOOKS.slice(Math.max(0, bookIndex - 5), bookIndex + 6).map((book, idx) => {
    const actualIdx = Math.max(0, bookIndex - 5) + idx;
    const isSelected = actualIdx === bookIndex && !selectedBook;
    return React.createElement(
      Text,
      { key: book.name, color: isSelected ? "cyan" : undefined },
      (isSelected ? "> " : "  ") + book.name,
    );
  });

  return React.createElement(
    Layout,
    { translation: ctx.translation, hint },
    React.createElement(
      Box,
      { flexDirection: "row", padding: 1 },
      React.createElement(
        Box,
        { flexDirection: "column", marginRight: 2, width: 30 },
        React.createElement(Text, { bold: true }, "Books"),
        ...bookSlice,
      ),
      selectedBook
        ? React.createElement(
            Box,
            { flexDirection: "column" },
            React.createElement(Text, { bold: true }, selectedBook.name),
            React.createElement(Text, null, `Chapters: 1-${selectedBook.chapters}`),
            React.createElement(
              Text,
              null,
              `Selected: ${selectedChapter} (use ↑/↓, h/← to go back)`,
            ),
          )
        : React.createElement(
            Box,
            { flexDirection: "column" },
            React.createElement(Text, null, "Select a book with Enter"),
          ),
    ),
  );
}
