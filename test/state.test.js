import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_STATE, defaultDataDir, load, save, statePath } from "../src/store/state.js";

let dir;
test.before(async () => {
  dir = await mkdtemp(join(tmpdir(), "jesus-state-"));
});

test("defaults when state file is missing", async () => {
  assert.deepEqual(await load({ path: join(dir, "missing", "state.json") }), DEFAULT_STATE);
});

test("round-trips settings through save and load", async () => {
  const path = join(dir, "roundtrip", "state.json");
  const custom = {
    bookIndex: 10,
    chapter: 3,
    scrollPosition: 5,
    activePanel: 1,
    theme: "Midnight",
    translation: "WEB"
  };
  await save(custom, { path });
  assert.deepEqual(await load({ path }), custom);
  const onDisk = JSON.parse(await readFile(path, "utf8"));
  assert.deepEqual(onDisk, custom);
});

test("partial state fills missing fields from defaults", async () => {
  const path = join(dir, "partial", "state.json");
  await save({ bookIndex: 2 }, { path });
  const loaded = await load({ path });
  assert.equal(loaded.bookIndex, 2);
  assert.equal(loaded.chapter, 1);
  assert.equal(loaded.theme, "Slate");
  assert.equal(loaded.translation, "KJV");
});

test("corrupt state file silently falls back to defaults", async () => {
  const dirName = join(dir, "corrupt");
  await mkdir(dirName, { recursive: true });
  const path = join(dirName, "state.json");
  await writeFile(path, "{ not json", "utf8");
  assert.deepEqual(await load({ path }), DEFAULT_STATE);
});

test("save write failures are swallowed, not thrown", async () => {
  const file = join(dir, "blocked");
  await writeFile(file, "i am a file", "utf8");
  const result = await save(DEFAULT_STATE, { path: join(file, "state.json") });
  assert.equal(result, undefined);
});

test("defaultDataDir resolves per platform and env", () => {
  assert.equal(defaultDataDir({ platform: "linux", env: {} }), join(homedir(), ".local", "share"));
  assert.equal(defaultDataDir({ platform: "linux", env: { XDG_DATA_HOME: "/xdg" } }), "/xdg");
  assert.equal(
    defaultDataDir({ platform: "darwin", env: {} }),
    join(homedir(), "Library", "Application Support")
  );
  assert.equal(defaultDataDir({ platform: "win32", env: {} }), join(homedir(), "AppData", "Roaming"));
  assert.equal(defaultDataDir({ platform: "win32", env: { APPDATA: "C:\\appdata" } }), "C:\\appdata");
});

test("statePath nests the app dir and file under the data dir", () => {
  assert.equal(statePath({ dataDir: "/root" }), join("/root", "jesus-cli", "state.json"));
});