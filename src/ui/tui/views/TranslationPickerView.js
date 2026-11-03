import React, { useContext, useState } from "react";
import { Box, Text, useInput } from "ink";
import { BibleContext } from "../context/BibleContext.js";
import { NavContext } from "../context/NavContext.js";
import { Layout } from "../components/Layout.js";
import { listTranslations } from "../../../api/translations.js";
import { colorsFor } from "../utils/theme.js";

const VISIBLE_ITEMS = 12;

export function TranslationPickerView() {
  const ctx = useContext(BibleContext);
  const nav = useContext(NavContext);
  const colors = colorsFor(ctx.theme);
  const items = listTranslations();
  const [index, setIndex] = useState(() => {
    const current = items.findIndex((item) => item.code === ctx.translation);
    return current >= 0 ? current : 0;
  });

  useInput((input, key) => {
    if (key.escape || input === "q" || input === "Q") {
      nav.closeOverlay();
      return;
    }
    if (key.downArrow || input === "j") {
      setIndex((value) => Math.min(value + 1, items.length - 1));
    } else if (key.upArrow || input === "k") {
      setIndex((value) => Math.max(value - 1, 0));
    } else if (key.return || input === " ") {
      ctx.setTranslation(items[index].code);
      nav.closeOverlay();
    }
  });

  const windowStart = Math.max(
    0,
    Math.min(index - Math.floor(VISIBLE_ITEMS / 2), Math.max(0, items.length - VISIBLE_ITEMS)),
  );
  const visible = items.slice(windowStart, windowStart + VISIBLE_ITEMS);

  const rows = visible.map((item, offset) => {
    const itemIndex = windowStart + offset;
    const isActive = itemIndex === index;
    const isCurrent = item.code === ctx.translation;
    return React.createElement(
      Text,
      {
        key: item.code,
        color: isActive ? "black" : undefined,
        backgroundColor: isActive ? colors.highlight : undefined,
        bold: isActive,
      },
      `${isActive ? ">" : " "} ${item.code.padEnd(5)} ${item.name}${isCurrent ? "  ✓" : ""}`,
    );
  });

  return React.createElement(
    Layout,
    {
      translation: ctx.translation,
      theme: ctx.theme,
      hint: "j/k select • Enter apply • Esc cancel",
    },
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1, paddingY: 1 },
      React.createElement(Text, { bold: true, color: colors.title }, "Translation"),
      React.createElement(Box, { flexDirection: "column", marginTop: 1 }, ...rows),
    ),
  );
}
