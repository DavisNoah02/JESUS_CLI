# Build Guide

This folder contains the implementation and build notes for the Node.js version of Jesus CLI.

## Scope

This project is a Node.js/ESM rebuild of the original Rust `christ-cli` idea. The Node implementation is the source of truth for the current build.

## Current status

The project is currently at the plain-text CLI milestone:

- `read` works
- `search` works
- `random` works
- `today` works
- `--help` and `--version` work
- the TUI and translation download layers are not yet implemented

## Local development

From the project root:

```bash
cd /home/neo/Projects/JESUS_CLI/node
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

### Planned

- Bolls API integration
- cache and state persistence
- translation selector
- TUI with blessed
- packaging and publishing

## Architecture notes

The overall flow is:

- CLI
- data layer
- KJV source
- optional API fallback
- later TUI and state layers

## Notes

- No runtime dependencies are used in the current plain-text CLI milestone.
- The Node project remains intentionally minimal until the TUI milestone.
- The Rust implementation remains reference material only.
