import { createContext } from "react";

export const BibleContext = createContext({
  translation: "KJV",
  theme: "Slate",
  options: {},
  onWarn: () => {},
  state: null,
  statePath: null,
  setTranslation: () => {},
  setTheme: () => {},
  cycleTheme: () => {},
});
