# JSON Output Schema

`--json` writes one JSON object to stdout. Errors and warnings remain on stderr. The
plain-text output is unchanged. The schema is versioned independently of the package
version; incompatible changes require a new `schemaVersion`.

Every response uses this envelope:

```json
{
  "schemaVersion": 1,
  "type": "read",
  "data": {}
}
```

## Read, random, and today

These commands return a translation and a `verses` array. Each verse contains its
canonical `book`, numeric `chapter` and `verse`, and text. `read` also returns a
`reference` with `book`, `chapter`, `verseStart`, and `verseEnd`; whole-chapter
references use `null` for both verse bounds.

```bash
jesuschrist read "John 3:16" --json | jq -r '.data.verses[0].text'
```

## Search

Search data includes the original query, translation, requested `limit` and `offset`,
the number of matches in the searched source, a `source` value, and the current page's
`verses` array. Results are ordered canonically by book, chapter, and verse. An empty
page is represented by an empty array, not a text message.

`source` is `bundled` for KJV, `network` for a Bolls API response, `complete-cache` for a
cached full translation, or `cache` for locally cached chapters only. When `source` is
`cache`, `total` counts matches in those cached chapters, not the full translation.

```bash
jesuschrist search faith --limit 5 --offset 10 --json
```

## Books

`books` returns all 66 canonical books in Bible order. Each entry has `number`, `name`,
`aliases`, and `chapters`. Bolls-specific identifiers are intentionally omitted because
they are implementation details.

## Config

`config list --json` returns the current `translation` and `theme` under `data.settings`.
JSON mode is supported for `config list`; `get` and `set` keep their existing text output.

## Help and version

`--help --json` returns `data.usage`; `--version --json` returns `data.version`.
