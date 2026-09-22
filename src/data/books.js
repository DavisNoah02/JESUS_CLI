import { BookNotFoundError } from "../errors.js";

export const BOOKS = [
  ["Genesis", ["gen"]],
  ["Exodus", ["exod", "exo"]],
  ["Leviticus", ["lev"]],
  ["Numbers", ["num"]],
  ["Deuteronomy", ["deut", "dt"]],
  ["Joshua", ["josh"]],
  ["Judges", ["judg"]],
  ["Ruth", ["ru"]],
  ["1 Samuel", ["1 sam", "1sam", "1 sa"]],
  ["2 Samuel", ["2 sam", "2sam", "2 sa"]],
  ["1 Kings", ["1 kgs", "1kgs", "1 ki"]],
  ["2 Kings", ["2 kgs", "2kgs", "2 ki"]],
  ["1 Chronicles", ["1 chr", "1chron", "1 ch"]],
  ["2 Chronicles", ["2 chr", "2chron", "2 ch"]],
  ["Ezra", ["ezr"]],
  ["Nehemiah", ["neh"]],
  ["Esther", ["esth", "est"]],
  ["Job", []],
  ["Psalms", ["psalm", "ps", "psa"]],
  ["Proverbs", ["prov", "pr"]],
  ["Ecclesiastes", ["eccl", "ecc"]],
  ["Song of Solomon", ["song", "song of songs", "sos"]],
  ["Isaiah", ["isa"]],
  ["Jeremiah", ["jer"]],
  ["Lamentations", ["lam"]],
  ["Ezekiel", [" ezek", "eze"]],
  ["Daniel", ["dan"]],
  ["Hosea", ["hos"]],
  ["Joel", []],
  ["Amos", []],
  ["Obadiah", ["obad"]],
  ["Jonah", ["jon"]],
  ["Micah", ["mic"]],
  ["Nahum", ["nah"]],
  ["Habakkuk", ["hab"]],
  ["Zephaniah", ["zeph"]],
  ["Haggai", ["hag"]],
  ["Zechariah", ["zech"]],
  ["Malachi", ["mal"]],
  ["Matthew", ["matt", "mt"]],
  ["Mark", ["mk", "mrk"]],
  ["Luke", ["lk"]],
  ["John", ["jn"]],
  ["Acts", []],
  ["Romans", ["rom"]],
  ["1 Corinthians", ["1 cor", "1cor", "1 co"]],
  ["2 Corinthians", ["2 cor", "2cor", "2 co"]],
  ["Galatians", ["gal"]],
  ["Ephesians", ["eph"]],
  ["Philippians", ["phil", "php"]],
  ["Colossians", ["col"]],
  ["1 Thessalonians", ["1 thes", "1thess", "1 th"]],
  ["2 Thessalonians", ["2 thes", "2thess", "2 th"]],
  ["1 Timothy", ["1 tim", "1tim", "1 ti"]],
  ["2 Timothy", ["2 tim", "2tim", "2 ti"]],
  ["Titus", ["tit"]],
  ["Philemon", ["philem", "phm"]],
  ["Hebrews", ["heb"]],
  ["James", ["jas", "jm"]],
  ["1 Peter", ["1 pet", "1pet", "1 pe"]],
  ["2 Peter", ["2 pet", "2pet", "2 pe"]],
  ["1 John", ["1 jn", "1john", "1 jo"]],
  ["2 John", ["2 jn", "2john", "2 jo"]],
  ["3 John", ["3 jn", "3john", "3 jo"]],
  ["Jude", []],
  ["Revelation", ["revelations", "rev"]]
].map(([name, aliases], index) => ({
  number: index + 1,
  name,
  aliases
}));

function normalizeKey(value) {
  return value.toLowerCase().replace(/[.']/g, "").replace(/\s+/g, " ").trim();
}

const bookLookup = new Map(
  BOOKS.flatMap((book) => [book.name, ...book.aliases].map((value) => [normalizeKey(value), book]))
);

export function normalizeBook(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new BookNotFoundError(`Book not found: ${value ?? "(none)"}`);
  }

  const book = bookLookup.get(normalizeKey(value));
  if (!book) {
    throw new BookNotFoundError(`Book not found: ${value}`);
  }

  return book.name;
}