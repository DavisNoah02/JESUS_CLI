import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));

let cachedVersion;

export function version() {
  if (!cachedVersion) {
    cachedVersion = JSON.parse(readFileSync(packagePath, "utf8")).version;
  }
  return cachedVersion;
}