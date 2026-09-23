#!/usr/bin/env node

import { printError, printResult } from "./logger.js";
import { ReferenceParseError } from "./errors.js";
import { parseReference } from "./data/reference.js";
import { getVerses } from "./data/kjv.js";

const [command, ...args] = process.argv.slice(2);

async function read(referenceValue) {
  if (!referenceValue) {
    throw new ReferenceParseError("Usage: Jesus read <reference> (e.g. Jesus read \"John 3:16\")");
  }

  const reference = parseReference(referenceValue);
  const verses = await getVerses(reference);

  for (const verse of verses) {
    printResult(`${reference.book} ${reference.chapter}:${verse.verse} - ${verse.text} (KJV)`);
  }
}

async function main() {
  switch (command) {
    case "hello":
      printResult("Jesus CLI is alive.");
      break;
    case "read":
      await read(args.join(" ").trim());
      break;
    case undefined:
      printError("Usage: Jesus <read> <reference>  (e.g. Jesus read \"John 3:16\")");
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
