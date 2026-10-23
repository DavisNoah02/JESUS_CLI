import { getVerseOfTheDay } from "../api/resolver.js";
import { printJson, printVerse } from "./output.js";

export async function todayCommand(context) {
  const verse = await getVerseOfTheDay(context.translation, context.options);
  if (context.flags.json) {
    printJson("today", { translation: context.translation, verses: [verse] });
    return;
  }
  printVerse(verse, context);
}
