import { paint, shouldUseColor } from "./theme.js";

function onPipeError(error) {
  if (error?.code === "EPIPE") {
    process.exit(0);
  }
  throw error;
}

process.stdout.on("error", onPipeError);
process.stderr.on("error", onPipeError);

export function printResult(value) {
  process.stdout.write(`${value}\n`);
}

  export function printError(value) {
    const styled = paint(value, "error", { enabled: shouldUseColor({ stream: process.stderr }) });
    process.stderr.write(`${styled}\n`);
  }