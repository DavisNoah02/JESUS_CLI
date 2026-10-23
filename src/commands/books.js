import { BOOKS } from "../data/books.js";
import { printResult } from "../logger.js";
import { printJson } from "./output.js";

export async function booksCommand(context) {
  const books = BOOKS.map(({ number, name, aliases, chapters }) => ({
    number,
    name,
    aliases,
    chapters,
  }));

  if (context.flags.json) {
    printJson("books", { books });
    return;
  }

  for (const book of books) {
    const aliases = book.aliases.length ? `; aliases: ${book.aliases.join(", ")}` : "";
    printResult(`${book.number}. ${book.name} (${book.chapters} chapters${aliases})`);
  }
}
