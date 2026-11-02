import React from "react";
import { Box, Text } from "ink";

export function StatusBar({ translation, hint }) {
  const exitHint = hint || "Press q or Esc to exit";
  return React.createElement(
    Box,
    { borderStyle: "single", paddingX: 1, flexDirection: "row", justifyContent: "space-between" },
    React.createElement(Text, null, exitHint),
    React.createElement(Text, null, `Translation: ${translation}`),
  );
}
