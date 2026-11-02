import { createContext } from "react";

export const NavContext = createContext({
  book: null,
  chapter: 1,
  verseStart: null,
  verseEnd: null,
  view: "browser", // browser | passage
  setBook: () => {},
  setChapter: () => {},
  setPassage: () => {},
  goBack: () => {},
});
