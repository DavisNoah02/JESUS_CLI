/**
 * Translation codes served by bolls.life.
 *
 * There is no translation-list endpoint on the API, and an unknown code returns
 * HTTP 200 with an empty array. This list was verified live against
 * `GET /get-chapter/<CODE>/43/3/` and exists so the CLI can fail fast with a
 * useful message instead of a misleading "chapter not found".
 */
export const TRANSLATIONS = Object.freeze({
  KJV: "King James Version",
  WEB: "World English Bible",
  ASV: "American Standard Version",
  YLT: "Young's Literal Translation",
  NKJV: "New King James Version",
  NASB: "New American Standard Bible",
  ESV: "English Standard Version",
  NIV: "New International Version",
  NLT: "New Living Translation",
  TNIV: "Today's New International Version",
  ERV: "English Revised Version",
  AMP: "Amplified Bible",
  MSG: "The Message",
  CJB: "Christian Journals Bible",
  NET: "New English Translation",
  CUV: "Chinese Union Version",
  GNT: "Greek New Testament",
});

export const DEFAULT_TRANSLATION = "KJV";

export function normalizeTranslation(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function isSupportedTranslation(value) {
  return Object.hasOwn(TRANSLATIONS, normalizeTranslation(value));
}

export function translationName(value) {
  return TRANSLATIONS[normalizeTranslation(value)] ?? null;
}

export function listTranslations() {
  return Object.entries(TRANSLATIONS).map(([code, name]) => ({ code, name }));
}

export function translationCodes() {
  return listTranslations()
    .map((entry) => entry.code)
    .join(", ");
}
