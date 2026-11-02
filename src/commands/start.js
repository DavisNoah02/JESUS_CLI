import { UsageError } from "../errors.js";

export async function startCommand(context) {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    throw new UsageError(
      "The TUI requires an interactive terminal. Use `jesuschrist read <reference>` for plain output.",
    );
  }

  const { startTui } = await import("../ui/index.js");
  startTui({ mode: "browser", context });
}
