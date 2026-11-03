import React, { useContext, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { Layout } from "../components/Layout.js";
import { THEME_NAMES } from "../../../theme.js";
import { listTranslations } from "../../../api/translations.js";
import { save as saveState } from "../../../store/state.js";
import { colorsFor } from "../utils/theme.js";

const TRANSLATION_CODES = listTranslations().map((entry) => entry.code);

export function ConfigView() {
  const { exit } = useApp();
  const ctx = useContext(BibleContext);
  const colors = colorsFor(ctx.theme);
  const [translation, setTranslationState] = useState(ctx.state?.translation || ctx.translation);
  const [theme, setThemeState] = useState(ctx.state?.theme || ctx.theme);
  const [row, setRow] = useState(0);
  const [status, setStatus] = useState("");

  useInput((input, key) => {
    if (input === "q" || input === "Q" || key.escape) {
      exit();
      return;
    }

    if (key.downArrow || input === "j") {
      setRow((value) => Math.min(value + 1, 1));
    } else if (key.upArrow || input === "k") {
      setRow((value) => Math.max(value - 1, 0));
    } else if (key.rightArrow || input === "l") {
      if (row === 0) {
        const index = Math.max(0, TRANSLATION_CODES.indexOf(translation));
        const next = TRANSLATION_CODES[(index + 1) % TRANSLATION_CODES.length];
        setTranslationState(next);
        ctx.setTranslation(next);
      } else {
        const index = Math.max(0, THEME_NAMES.indexOf(theme));
        const next = THEME_NAMES[(index + 1) % THEME_NAMES.length];
        setThemeState(next);
        ctx.setTheme(next);
      }
      setStatus("");
    } else if (key.leftArrow || input === "h") {
      if (row === 0) {
        const index = Math.max(0, TRANSLATION_CODES.indexOf(translation));
        const next =
          TRANSLATION_CODES[(index - 1 + TRANSLATION_CODES.length) % TRANSLATION_CODES.length];
        setTranslationState(next);
        ctx.setTranslation(next);
      } else {
        const index = Math.max(0, THEME_NAMES.indexOf(theme));
        const next = THEME_NAMES[(index - 1 + THEME_NAMES.length) % THEME_NAMES.length];
        setThemeState(next);
        ctx.setTheme(next);
      }
      setStatus("");
    } else if (input === "s") {
      void saveState({ ...ctx.state, translation, theme });
      setStatus(`Saved to ${ctx.statePath}`);
    }
  });

  const rows = [
    { label: "Translation", value: translation, active: row === 0 },
    { label: "Theme", value: theme, active: row === 1 },
  ].map((entry) =>
    React.createElement(
      Text,
      {
        key: entry.label,
        color: entry.active ? colors.accent : undefined,
        bold: entry.active,
      },
      `${entry.active ? ">" : " "} ${entry.label.padEnd(12)} ${entry.value}`,
    ),
  );

  return React.createElement(
    Layout,
    {
      translation: ctx.translation,
      theme: ctx.theme,
      hint: "j/k row • ←/→ change • s save • q quit",
    },
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(Text, { bold: true, color: colors.title }, "Configuration"),
      React.createElement(Box, { flexDirection: "column", marginTop: 1 }, ...rows),
      React.createElement(
        Text,
        { dimColor: true },
        `\nData directory: ${ctx.statePath || "(unknown)"}`,
      ),
      status ? React.createElement(Text, { color: colors.accent }, status) : null,
    ),
  );
}
