#!/usr/bin/env node

import { printError, printResult } from "./logger.js";
import { UsageError } from "./errors.js";
import { parseReference } from "./data/reference.js";
import { getVerses, randomVerse, search, verseOfTheDay } from "./data/kjv.js";
import { version } from "./version.js";
import { load as loadState } from "./store/state.js";
import { paint } from "./theme.js";

const [command, ...args] = process.argv.slice(2);

const USAGE = `Usage: Jesus <command> [<reference>]

Commands:
  read <reference>   Read verses (e.g. "John 3:16", "Psalm 23:1-6", "John 3")
  search <query>     Search the KJV, up to 50 results
  random             Show a random verse
  today              Show today's verse (stable for the current day)
  --version          Print the version
  --help             Show this help`;

function printVerse({ book, chapter, verse, text }, theme) {
  const reference = paint(`${book} ${chapter}:${verse}`, "ref", { theme });
  const versionNote = paint("(KJV)", "muted", { theme });
  printResult(`${reference} - ${text} ${versionNote}`);
}

async function read(referenceValue, theme) {
  if (!referenceValue) {
    throw new UsageError(`Usage: Jesus read <reference>  (e.g. Jesus read "John 3:16")`);
  }

  const reference = parseReference(referenceValue);
  const verses = await getVerses(reference);

  for (const verse of verses) {
    printVerse({ book: reference.book, chapter: reference.chapter, ...verse }, theme);
  }
}

async function searchCommand(query, theme) {
  if (!query) {
    throw new UsageError(`Usage: Jesus search <query>  (e.g. Jesus search "love one another")`);
  }

  const results = await search(query);
  if (results.length === 0) {
    printResult(paint(`No results for "${query}"`, "muted", { theme }));
    return;
  }

  for (const verse of results) {
    printVerse(verse, theme);
  }
}

async function main() {
  const theme = (await loadState()).theme;
  switch (command) {
    case "read":
      return read(args.join(" ").trim(), theme);
    case "search":
      return searchCommand(args.join(" ").trim(), theme);
    case "random":
      return printVerse(await randomVerse(), theme);
    case "today":
      return printVerse(await verseOfTheDay(), theme);
    case "--version":
    case "-V":
      return printResult(`Jesus CLI ${version()}`);
    case "--help":
    case "-h":
      return printResult(USAGE);
    case undefined:
      printError(USAGE);
      process.exitCode = 1;
      break;
    default:
      printError(`Unknown command: ${command}`);
      process.exitCode = 1;
  }
}

main().catch((error) => {
  printError(error.message);
  process.exitCode = 1;
});