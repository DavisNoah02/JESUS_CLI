import React from "react";
import { Box, Text } from "ink";
import { colorsFor } from "../utils/theme.js";

export function StatusBar({ translation, theme, hint }) {
  const colors = colorsFor(theme);
  const exitHint = hint || "Press q or Esc to exit";
  return React.createElement(
    Box,
    { borderStyle: "single", paddingX: 1, flexDirection: "row", justifyContent: "space-between" },
    React.createElement(Text, { color: colors.muted }, exitHint),
    React.createElement(Text, { color: colors.accent }, `${translation} · ${theme}`),
  );
}
