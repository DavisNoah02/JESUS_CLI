import { BookNotFoundError } from "../errors.js";

/**
 * @typedef {object} Book
 * @property {number} number canonical position, 1-based
 * @property {number} bollsId identifier used by the Bolls API
 * @property {string} name canonical English name
 * @property {string[]} aliases alternative names and abbreviations
 * @property {number} chapters number of chapters in the book
 */

/** @type {[string, string[], number][]} */
const BOOK_SOURCE = [
  ["Genesis", ["gen"], 50],
  ["Exodus", ["exod", "exo"], 40],
  ["Leviticus", ["lev"], 27],
  ["Numbers", ["num"], 36],
  ["Deuteronomy", ["deut", "dt"], 34],
  ["Joshua", ["josh"], 24],
  ["Judges", ["judg"], 21],
  ["Ruth", ["ru"], 4],
  ["1 Samuel", ["1 sam", "1sam", "1 sa", "1sa"], 31],
  ["2 Samuel", ["2 sam", "2sam", "2 sa", "2sa"], 24],
  ["1 Kings", ["1 kgs", "1kgs", "1 ki"], 22],
  ["2 Kings", ["2 kgs", "2kgs", "2 ki"], 25],
  ["1 Chronicles", ["1 chr", "1chron", "1 ch", "1ch"], 29],
  ["2 Chronicles", ["2 chr", "2chron", "2 ch", "2ch"], 36],
  ["Ezra", ["ezr"], 10],
  ["Nehemiah", ["neh"], 13],
  ["Esther", ["esth", "est"], 10],
  ["Job", [], 42],
  ["Psalms", ["psalm", "ps", "psa"], 150],
  ["Proverbs", ["prov", "pr"], 31],
  ["Ecclesiastes", ["eccl", "ecc"], 12],
  ["Song of Solomon", ["song", "song of songs", "sos"], 8],
  ["Isaiah", ["isa"], 66],
  ["Jeremiah", ["jer"], 52],
  ["Lamentations", ["lam"], 5],
  ["Ezekiel", ["ezek", "eze"], 48],
  ["Daniel", ["dan"], 12],
  ["Hosea", ["hos"], 14],
  ["Joel", [], 3],
  ["Amos", [], 9],
  ["Obadiah", ["obad"], 1],
  ["Jonah", ["jon"], 4],
  ["Micah", ["mic"], 7],
  ["Nahum", ["nah"], 3],
  ["Habakkuk", ["hab"], 3],
  ["Zephaniah", ["zeph"], 3],
  ["Haggai", ["hag"], 2],
  ["Zechariah", ["zech"], 14],
  ["Malachi", ["mal"], 4],
  ["Matthew", ["matt", "mt"], 28],
  ["Mark", ["mk", "mrk"], 16],
  ["Luke", ["lk"], 24],
  ["John", ["jn"], 21],
  ["Acts", [], 28],
  ["Romans", ["rom"], 16],
  ["1 Corinthians", ["1 cor", "1cor", "1 co", "1co"], 16],
  ["2 Corinthians", ["2 cor", "2cor", "2 co", "2co"], 13],
  ["Galatians", ["gal"], 6],
  ["Ephesians", ["eph"], 6],
  ["Philippians", ["phil", "php"], 4],
  ["Colossians", ["col"], 4],
  ["1 Thessalonians", ["1 thes", "1thess", "1 th", "1th"], 5],
  ["2 Thessalonians", ["2 thes", "2thess", "2 th", "2th"], 3],
  ["1 Timothy", ["1 tim", "1tim", "1 ti", "1ti"], 6],
  ["2 Timothy", ["2 tim", "2tim", "2 ti", "2ti"], 4],
  ["Titus", ["tit"], 3],
  ["Philemon", ["philem", "phm"], 1],
  ["Hebrews", ["heb"], 13],
  ["James", ["jas", "jm"], 5],
  ["1 Peter", ["1 pet", "1pet", "1 pe", "1pe"], 5],
  ["2 Peter", ["2 pet", "2pet", "2 pe", "2pe"], 3],
  ["1 John", ["1 jn", "1john", "1 jo", "1jn"], 5],
  ["2 John", ["2 jn", "2john", "2 jo", "2jn"], 1],
  ["3 John", ["3 jn", "3john", "3 jo", "3jn"], 1],
  ["Jude", [], 1],
  ["Revelation", ["revelations", "rev"], 22],
];

/** @type {Book[]} */
export const BOOKS = BOOK_SOURCE.map(([name, aliases, chapters], index) => ({
  number: index + 1,
  bollsId: index + 1,
  name,
  aliases,
  chapters,
}));

function normalizeKey(value) {
  return value.toLowerCase().replace(/[.']/g, "").replace(/\s+/g, " ").trim();
}

const bookLookup = new Map(
  BOOKS.flatMap((book) => [book.name, ...book.aliases].map((value) => [normalizeKey(value), book])),
);

export const BOOK_KEYS = [...bookLookup.keys()];

function damerauLevenshtein(left, right) {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(columns).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column;

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );

      if (
        row > 1 &&
        column > 1 &&
        left[row - 1] === right[column - 2] &&
        left[row - 2] === right[column - 1]
      ) {
        matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + 1);
      }
    }
  }

  return matrix[left.length][right.length];
}

/**
 * Suggest the closest book name for a mistyped lookup.
 *
 * @param {string} value raw book text (may include a typo)
 * @param {number} [maxDistance] maximum Damerau-Levenshtein distance
 * @returns {Book|null}
 */
export function suggestBook(value, maxDistance = 2) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = normalizeKey(value);
  if (!candidate) return null;

  let best = null;
  for (const [key, book] of bookLookup) {
    const distance = damerauLevenshtein(candidate, key);
    if (distance > maxDistance) continue;

    const canonical = normalizeKey(book.name) === key ? 0 : 1;
    if (
      best === null ||
      distance < best.distance ||
      (distance === best.distance && canonical < best.canonical) ||
      (distance === best.distance && canonical === best.canonical && key.length < best.key.length)
    ) {
      best = { distance, canonical, key, book };
    }
  }

  return best ? best.book : null;
}

export function getBook(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new BookNotFoundError(`Book not found: ${value ?? "(none)"}`);
  }

  const book = bookLookup.get(normalizeKey(value));
  if (!book) {
    throw new BookNotFoundError(`Book not found: ${value}`);
  }

  return book;
}

export function normalizeBook(value) {
  return getBook(value).name;
}

export function getBookByBollsId(bollsId) {
  return BOOKS.find((book) => book.bollsId === bollsId) ?? null;
}
