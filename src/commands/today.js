import { getVerseOfTheDay } from "../api/resolver.js";
import { printVerse } from "./output.js";

export async function todayCommand(context) {
  const verse = await getVerseOfTheDay(context.translation, context.options);
  printVerse(verse, context);
}
