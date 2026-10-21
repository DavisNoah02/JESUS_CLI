import { getRandomVerse } from "../api/resolver.js";
import { printVerse } from "./output.js";

export async function randomCommand(context) {
  const verse = await getRandomVerse(context.translation, context.options);
  printVerse(verse, context);
}
