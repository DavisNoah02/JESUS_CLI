# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet. The next milestone is M8 — developer-grade output: `--json` with a
versioned schema, a `books` command, and search pagination with a total match count.

## [0.1.0] — Unreleased

The first installable release. Everything below has been merged to `main`; this entry is
cut when the package is published.

### Added

**Reading Scripture**

- `jesuschrist read` — a single verse, a verse range, or a whole chapter (alias `jesus`).
- `jesuschrist search` — full-text KJV search, with `--limit`.
- `jesuschrist random` — a random verse.
- `jesuschrist today` — the verse of the day, deterministic per local calendar date.
- Canonical 66-book resolution with the common aliases (`Jn`, `Ps`, `1co`, …).

**Translations**

- 17 translations via the Bolls API (`KJV`, `WEB`, `ASV`, `YLT`, `NKJV`, `NASB`, `ESV`,
  `NIV`, `NLT`, `TNIV`, `ERV`, `AMP`, `MSG`, `CJB`, `NET`, `CUV`, `GNT`).
- Translations are fetched on demand and cached on disk, so a cached translation keeps
  working offline.
- The cache lives under the per-platform data directory, namespaced per translation,
  with a one-time migration of the pre-M7 cache location.
- An unsupported translation code fails with a clear message listing the supported ones.

**Configuration and output**

- `jesuschrist config list` / `get` / `set` for the default translation and theme.
- `--translation`, `--theme`, `--limit`, `--no-color`, `--debug`, and `--`.
- `--translation` applies to a single invocation only; `config set` changes the saved
  default.
- Persistent local state in `state.json`, written atomically.
- Themed output, with a `NO_COLOR` and non-TTY aware plain-text fallback.
- Typed errors on stderr: known errors exit 1 with a clean message, unexpected errors
  exit 70 with a stack trace.
- `JESUS_CLI_DATA_DIR` overrides the data directory.

**Data**

- The King James Version bundled as `data/kjv.json` — 66 books, 1,189 chapters, 31,102
  verses — so the core experience works with no network at all.
- `data/README.md` documents the KJV's provenance, its SHA-256, and the licensing rules
  for adding another translation.

**Engineering**

- 130 automated tests (`node:test`), with no network required for the KJV path.
- ESLint 10, Prettier 3, and TypeScript 5.9 in `checkJs` mode over the JSDoc typedefs —
  type safety with no TypeScript migration.
- `npm run check` runs lint, format, type check, and tests together.
- CI on Node 22 and 24, gating on lint, format, type check, tests, and a packaging
  dry-run.
- Zero runtime dependencies.

### Notes

- Package renamed to `jesuschrist` (unscoped). Both `jesuschrist` and `jesus` are
  installed as CLI aliases. Install with `npm install --global jesuschrist`.
- The plain-text output format is a public API. `John 3:16 - <text> (KJV)` is what
  people pipe into `grep` and `awk`, and changing it will be a breaking change.

[Unreleased]: https://github.com/DavisNoah02/JESUS_CLI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/DavisNoah02/JESUS_CLI/releases/tag/v0.1.0
