# Build Guide

This folder contains the implementation and build notes for the Node.js version of Jesus CLI.

## Scope

This project is a Node.js/ESM rebuild of the original Rust `christ-cli` idea. The Node implementation is the source of truth for the current build.

## Current status

The project is at the plain-text CLI milestone with local state and an on-disk translation cache:

- `read` works
- `search` works
- `random` works
- `today` works (deterministic per date)
- `--help` and `--version` work
- additional translations resolve via the Bolls API at bolls.life
- local state persists in `<dataDir>/jesus-cli/state.json`
- fetched chapters cache to `<dataDir>/jesus-cli/translations/<TRANSLATION>/`
- the TUI, downloader, and translation-picker layers are not yet implemented

## Local development

From the project root:

```bash
npm install
npm test
```

Run the CLI directly:

```bash
node src/cli.js read "John 3:16"
```

Link the binary locally:

```bash
npm link
Jesus read "John 3:16"
```

## Commands available today

```bash
Jesus read "John 3:16"
Jesus read "Psalm 23:1-6"
Jesus search "faith"
Jesus random
Jesus today
Jesus --help
Jesus --version
```

## Roadmap

### Completed

- core data layer
- book catalog and aliases
- reference parser
- KJV lookup
- read command
- search, random, today
- Bolls API client (`getChapter`, `getVerse`, `getRandomVerse`, `search`, `getVerseRange` deferred)
- resolver facade (KJV local, other translations via network/cache)
- state persistence (`state.json`)
- on-disk translation cache (atomic writes, corrupt-safe)

### Planned

- translation selector / install management
- background downloader
- TUI with blessed
- themes and navigation panels
- packaging and publishing

## Architecture notes

The overall flow is:

- CLI
- resolver facade (`src/api/resolver.js`)
  - KJV source (bundled, offline)
  - Bolls API (`src/api/bolls.js`) for other translations
  - disk cache (`src/store/cache.js`) checked before the API, written through after a fetch
- state layer (`src/store/state.js`) for persistent settings
- later TUI, downloader, and translation-picker layers

### Cache layout

```
<dataDir>/jesus-cli/translations/<TRANSLATION>/
  .complete
  books.json
  <bollsId>_<chapter>.json
```

- `dataDir` defaults per platform: Linux/macOS `~/.local/share`, Windows `%LOCALAPPDATA%`; override with `XDG_DATA_HOME`.
- Chapter files are written atomically (`*.tmp` then `rename`).
- Only files matching `/^\d+_\d+\.json$/` count as cached chapters; `books.json`, `.complete`, and stray temp files never trigger a cache hit.
- Detection is a deliberate fix over the Rust original, which conflated `books.json`/`.complete` with real chapters.
- A corrupt or non-array chapter file is treated as a cache miss, not a crash (and is refetched).
- The `.complete` marker asserts a whole translation is mirrored; a missing chapter under a `.complete` marker clears the marker on next read.

## Notes

- No runtime dependencies are used in the current plain-text CLI milestone.
- The Node project remains intentionally minimal until the TUI milestone.
- The Rust implementation remains reference material only.
- Known deviations from the Rust original:
  - `today` is deterministic per calendar date rather than time-of-day based.
  - Bolls has no verse-range endpoint, so ranges resolve by fetching the chapter and filtering.
  - WEB (and translations with deuterocanonical books) return bolls ids above 66; `getBookByBollsId` falls back to `#<id>` where the book catalog has no match.
