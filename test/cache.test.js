import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BOOK_NAMES_FILE,
  COMPLETE_MARKER,
  hasCachedData,
  isFullyCached,
  loadBookNames,
  loadChapter,
  markComplete,
  removeCompleteMarker,
  saveBookNames,
  saveChapter,
  search,
  totalChapters,
  translationDir
} from "../src/store/cache.js";

const newDir = () => mkdtemp(join(tmpdir(), "cache-"));

test("chapter round-trips through an atomic save/load", async () => {
  const dir = await newDir();
  const verses = [
    { verse: 1, text: "In the beginning God created the heaven and the earth." },
    { verse: 2, text: "And the earth was without form, and void." }
  ];

  await saveChapter("WEB", 1, 1, verses, { dataDir: dir });
  const loaded = await loadChapter("WEB", 1, 1, { dataDir: dir });

  assert.deepEqual(loaded, verses);
  const entries = await readdir(translationDir("WEB", { dataDir: dir }));
  assert.deepEqual(entries, ["1_1.json"]);
});

test("temp files are never left behind after a successful save", async () => {
  const dir = await newDir();
  await saveChapter("WEB", 1, 1, [{ verse: 1, text: "test" }], { dataDir: dir });
  const entries = await readdir(translationDir("WEB", { dataDir: dir }));
  assert.ok(entries.every((entry) => !entry.endsWith(".tmp")));
});

test("saveChapter creates the translation directory", async () => {
  const dir = await newDir();
  await saveChapter("web", 1, 1, [{ verse: 1, text: "lowercase translation" }], { dataDir: dir });
  const entries = await readdir(join(dir, "translations"));
  assert.deepEqual(entries, ["WEB"]);
});

test("loadChapter treats missing, corrupt, and non-array files as a miss", async () => {
  const dir = await newDir();
  assert.equal(await loadChapter("WEB", 1, 1, { dataDir: dir }), null);

  await saveChapter("WEB", 1, 1, [{ verse: 1, text: "x" }], { dataDir: dir });
  await writeFile(join(translationDir("WEB", { dataDir: dir }), "1_1.json"), "{ not json", "utf8");
  assert.equal(await loadChapter("WEB", 1, 1, { dataDir: dir }), null);

  await writeFile(join(translationDir("WEB", { dataDir: dir }), "1_1.json"), "{\"a\":1}", "utf8");
  assert.equal(await loadChapter("WEB", 1, 1, { dataDir: dir }), null);
});

test("hasCachedData ignores non-chapter files", async () => {
  const dir = await newDir();
  assert.equal(await hasCachedData("WEB", { dataDir: dir }), false);

  await markComplete("WEB", { dataDir: dir });
  await saveBookNames("WEB", ["Genesis"], { dataDir: dir });
  assert.equal(await hasCachedData("WEB", { dataDir: dir }), false);

  await saveChapter("WEB", 1, 1, [{ verse: 1, text: "x" }], { dataDir: dir });
  assert.equal(await hasCachedData("WEB", { dataDir: dir }), true);
});

test(".complete marker gates isFullyCached", async () => {
  const dir = await newDir();
  assert.equal(await isFullyCached("WEB", { dataDir: dir }), false);

  await markComplete("WEB", { dataDir: dir });
  assert.equal(await isFullyCached("WEB", { dataDir: dir }), true);
  assert.equal(
    (await readdir(translationDir("WEB", { dataDir: dir }))).includes(COMPLETE_MARKER),
    true
  );

  await removeCompleteMarker("WEB", { dataDir: dir });
  assert.equal(await isFullyCached("WEB", { dataDir: dir }), false);
  await removeCompleteMarker("WEB", { dataDir: dir });
});

test("book names round-trip; corrupt book names load as null", async () => {
  const dir = await newDir();
  assert.equal(await loadBookNames("WEB", { dataDir: dir }), null);

  const names = ["Genesis", "Exodus", "Psalms"];
  await saveBookNames("WEB", names, { dataDir: dir });
  assert.deepEqual(await loadBookNames("WEB", { dataDir: dir }), names);
  assert.equal((await readdir(translationDir("WEB", { dataDir: dir }))).includes(BOOK_NAMES_FILE), true);

  await writeFile(join(translationDir("WEB", { dataDir: dir }), BOOK_NAMES_FILE), "broken", "utf8");
  assert.equal(await loadBookNames("WEB", { dataDir: dir }), null);

  await writeFile(join(translationDir("WEB", { dataDir: dir }), BOOK_NAMES_FILE), "{\"a\":1}", "utf8");
  assert.equal(await loadBookNames("WEB", { dataDir: dir }), null);
});

test("search across cached chapters returns canonical order and skips corrupt files", async () => {
  const dir = await newDir();
  await saveChapter("WEB", 19, 23, [{ verse: 1, text: "The LORD is my shepherd." }], { dataDir: dir });
  await saveChapter("WEB", 43, 3, [{ verse: 1, text: "The shepherd of the door." }], { dataDir: dir });
  await writeFile(join(translationDir("WEB", { dataDir: dir }), "9_1.json"), "{ broken", "utf8");

  const results = await search("WEB", "shepherd", { dataDir: dir });

  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map(({ book }) => book),
    ["Psalms", "John"]
  );
  assert.deepEqual(results[0], { book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd." });
  assert.ok(results.every(({ book, chapter, verse, text }) => book && chapter >= 1 && verse >= 1 && text));
});

test("search returns nothing for missing dirs and empty queries", async () => {
  const dir = await newDir();
  assert.deepEqual(await search("WEB", "nope", { dataDir: dir }), []);
  assert.deepEqual(await search("WEB", "", { dataDir: dir }), []);
});

test("totalChapters equals the full Bible count", () => {
  assert.equal(totalChapters(), 1189);
});