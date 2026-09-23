# Jesus CLI

Read Scripture directly in your terminal.

Jesus CLI is a Node.js command-line Bible reader with bundled King James Version data. It is being built incrementally, starting with a dependency-light core that works offline.

## Current status

Working commands (KJV only, plain text):

- `read "John 3:16"`, `"Psalm 23:1-6"`, `"John 3"` — single verse, range, or whole chapter
- `search "love one another"` — case-insensitive substring search, up to 50 results in canonical book order
- `random` — a random verse
- `today` — today's verse, stable for the current day
- `--version`, `--help`

Data layer: 66-book catalog with aliases, chapter counts, `bollsId`s; lazy KJV loading; reference parsing with bounds validation; typed errors with stderr/exit-code discipline.

### Deviation from the Rust original (`today`)

The Rust `christ-cli`'s `today` is non-deterministic, so the date never actually changes the verse. This Node build deliberately fixes that: `today` seeds the random pick from the current UTC date, so it is stable within a day and changes at midnight. This is a documented deviation, not an accident.

## Development

```sh
npm test
node src/cli.js read "John 3:16"
```

After linking the package locally:

```sh
npm link
Jesus "John 3:16"
```

## Roadmap

- Milestone 1 — core data layer + `read` — done
- Milestone 2 — `search`, `random`, `today` — done
- Translation support through the Bolls API (bolls.life)
- Local cache and saved state
- Interactive terminal UI

## License

MIT