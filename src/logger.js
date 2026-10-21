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

export function printError(value, theme) {
  const styled = paint(value, "error", { enabled: shouldUseColor({ stream: process.stderr }), theme });
  process.stderr.write(`${styled}\n`);
}

export function printWarning(value, theme) {
  const styled = paint(value, "warning", { enabled: shouldUseColor({ stream: process.stderr }), theme });
  process.stderr.write(`${styled}\n`);
}
