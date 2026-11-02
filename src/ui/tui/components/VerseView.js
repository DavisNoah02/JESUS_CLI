import React from "react";
import { Box, Text } from "ink";

export function VerseView({ verses = [], reference = "" }) {
  if (!verses || verses.length === 0) {
    return React.createElement(
      Box,
      { paddingX: 1, flexDirection: "column" },
      React.createElement(Text, null, "No verses to display."),
    );
  }

  const children = [];
  if (reference) {
    children.push(React.createElement(Text, { key: "ref", bold: true }, reference));
  }
  verses.forEach((v, idx) => {
    const text = `${v.verse ? v.verse + " " : ""}${v.text}`;
    children.push(
      React.createElement(
        Box,
        { key: idx, marginTop: idx === 0 && reference ? 1 : 0 },
        React.createElement(Text, null, text),
      ),
    );
  });

  return React.createElement(Box, { paddingX: 1, flexDirection: "column" }, ...children);
}
