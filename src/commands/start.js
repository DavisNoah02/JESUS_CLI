import { startTui } from "../ui/index.js";

export async function startCommand(context) {
  // jesus start launches the TUI (intro/onboarding + navigator)
  // For MVP, just launch the browser TUI
  startTui({ mode: "browser", context });
}
