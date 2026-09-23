# Jesus CLI

A terminal-first Bible reader for developers and believers who want Scripture in the shell.

Jesus CLI is a Node.js command-line app for reading the Bible from the terminal. It ships with bundled KJV data, supports fast verse lookup and search, and is designed to grow into a richer offline-first Bible experience with a TUI, translations, state, and a polished developer workflow.

Built with Node.js + ESM. Works offline with bundled KJV data. Planned to grow toward a rich terminal UI and translation system.

## Install

```bash
npm install -g jesus-cli
```

Or from a local checkout (repo root):

```bash
cd /home/neo/Projects/JESUS_CLI
npm install
npm link
```

## Usage

Read a specific verse:

```bash
Jesus read "John 3:16"
```

Read a chapter:

```bash
Jesus read "Genesis 1"
```

Read a verse range:

```bash
Jesus read "Psalm 23:1-6"
```

Search the Bible:

```bash
Jesus search "faith"
```

Get a random verse:

```bash
Jesus random
```

Get the verse of the day:

```bash
Jesus today
```

Check help:

```bash
Jesus --help
```

Check version:

```bash
Jesus --version
```

## Current status

This project is currently in the plain-text CLI phase with local state and a translation cache.

Working today:

- `read` for single verse, verse range, and whole chapter
- `search` for KJV text lookup
- `random` verse selection
- `today` verse selection (deterministic per date)
- `--help` and `--version`
- bundled KJV data with offline reads
- canonical 66-book recognition and common aliases
- additional translations (WEB, etc.) via the Bolls API at bolls.life
- local state persistence (`state.json` in the per-platform data dir)
- on-disk translation cache with atomic writes, served before the network

Planned next:

- interactive terminal UI
- themes and navigation panels
- translation picker and install management
- full terminal browser experience
- publication and packaging polish

## Features

- Offline-first KJV experience
- Fast terminal-reading workflow
- Forgiving reference parsing
- Canonical book resolution and aliases
- Additional translations via the Bolls API
- Persistent local state and an on-disk translation cache (atomic writes, corrupt files treated as uncached)
- Zero-runtime-dependency core for the current CLI milestone
- Plain-text output suitable for pipes and scripting

## Tech

- Node.js 18+
- JavaScript / ESM
- bundled KJV JSON
- Node test runner
- Bolls.life API for additional translations
- future TUI via `blessed` once the CLI foundation is fully stabilized

## Roadmap

- Milestone 1 — core data layer + `read` — complete
- Milestone 2 — `search`, `random`, `today` — complete
- Milestone 3 — Bolls API integration — complete
- Milestone 4 — state persistence — complete
- Milestone 5 — cache system — complete
- Milestone 6+ — TUI, translation picker, themes, package polish — planned

## License

MIT

## Build and implementation notes

Detailed project build steps, architecture notes, and implementation history live in the docs folder:

- [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md)
