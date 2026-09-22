export function printResult(value) {
  process.stdout.write(`${value}\n`);
}

export function printError(value) {
  process.stderr.write(`${value}\n`);
}