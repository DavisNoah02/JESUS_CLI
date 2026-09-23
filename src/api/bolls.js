import { NetworkError } from "../errors.js";

const BASE = "https://bolls.life";
const TIMEOUT_MS = 10_000;

async function request(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE}${path}`, { signal: controller.signal });
  } catch (error) {
    throw new NetworkError(`Bolls request failed: ${path} (${error?.message ?? error})`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new NetworkError(`Bolls API responded ${response.status} for ${path}`);
  }

  let body;
  try {
    body = await response.text();
  } catch (error) {
    throw new NetworkError(`Bolls request failed: ${path} (${error?.message ?? error})`);
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new NetworkError(`Invalid response from Bolls API: ${path}`);
  }
}

export function cleanHtml(text) {
  const source = String(text ?? "");
  let result = "";
  let inTag = false;
  let inStrong = false;
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (char === "<") {
      const rest = source.slice(i).toLowerCase();
      if (rest.startsWith("<s>")) {
        inStrong = true;
        i += 3;
      } else if (rest.startsWith("</s>")) {
        inStrong = false;
        i += 4;
      } else {
        inTag = true;
        i += 1;
      }
      continue;
    }

    if (char === ">") {
      inTag = false;
      i += 1;
      continue;
    }

    if (!inTag && !inStrong) {
      result += char;
    }
    i += 1;
  }

  return result.trim();
}

export async function getChapter(translation, bookId, chapter) {
  const data = await request(`/get-chapter/${translation}/${bookId}/${chapter}/`);
  return data.map((entry) => ({ verse: entry.verse, text: cleanHtml(entry.text) }));
}

export async function getVerse(translation, bookId, chapter, verse) {
  const entry = await request(`/get-verse/${translation}/${bookId}/${chapter}/${verse}/`);
  return { verse: entry.verse, text: cleanHtml(entry.text) };
}

export async function getRandomVerse(translation) {
  const entry = await request(`/get-random-verse/${translation}/`);
  return {
    book: entry.book,
    chapter: entry.chapter,
    verse: entry.verse,
    text: cleanHtml(entry.text)
  };
}

export async function search(translation, query) {
  const data = await request(`/search/${translation}/${encodeURIComponent(query)}/`);
  return data.map((entry) => ({
    book: entry.book,
    chapter: entry.chapter,
    verse: entry.verse,
    text: cleanHtml(entry.text)
  }));
}