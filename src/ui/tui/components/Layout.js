import React from "react";
import { Box } from "ink";
import { StatusBar } from "./StatusBar.js";

export function Layout({ children, translation, theme, hint }) {
  return React.createElement(
    Box,
    { flexDirection: "column", height: "100%" },
    React.createElement(Box, { flexGrow: 1, flexDirection: "column" }, children),
    React.createElement(StatusBar, { translation, theme, hint }),
  );
}
