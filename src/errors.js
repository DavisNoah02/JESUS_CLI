export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

export class ReferenceParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReferenceParseError";
  }
}

export class BookNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "BookNotFoundError";
  }
}

export class VerseNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "VerseNotFoundError";
  }
}

export class CacheCorruptError extends Error {
  constructor(message) {
    super(message);
    this.name = "CacheCorruptError";
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

export class UnsupportedTranslationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnsupportedTranslationError";
  }
}

/**
 * Extract a readable message from a caught value.
 *
 * A `catch` binding is `unknown` under strict mode, so it has to be narrowed
 * before its message can be read. This keeps that narrowing in one place.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function errorMessage(value) {
  return value instanceof Error ? value.message : String(value);
}

/**
 * Extract the name of a caught value, e.g. `"NetworkError"`.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function errorName(value) {
  return value instanceof Error ? value.name : "Error";
}
