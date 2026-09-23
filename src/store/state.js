import { readFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const DEFAULT_STATE = Object.freeze({
  bookIndex: 0,
  chapter: 1,
  scrollPosition: 0,
  activePanel: 0,
  theme: "Slate",
  translation: "KJV"
});

const APP_DIR = "jesus-cli";
const STATE_FILE = "state.json";

export function defaultDataDir({ platform = process.platform, env = process.env } = {}) {
  if (platform === "darwin") {
    return join(homedir(), "Library", "Application Support");
  }
  if (platform === "win32") {
    return env.APPDATA || join(homedir(), "AppData", "Roaming");
  }
  return env.XDG_DATA_HOME || join(homedir(), ".local", "share");
}

export function statePath({
  dataDir = defaultDataDir(),
  appDir = APP_DIR,
  fileName = STATE_FILE
} = {}) {
  return join(dataDir, appDir, fileName);
}

export async function load({ path = statePath() } = {}) {
  try {
    const contents = JSON.parse(await readFile(path, "utf8"));
    return { ...DEFAULT_STATE, ...contents };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/**
 * Write failures are swallowed on purpose (parity with the Rust client:
 * a failed save must never crash or block the reader).
 */
export async function save(state, { path = statePath() } = {}) {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(state, null, 2), "utf8");
  } catch {
    /* intentionally silent */
  }
}