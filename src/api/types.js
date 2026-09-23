/**
 * @typedef {object} Verse
 * @property {number} verse 1-based verse number
 * @property {string} text verse text
 */

/**
 * @typedef {object} BookInfo
 * @property {number} number 1-based canonical book order
 * @property {number} bollsId Bolls API book id
 * @property {string} name canonical English name
 * @property {string[]} aliases common aliases
 * @property {number} chapters chapter count
 */

/**
 * @typedef {object} Reference
 * @property {string} book canonical book name
 * @property {number} chapter
 * @property {number|null} verseStart
 * @property {number|null} verseEnd
 */

/**
 * @typedef {object} SearchResult
 * @property {string} book canonical book name
 * @property {number} chapter
 * @property {number} verse
 * @property {string} text
 */

/**
 * @typedef {object} RandomVerse
 * @property {string} book canonical book name
 * @property {number} chapter
 * @property {number} verse
 * @property {string} text
 */

export {};