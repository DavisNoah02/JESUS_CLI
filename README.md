# Jesus CLI

Read Scripture directly in your terminal.

Jesus CLI is a Node.js command-line Bible reader with bundled King James Version data. It is being built incrementally, starting with a dependency-light core that works offline.

## Current status

The project currently includes:

- A pure ESM Node.js package
- The bundled KJV text
- A canonical 66-book catalog with common aliases
- Bible reference parsing such as `John 3:16`, `Psalm 23:1-6`, `1 Cor 13`, and `jn3:16`
- Lazy KJV chapter and verse loading

## Development

```sh
npm test
node src/cli.js hello
```

After linking the package locally:

```sh
npm link
Jesus hello
```

## Roadmap

- Read references from the CLI
- Search, random verse, and verse of the day
- Translation support through the Bolls API
- Local cache and saved state
- Interactive terminal UI

## License

MIT