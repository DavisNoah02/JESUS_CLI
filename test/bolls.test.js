import test from "node:test";
import assert from "node:assert/strict";
import { cleanHtml, getChapter, getRandomVerse, search } from "../src/api/bolls.js";

test("cleanHtml strips tags and Strong's markers", () => {
  assert.equal(
    cleanHtml("In the beginning<S>7225</S> God<S>430</S> created<S>1254</S>."),
    "In the beginning God created."
  );
  assert.equal(cleanHtml("Have <mark>faith</mark> in God."), "Have faith in God.");
  assert.equal(
    cleanHtml("  <b>A Psalm by David. </b>   Yahweh is my shepherd: I shall lack nothing.  "),
    "A Psalm by David.    Yahweh is my shepherd: I shall lack nothing."
  );
});

test("cleanHtml handles empty and non-string input", () => {
  assert.equal(cleanHtml(null), "");
  assert.equal(cleanHtml(""), "");
  assert.equal(cleanHtml("  plain text  "), "plain text");
});

test("fetches a chapter over the network and strips tags", async (t) => {
  try {
    const chapter = await getChapter("WEB", 19, 23);
    assert.ok(chapter.length >= 6);
    assert.equal(chapter[0].verse, 1);
    assert.doesNotMatch(chapter[0].text, /<|>/);
  } catch (error) {
    if (error.name === "NetworkError") return t.skip("bolls.life unreachable");
    throw error;
  }
});

test("searches a translation over the network", async (t) => {
  try {
    const results = await search("WEB", "faith");
    assert.ok(results.length >= 1);
    assert.match(results[0].text, /faith/i);
    assert.doesNotMatch(results[0].text, /<mark>/);
  } catch (error) {
    if (error.name === "NetworkError") return t.skip("bolls.life unreachable");
    throw error;
  }
});

test("fetches a random verse over the network", async (t) => {
  try {
    const verse = await getRandomVerse("WEB");
    assert.ok(verse.book >= 1 && verse.book <= 66);
    assert.ok(verse.chapter >= 1);
    assert.ok(verse.verse >= 1);
    assert.ok(verse.text.length > 0);
  } catch (error) {
    if (error.name === "NetworkError") return t.skip("bolls.life unreachable");
    throw error;
  }
});