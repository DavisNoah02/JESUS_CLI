#!/usr/bin/env node

import { printError, printResult } from "./logger.js";

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "hello") {
    printResult("Jesus CLI is alive.");
  } else {
    printError(`Unknown command: ${command ?? "(none)"}`);
    process.exitCode = 1;
  }
} catch (error) {
  printError(error.message);
  process.exitCode = 1;
}