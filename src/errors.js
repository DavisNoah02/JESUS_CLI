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