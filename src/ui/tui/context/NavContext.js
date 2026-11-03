import { createContext } from "react";

export const NavContext = createContext({
  view: "browser", // browser | passage | search | translations
  book: null,
  chapter: 1,
  verseStart: null,
  verseEnd: null,
  focusVerse: null,
  openPassage: () => {},
  openSearch: () => {},
  openTranslations: () => {},
  closeOverlay: () => {},
  goBack: () => {},
});
