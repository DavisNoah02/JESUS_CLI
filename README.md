# jesuschrist CLI

A terminal-first Bible reader for developers and believers who want Scripture in the shell.

jesuschrist CLI is a Node.js command-line app for reading the Bible from the terminal. It ships with bundled KJV data, supports fast verse lookup and search, and is designed to grow into a richer offline-first Bible experience with a TUI, translations, state, and a polished developer workflow.

Built with Node.js + ESM. Works offline with bundled KJV data. Planned to grow toward a rich terminal UI and translation system.

## Install

```bash
npm install --global jesuschrist
jesuschrist read "John 3:16"
```

That is the whole contract: one global install, and the `jesuschrist` command is on your
path. A shorter `jesus` alias is installed too. If you would rather not install anything,
`npx jesuschrist read "John 3:16"` works as well.

Requires Node.js 22 or newer.

<details>
<summary>Install from a local checkout</summary>

```bash
git clone https://github.com/DavisNoah02/JESUS_CLI.git
cd JESUS_CLI
npm install
npm link
```

</details>

## Documentation

The build guide, the milestone reference, and the manual test checklist ship with the
package, under `docs/`.

## Usage

Read a specific verse:

```bash
jesuschrist read "John 3:16"
```

Read a chapter:

```bash
jesuschrist read "Genesis 1"
```

Read a verse range:

```bash
jesuschrist read "Psalm 23:1-6"
```

Search the Bible:

```bash
jesuschrist search "faith"
```

Get a random verse:

```bash
jesuschrist random
```

Get the verse of the day:

```bash
jesuschrist today
```

Read in another translation (fetched from bolls.life and cached on disk):

```bash
jesuschrist --translation WEB read "John 3:16"
jesuschrist --translation NIV search "faith"
```

Change the default translation or theme:

```bash
jesuschrist config set translation WEB
jesuschrist config set theme Midnight
jesuschrist config list
```

Limit search results:

```bash
jesuschrist search faith --limit 10
jesuschrist search faith --limit 10 --offset 10
jesuschrist search faith --limit 10 --json
jesuschrist books --json
```

JSON responses use a versioned schema documented in [docs/JSON_SCHEMA.md](docs/JSON_SCHEMA.md).

Check help:

```bash
jesuschrist --help
```

Check version:

```bash
jesuschrist --version
```

### Options

| Option                     | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `-t, --translation <CODE>` | Translation to use (KJV, WEB, NIV, ESV, ...)   |
| `--theme <NAME>`           | Theme to use (Slate, Midnight)                 |
| `-n, --limit <N>`          | Maximum number of search results               |
| `--offset <N>`             | Number of search matches to skip               |
| `--json`                   | Output versioned machine-readable JSON         |
| `--no-color`               | Disable colored output                         |
| `--debug`                  | Show stack traces for errors                   |
| `--`                       | Treat everything after this as plain arguments |

Flags work before, between, or after the command. `--translation` applies to that one
invocation only; use `config set` to change the saved default.

## Current status

Milestone 11 is complete: the package is published as `jesuschrist`. Install it
with `npm install --global jesuschrist`.

Working today:

- `read` for single verse, verse range, and whole chapter
- `search` for Bible text lookup, with `--limit`, `--offset`, and total match counts
- `--json` for read, search, random, today, books, and `config list`
- `books` for all 66 canonical books, aliases, and chapter counts
- `random` verse selection
- `today` verse selection (deterministic per local calendar date)
- `config list` / `config get` / `config set` for translation and theme
- `--help` and `--version`
- bundled KJV data with offline reads
- canonical 66-book recognition and common aliases
- additional translations (WEB, NIV, ESV, ...) via the Bolls API, cached on disk
- local state persistence (`state.json` in the per-platform data dir)
- themed terminal output (state-driven theme, respects `NO_COLOR`, plain when piped)
- typed errors on stderr with exit code 1; unexpected errors exit 70 with a stack trace

Planned next:

- M9 reference parsing and lookup quality
- M12 interactive terminal UI using Ink
- translation picker and install management

## Features

- Offline-first KJV experience
- Fast terminal-reading workflow
- Forgiving reference parsing
- Canonical book resolution and aliases
- 17 translations via the Bolls API, cached on disk for offline reuse
- Persistent local state and an on-disk translation cache (atomic writes, corrupt files treated as uncached)
- Themed terminal output (state-driven theme, `NO_COLOR` aware, plain when piped)
- Typed error hierarchy with clean stderr messages and meaningful exit codes
- Plain-text output suitable for pipes and scripting
- Zero-runtime-dependency core

## Tech

- Node.js 22+ (24 recommended)
- JavaScript / ESM
- bundled KJV JSON (66 books, 31,102 verses)
- Node test runner
- Bolls.life API for additional translations
- future TUI via a maintained terminal UI library

## Roadmap

- Milestone 1 — core data layer + `read` — complete
- Milestone 2 — `search`, `random`, `today` — complete
- Milestone 3 — Bolls API integration — complete
- Milestone 4 — state persistence — complete
- Milestone 5 — cache system — complete
- Milestone 6 — themes — complete
- Milestone 7 — wire the layers into the CLI — complete
- Milestone 8 — developer-grade output (`--json`, pagination, `books`) — complete
- Milestone 9 — reference parsing and lookup quality
- Milestone 10 — lint, format, and type-check baseline — complete
- Milestone 11 — publish to npm — complete
- Milestone 12 — terminal UI

The full roadmap, exit criteria, and known-gaps audit are maintained in the `docs/` folder,
which ships with the package.

## License

MIT

## Development

```bash
npm ci             # install the toolchain from the lockfile
npm test           # 130 tests; the KJV path needs no network
npm run check      # lint + format + type check + tests, all in one
npm link           # link the `jesuschrist` command locally
node src/cli.js --help
```

Individual gates:

| Command                | Checks                                                |
| ---------------------- | ----------------------------------------------------- |
| `npm run lint`         | ESLint, flat config, Node globals                     |
| `npm run lint:fix`     | ESLint with autofix                                   |
| `npm run format`       | Prettier, writes in place                             |
| `npm run format:check` | Prettier, fails on drift                              |
| `npm run typecheck`    | `tsc --noEmit` over the JSDoc types in `checkJs` mode |
| `npm run check`        | All of the above, then the tests                      |

The source is plain JavaScript with JSDoc types, so `npm run typecheck` covers the whole
project without a TypeScript migration.

The CLI stores its settings and translation cache in the per-platform data directory
(`~/.local/share/jesus-cli` on Linux, `~/Library/Application Support/jesus-cli` on macOS,
`%APPDATA%\jesus-cli` on Windows). Set `JESUS_CLI_DATA_DIR` to override it.
