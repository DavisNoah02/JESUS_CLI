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
 * @property {string} book canonical English name
 * @property {number} chapter
 * @property {number} verse
 * @property {string} text
 */

/**
 * @typedef {object} ResolverOptions
 * @property {number} [limit] maximum number of results for a search
 * @property {number} [offset] number of matching results to skip
 * @property {(message: string) => void} [onWarn] called when the resolver
 *   substitutes a fallback, so the CLI can report it on stderr
 */

/**
 * @typedef {object} ParsedArgs
 * @property {string|undefined} command
 * @property {string[]} positionals
 * @property {Record<string, string|true>} flags
 */

/**
 * @typedef {object} CommandContext
 * @property {object} state persisted settings
 * @property {string} statePath path of the state file
 * @property {string[]} positionals
 * @property {Record<string, string|true>} flags
 * @property {string} translation resolved translation code
 * @property {string} theme resolved theme name
 * @property {number|undefined} limit maximum number of search results
 * @property {number} offset number of matching search results to skip
 * @property {boolean} colorEnabled
 * @property {ResolverOptions} options
 */

export {};
