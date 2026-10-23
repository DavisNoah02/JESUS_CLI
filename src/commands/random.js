import { getRandomVerse } from "../api/resolver.js";
import { printJson, printVerse } from "./output.js";

export async function randomCommand(context) {
  const verse = await getRandomVerse(context.translation, context.options);
  if (context.flags.json) {
    printJson("random", { translation: context.translation, verses: [verse] });
    return;
  }
  printVerse(verse, context);
}
