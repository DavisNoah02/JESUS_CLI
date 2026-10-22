# Build Guide

Implementation and build notes for the Node.js version of Jesus CLI — a terminal-first Bible reader for developers.

This guide is the source of truth for how to build, run, test, and ship the project. It is verified against the working tree, not aspirational.

**Related:** [MILESTONES.md](MILESTONES.md) — the local reference for the remaining milestones (M7–M12), including the scope, decisions, and exit criteria. That file is **git-ignored** and therefore not part of the repository or the published package; anything that must ship belongs in this guide or in `CHANGELOG.md`.

---

## 1. Scope

- This project is a Node.js/ESM rebuild of the original Rust `christ-cli` idea. The Node implementation is the source of truth for the current build.
- The Rust implementation is reference material only. It is not built, tested, or shipped.
- The product target is **a Bible reader for developers**: fast, scriptable, offline-first, and composable with other command-line tools.

---

## 2. Verified current status

Verified by running the working tree. Last checked: Node v24.18.0 / npm 12.0.1.

### Working today (verified by execution)

| Capability | Command | Notes |
| --- | --- | --- |
| Single verse | `Jesus read "John 3:16"` | Offline, from bundled KJV |
| Verse range | `Jesus read "Psalm 23:1-6"` | Offline |
| Whole chapter | `Jesus read "John 3"` | Offline |
| Text search | `Jesus search "faith"` | KJV only, capped at 50 hits |
| Random verse | `Jesus random` | Offline |
| Verse of the day | `Jesus today` | Offline, stable per UTC date |
| Version | `Jesus --version` / `-V` | Reads `package.json` |
| Help | `Jesus --help` / `-h` | |
| Aliases | `Jn 3:16`, `1 Cor 13`, `Ps 23:1` | 66 canonical books |
| Error handling | bad reference / bad command | stderr + exit code 1 |

### Implemented but **not reachable from the CLI** (see §10)

- Bolls API client (`src/api/bolls.js`) — network-backed translations.
- Resolver facade (`src/api/resolver.js`) — KJV/network/cache routing.
- On-disk translation cache (`src/store/cache.js`).
- State persistence (`src/store/state.js`) and the theme layer (`src/theme.js`).

These layers are implemented and unit-tested, but `src/cli.js` calls `src/data/kjv.js` directly, so a user running `Jesus` today can never trigger them. This is the single largest gap in the project.

### Not yet implemented

- Interactive terminal UI (TUI).
- Translation picker / install management.
- Full-translation background downloader.
- Machine-readable (`--json`) output.
- Published npm package.

### Test suite status

```
npm test  →  65 tests, 65 pass, 0 fail
```

Runtime is ~5–9s, dominated by the live network tests against `bolls.life`. Network tests hit `bolls.life` live and self-skip via `t.skip("bolls.life unreachable")` when a `NetworkError` is raised. A green run with skipped network tests is still a valid green run.

---

## 3. Requirements

- **Node.js >= 18** (declared in `package.json`).
- **Recommended: Node.js >= 22.** Node 18 and 20 are both end-of-life; 22 is maintenance LTS and 24 is active LTS. CI still runs the EOL versions — see §10.
- npm 9+ (ships with Node 18+).
- No runtime dependencies. No database, no build step, no bundler.
- Network access is optional — required only for non-KJV translations.

---

## 4. How to run it

### 4.1 From a local checkout

```bash
cd /home/neo/Projects/JESUS_CLI
npm install     # no runtime deps; prepares the workspace and lockfile
npm test        # 65 tests
```

Run directly through Node:

```bash
node src/cli.js read "John 3:16"
node src/cli.js search "faith"
node src/cli.js today
node src/cli.js --help
```

Or via the npm script:

```bash
npm run start -- read "John 3:16"
```

### 4.2 As a linked global command

```bash
cd /home/neo/Projects/JESUS_CLI
npm link
Jesus read "John 3:16"
```

`npm link` writes into your global npm prefix, which may require elevated permissions. `npm link --no-audit --no-fund` avoids a needless network round-trip on a zero-dependency project.

To unlink: `npm unlink -g Jesus-cli`.

### 4.3 From npm (after publishing)

```bash
npm install -g jesus-cli
Jesus read "John 3:16"
```

> The package has not been published yet. Its current `name` field (`Jesus-cli`) is rejected by npm for new packages — npm requires lowercase. It must be renamed to `jesus-cli` before the first publish; see §10-E.

### 4.4 Environment variables

| Variable | Effect |
| --- | --- |
| `NO_COLOR` | Any non-empty value disables ANSI color output. |
| `TERM=dumb` | Disables color output. |
| `XDG_DATA_HOME` | Overrides the Linux data directory (default `~/.local/share`). |
| `APPDATA` | Overrides the Windows data directory (default `~/AppData/Roaming`). |
| `JESUS_CLI_DATA_DIR` | Overrides the data directory outright, for tests and CI. Takes precedence over `XDG_DATA_HOME` and `APPDATA`. |

macOS always uses `~/Library/Application Support`.

### 4.5 Piping and scripting

Output is plain text on stdout, one verse per line, in the format:

```
John 3:16 - For God so loved the world, that he gave his only begotten Son... (KJV)
```

Errors go to stderr with exit code 1. Early-closing pipes (`| head -1`) are handled cleanly — the process exits 0 without an EPIPE stack trace.

### 4.6 Releasing

The full release guide — preconditions, the verification procedure, versioning policy, and
the tag-timing recommendation — lives in [MILESTONES.md](MILESTONES.md) under
"Release guide". That file is git-ignored, so the condensed version is repeated here for
anyone working from a fresh clone.

**The user-facing promise, which every release must make work:**

```bash
npm install --global jesus-cli
Jesus random
```

The command is capitalised `Jesus` on purpose (decision D9 in [MILESTONES.md](MILESTONES.md)).
The *package* name is lowercase `jesus-cli` because npm requires it. Users who prefer
lowercase can use `npx jesus-cli random` — no second bin entry is needed or wanted.

**Preconditions before the first publish:**

| Blocker | Fix |
| --- | --- |
| Package name `Jesus-cli` is rejected by npm (mixed case) | Rename to `jesus-cli` |
| No `LICENSE` | Add the MIT text |
| No npm metadata | Add `license`, `repository`, `author`, `keywords`, `homepage`, `bugs` |
| `docs/` not packaged | Add `"docs"` to `files` |
| `npm publish --provenance \|\| echo "…"` swallows auth failures | Tolerate only `EPUBLISHCONFLICT` |

**Procedure:**

1. `npm test` — must be green.
2. `npm pack --dry-run` — inspect the tarball contents.
3. `npx validate-npm-package-name jesus-cli` — must report `validForNewPackages: true`.
4. `npm install --global . && Jesus random` — verify the real user journey locally, then uninstall.
5. `git tag -a v0.1.0 -m "Release v0.1.0" && git push origin main --tags` — this triggers `.github/workflows/release.yml`.
6. Publish is a separate workflow job, gated on the repository variable `PUBLISH_TO_NPM=true`.
7. `npm view jesus-cli versions` and `npm install --global jesus-cli && Jesus random` — verify the published package.

**Tag timing:** do **not** tag before M11. The package cannot be published until the name,
the LICENSE, and the metadata exist, and the current release workflow turns a publish
failure into a green build — so an early tag produces a release that looks successful and
installs nothing. Cut `v0.1.0` immediately after M11, then `v0.2.0` after M8–M10, and hold
`v1.0.0` until the TUI exists.

---

## 5. Repository layout

```
.
├── data/
│   └── kjv.json              # bundled KJV: 66 books, 1,189 chapters, 31,102 verses (4.7 MB)
├── docs/
│   ├── BUILD_GUIDE.md        # this file
│   └── MILESTONES.md         # M7–M12 reference (git-ignored, local only)
├── src/
│   ├── cli.js                # entry point: flag parsing, dispatch, error taxonomy
│   ├── args.js               # flag parser (--key value, --key=value, booleans, --)
│   ├── context.js            # resolves translation / theme / limit for a command
│   ├── errors.js             # typed error classes
│   ├── logger.js             # stdout/stderr writers + EPIPE handling
│   ├── theme.js              # ANSI palettes, NO_COLOR / TTY detection
│   ├── version.js            # reads version from package.json
│   ├── api/
│   │   ├── bolls.js          # bolls.life HTTP client + HTML stripping
│   │   ├── resolver.js       # facade: KJV | network | cache routing
│   │   ├── translations.js   # the 17-code verified translation registry
│   │   └── types.js          # JSDoc typedefs (Verse, Reference, ParsedArgs, ...)
│   ├── commands/
│   │   ├── index.js          # command registry
│   │   ├── read.js           # read <reference>
│   │   ├── search.js         # search <query>
│   │   ├── random.js         # random
│   │   ├── today.js          # today
│   │   ├── config.js         # config list | get | set
│   │   └── output.js         # shared printing helpers
│   ├── data/
│   │   ├── books.js          # 66-book catalog, aliases, bolls ids
│   │   ├── kjv.js            # bundled-KJV reader, search index, random/today
│   │   └── reference.js      # reference parser
│   └── store/
│       ├── cache.js          # on-disk translation cache (atomic writes)
│       └── state.js          # persistent settings (state.json)
├── test/                     # node:test suites, one file per layer
├── .github/workflows/         # ci.yml, release.yml
└── package.json
```

---

## 6. Architecture and data flow

### 6.1 Layers

```
CLI (src/cli.js)
  ├─ arg parser (src/args.js)      flags → { command, positionals, flags }
  ├─ context (src/context.js)      translation/theme/limit: flag → state → default
  ├─ commands (src/commands/*)     one module per command
  ├─ theme layer (src/theme.js)    ANSI palettes keyed by the resolved theme;
  │                                color only when stdout is a TTY and
  │                                NO_COLOR / TERM=dumb are absent
  ├─ data layer (src/data/*)       bundled KJV, offline, always available
  └─ resolver facade (src/api/resolver.js)   ← WIRED IN as of M7
       ├─ KJV source (src/data/kjv.js)   bundled, offline
       ├─ Bolls API (src/api/bolls.js)   other translations, over the network
       └─ disk cache (src/store/cache.js) checked before the API, written after
```

### 6.2 Request flow (implemented in M7)

1. CLI parses the flags and resolves the translation (flag → state → default `KJV`).
2. The command asks the resolver for a verse, chapter, range, or search hit.
3. Resolver checks: is the translation KJV?
   - **Yes** → read from the bundled JSON. Fully offline.
   - **No** → look for a cached chapter on disk.
4. On a cache miss → fetch from the Bolls API, strip HTML, write through to the cache atomically, return.
5. The theme layer paints the result for TTY output.

`today` is the one command with a translation-specific path: the verse is selected
deterministically from the **local** calendar date, then the KJV reference is looked up in
the requested translation. If that lookup fails, the resolver falls back to the KJV text
and reports the fallback on stderr — it is never silent.

### 6.3 Cache layout

```
<dataDir>/jesus-cli/translations/<TRANSLATION>/
  .complete
  books.json
  <bollsId>_<chapter>.json
```

> **As of M7 (decision D3) the cache is namespaced under the app directory**, alongside
> `state.json`. Earlier revisions of this guide said `<dataDir>/translations/…`; that was
> the old layout. The old location is migrated automatically on first use.

Rules:

- `dataDir` defaults per platform: Linux/macOS `~/.local/share`, Windows `%APPDATA%`; override with `XDG_DATA_HOME`, or with `JESUS_CLI_DATA_DIR` to bypass the platform logic entirely.
- The legacy `<dataDir>/translations/` tree is moved to the namespaced path once, on the first cache access after upgrading.
- Chapter files are written atomically (`*.tmp` then `rename`).
- Only files matching `/^\d+_\d+\.json$/` count as cached chapters; `books.json`, `.complete`, and stray temp files never trigger a cache hit.
- Detection is a deliberate fix over the Rust original, which conflated `books.json`/`.complete` with real chapters.
- A corrupt or non-array chapter file is treated as a cache miss, not a crash, and is refetched.
- The `.complete` marker asserts a whole translation is mirrored; a missing chapter under a `.complete` marker clears the marker on next read.

### 6.4 State file

```
<dataDir>/jesus-cli/state.json
```

Default shape (`src/store/state.js:5`):

```json
{
  "bookIndex": 0,
  "chapter": 1,
  "scrollPosition": 0,
  "activePanel": 0,
  "theme": "Slate",
  "translation": "KJV"
}
```

- Missing or corrupt state silently falls back to defaults.
- Write failures are swallowed on purpose: a failed save must never crash or block the reader.
- `bookIndex`, `chapter`, `scrollPosition`, and `activePanel` are placeholders for the future TUI.
- **Nothing currently calls `state.save()`** — see §10.

### 6.5 Theme and color rules

- Palettes live in `src/theme.js`; `Slate` is the default, `Midnight` is the alternative.
- Color is emitted only when the stream is a TTY **and** `NO_COLOR` is unset/empty **and** `TERM` is not `dumb`.
- Piped output is always plain. Unknown style or theme names fall back to `Slate` rather than throwing.

---

## 7. Testing strategy

- Runner: the built-in `node:test` runner. No test framework dependency.
- Suites are split by layer: `cli`, `data`, `resolver`, `bolls`, `cache`, `state`, `theme`.
- The CLI suite spawns the real binary with `spawnSync` and asserts on **stdout, stderr, and exit code separately** — this is the pattern to follow for any new command.
- Network tests are written to fail soft: they catch `NetworkError` and call `t.skip("bolls.life unreachable")`.
- Temp directories use `mkdtemp(join(tmpdir(), "prefix-"))` so parallel runs never collide.

```bash
npm test                        # everything
node --test test/cli.test.js    # one suite
node --test --test-name-pattern="search"   # one behavior
```

Conventions to keep:

1. One behavior per test; the test name states the behavior, not the function.
2. Assert on the user-visible contract (output text, exit code), not on internals.
3. Every new command needs: a happy path, a usage error, and an unknown-input error.
4. Every new file-writing path needs a corrupt-file test.

---

## 8. CI and release

### CI (`/.github/workflows/ci.yml`)

Runs on push to `main` and on every pull request:

1. Matrix over Node 18 / 20 / 22.
2. `node src/cli.js --version` smoke test.
3. `npm test`.
4. `npm pack --dry-run` to catch packaging breakage.

### Release (`/.github/workflows/release.yml`)

Triggered by a `v*` tag or manual dispatch:

1. Verifies the tag matches `package.json`'s version.
2. Runs the test suite.
3. `npm pack` and creates a GitHub Release with generated notes.
4. Publishes to npm **only** when the repository variable `PUBLISH_TO_NPM` is `true`, with npm provenance enabled.

---

## 9. Development practices

These are the rules this project follows. Deviating from them needs a good reason in the PR description.

1. **Zero runtime dependencies is a feature, not an accident.** Before adding a dependency, weigh it against the install cost for every user. The current core needs none.
2. **Typed errors, always.** `src/errors.js` defines the error vocabulary (`UsageError`, `ReferenceParseError`, `BookNotFoundError`, `VerseNotFoundError`, `CacheCorruptError`, `NetworkError`). New failure modes get a new class, not a bare `Error`.
3. **Errors go to stderr, results go to stdout.** Exit code 1 for user errors, 0 for success. This keeps `Jesus read ... | jq` viable.
4. **Never crash on bad input.** Corrupt cache files, corrupt state, missing books, and unreachable networks must degrade, not throw raw.
5. **One file, one responsibility.** `data/` knows nothing about the network; `api/` knows nothing about the CLI; `store/` knows nothing about both.
6. **Offline first.** KJV must always work with no network. The network is an enhancement layer.
7. **Atomic writes for anything on disk.** Write to `*.tmp`, then `rename`.
8. **Test the contract, not the implementation.** CLI tests assert on stdout/stderr/exit code.
9. **Keep the data layer pure.** `src/data/*` takes no I/O beyond reading the bundled JSON.
10. **Document what is verified, not what is planned.** Status sections in this guide and the README must reflect what actually runs.
11. **Conventional Commits.** `feat:`, `fix:`, `docs:`, `ci:`, `refactor:`, `test:`. Scoped form `feat(api):` is in use.
12. **Milestone branches.** `milestone/<n>-<slug>` and `feature/<slug>` off `main`; PR back into `main`.
13. **Ship behind a flag.** New capabilities land disabled or opt-in, then get promoted.

### Tooling — **added in M10**

Quality is now machine-enforced. The conventions above are checked by CI, not by review.

| Tool | Version | Config | Command |
| --- | --- | --- | --- |
| ESLint | `^10.13.0` | `eslint.config.js` (flat) | `npm run lint` |
| Prettier | `^3.9.10` | `.prettierrc.json` | `npm run format:check` |
| TypeScript | `^5.9.3` | `tsconfig.json` | `npm run typecheck` |

All three, plus the tests, run under `npm run check`.

**ESLint** uses `js.configs.recommended` plus `no-unused-vars`, `eqeqeq`, `prefer-const`,
and `no-var`, with `globals.node` for the runtime globals. `no-control-regex` is off for
`test/`, where matching real ANSI escape sequences is the point of the assertion.

**Prettier** uses `printWidth: 100`. The default of 80 was rejected: the existing source
already ran to 132 characters, and 100 produces a reformat diff roughly 2.5x smaller
(172 changed lines against 440). `data/` is ignored — the bundled KJV is a 4.7 MB
generated file that must never be reformatted.

**TypeScript** runs in `checkJs` mode over `src/` and `test/`, with `strict: true` and
`noImplicitAny: false`. That combination is deliberate:

- `strict: true` gives `strictNullChecks`, which is the part that catches real bugs.
- `noImplicitAny: false` avoids demanding a full parameter type on every function on day
  one. Turning it on later is a single-line change, and the remaining 163 errors are a
  known, tractable backlog.
- The project stays plain JavaScript. `src/api/types.js` holds the JSDoc typedefs; a
  full `.ts` migration remains a later decision.

The type checker earned its place immediately: it found 7 real defects that the test
suite passed straight over, including two `warn(...)` calls whose third parameter was
never declared in the JSDoc, and a `BOOKS` constant whose inferred type was
`string | number | string[]` — a bug waiting to happen in the alias lookup.

---

## 10. Known gaps and technical debt

Ordered by impact. Each item is reproducible against the current tree. **Status: M7 closed
A, B, C, G, and I**, and partially closed D and H.

### A. The CLI never reaches the resolver — **fixed in M7**

`src/cli.js:6` imports `getVerses, randomVerse, search, verseOfTheDay` from `./data/kjv.js`. The resolver at `src/api/resolver.js` is never imported by any entry point.

Consequences:

- Every non-KJV translation is unreachable, despite the README advertising "additional translations (WEB, etc.) via the Bolls API".
- The cache is never written or read by the CLI.
- The `(KJV)` label in `printVerse` (`src/cli.js:25`) is hardcoded and would be wrong for any other translation.
- The resolver and cache suites pass, which gives false confidence: they test a component the product does not use.

**Fix:** route all reads through `resolver.getVerse(s)` with a resolved translation, and make the version label dynamic.

> **Fixed in M7.** The resolver is now the only path to scripture, the label is dynamic, and
> the cache is read before the network and written after a fetch.

### B. State is never written — **fixed in M7**

`state.save()` is never called anywhere in `src/`. `state.json` does not exist on a fresh machine, so `load()` always returns `DEFAULT_STATE`.

Consequences:

- `theme` is permanently `Slate`; the theme layer is inert.
- `translation` is permanently `KJV`.
- The state milestone shipped as read-only code with no writer and no user-facing way to change a value.

**Fix:** add a `config` command (`config set translation WEB`, `config set theme Midnight`, `config get`, `config list`) and persist on change.

> **Fixed in M7.** The `config` command writes state atomically. A test asserts that a
> `--translation` flag never creates a state file (decision D4).

### C. The cache is not namespaced under the app directory — **fixed in M7**

`src/store/cache.js:10` writes to `<dataDir>/translations/…` while state goes to `<dataDir>/jesus-cli/state.json`. Two apps sharing an `XDG_DATA_HOME` can collide on `translations/`, and a user clearing app data will not clear the cache.

**Fix:** move the cache under `<dataDir>/jesus-cli/translations/` and migrate existing directories on first read.

> **Fixed in M7** (decision D3), with a one-time automatic migration of the legacy path.

### D. No machine-readable output — **partially fixed in M7; `--json` stays in M8**

There is no `--json`, `--format json`, or `--no-color` flag. The README claims suitability for "pipes and scripting", but a dev audience needs structured output to compose with `jq`, editors, and bots.

**Fix:** `--json` on every read/search/random/today command, emitting a stable schema (`{ reference, translation, verses: [...] }`).

> **Partially fixed in M7:** `--no-color` now exists. `--json` is deliberately deferred to
> M8 (decision D5) — the argument parser from M7.1 makes adding it a small change.

### E. Publishing blockers — **high**

- No `LICENSE` file, although the README states MIT.
- `package.json` has no `license`, `repository`, `author`, `keywords`, `homepage`, or `bugs` fields.
- `files` does not include `docs/`.
- The release workflow's `npm publish --provenance || echo "…"` swallows *every* publish failure, including authentication and permission errors. It should only tolerate the specific "already published" conflict.
- The package name `Jesus-cli` is mixed case and **cannot be published**. npm rejects new packages whose name contains capital letters. Verified with `validate-npm-package-name`:

  ```
  "Jesus-cli" -> { validForNewPackages: false, warnings: ["name can no longer contain capital letters"] }
  "jesus-cli" -> { validForNewPackages: true }
  ```

  Rename to `jesus-cli`. The `bin` key stays capitalised as `Jesus` — that is a deliberate product decision (D9), not an oversight, and it should not be "corrected" to lowercase.
- The `bin` script `src/cli.js` is not marked executable in git; npm sets the bit on install, but `git update-index --chmod=+x src/cli.js` is safer.

### F. Reference parser is too strict for real-world input — **medium**

Verified rejections:

| Input | Result |
| --- | --- |
| `1co 13:4-7` | rejected — `1co` is not an alias (`1 cor`, `1cor`, `1 co` are) |
| `Jn 3.16` | rejected — dot separator unsupported |
| `John 3:16-4:2` | rejected — cross-chapter ranges unsupported |
| `John 3:16b` | rejected — suffix letters unsupported |

**Fix:** add compact aliases (`1co`, `2co`, `1th`, `1ti`, `1pe`, …), accept `.` as a chapter/verse separator, and support cross-chapter ranges.

### G. `today` is computed from the UTC date — **fixed in M7**

`src/data/kjv.js:136` uses `date.toISOString().slice(0, 10)`. Users east or west of UTC get the previous or next day's verse for up to 14 hours per day.

**Fix:** derive the date from local time components, not ISO/UTC.

> **Fixed in M7.** `localDateKey()` uses the local `getFullYear`/`getMonth`/`getDate`.
> This is not theoretical: the development machine is `Africa/Nairobi` (UTC+3), where the
> old code would have shown tomorrow's verse from 21:00 UTC onward.

### H. Search is hard-capped at 50 with no pagination — **partially fixed in M7**

`MAX_SEARCH_RESULTS = 50` (`src/api/resolver.js:20`) truncates silently. Searching `the` always returns the same first 50 verses starting at Genesis 1:1, and there is no way to see further.

**Fix:** add `--limit` and `--offset`, and report the total match count.

> **Partially fixed in M7:** `--limit` / `-n` now exists and is threaded through the
> resolver. `--offset` and the total match count remain for M8.

### I. Unknown errors lose all diagnostic context — **fixed in M7**

`src/cli.js:86` prints only `error.message`. A genuine bug surfaces as `x is not a function` with no stack.

**Fix:** branch on error type. Known errors → clean message, exit 1. Unknown errors → stack trace and exit code 70 (`EX_SOFTWARE`), with a `--debug` flag to force the stack for known errors too.

> **Fixed in M7.**

### J. Reference resolution is O(n) and startup is memory-heavy — **low, but user-visible**

`getVerses` parses the entire 4.7 MB JSON (~100 ms) and `search` builds a second in-memory index with a lowercased copy of every verse, roughly doubling resident memory.

**Fix:** split the KJV data per book, or store it pre-indexed, and lazily build the search index only when `search` runs.

### K. No linter, formatter, or type checker — **fixed in M10**

See §9. The stray indentation artifact at `src/logger.js:17` is gone, and CI now fails on
a lint, format, or type error.

### L. Node version support is stale — **fixed in M10**

CI runs Node 18 / 20 / 22; 18 and 20 are both EOL. `engines` still says `>=18`.

**Fix:** `engines: { node: ">=22" }`, CI matrix `[22, 24]`.

> **Fixed in M10.** `engines` is `>=22`, CI runs `[22, 24]`, and the release workflow
> moved from Node 20 to Node 22. `package-lock.json` is now committed and CI installs
> with `npm ci`.

### M. `main` is behind the feature branches — **process**

`main` is at `ea028a5`. The state, cache, and theme work (`a762edb`, `9502b4a`) lives only on `feature/state-cache-theme` and `origin/state-cache` and has never been merged. `main`'s README and this guide still describe the pre-cache milestone, and `main`'s guide contains a stale path (`/home/neo/Projects/JESUS_CLI/node`).

**Fix:** merge the feature branch into `main` and re-verify.

### N. KJV data provenance is undocumented — **legal/medium**

`data/kjv.json` ships 31,102 verses with no attribution, source, or license note. KJV is public domain in most of the world but not universally, and this file becomes a shipping liability the moment a non-public-domain translation is added.

**Fix:** document the source and terms in `data/README.md` and reference it from the package.

---

## 11. Refined roadmap

Milestones 1–6 (core data layer, `read`, `search`/`random`/`today`, Bolls API, state, cache, themes) are code-complete. The problem is not missing features — it is that the completed features are **not connected to the user**.

The next milestones are therefore ordered by *user-visible value*, not by layer.

### Milestone 7 — Wire the layers (make existing features real) — **complete**

**Goal:** everything already built becomes reachable from the command line.

- Route all reads/searches through `src/api/resolver.js`.
- Resolve the translation from `--translation` → `state.translation` → `KJV`.
- Make the version label dynamic instead of the hardcoded `(KJV)`.
- Add `config get` / `config set` / `config list`, and call `state.save()`.
- Add `--translation`, `--theme`, `--no-color`, and `--limit` flags.
- Fix `today` to use the local date.

**Exit criteria:** `Jesus --translation WEB read "John 3:16"` works and caches; `Jesus config set theme Midnight` changes the color scheme for the next invocation; the cache directory contains the fetched chapter.

> **Complete.** All exit criteria met and verified manually; the test suite grew from 65 to
> 130 tests. Decisions D1–D4 are recorded in [MILESTONES.md](MILESTONES.md) and implemented.
> `--json` was deliberately deferred to M8 (decision D5).

### Milestone 8 — Developer-grade output

**Goal:** make the CLI composable.

- `--json` on every read/search/random/today command, with a documented, stable schema.
- Document the schema in `docs/` and version it.
- Add `Jesus books` — list the 66 books with aliases and chapter counts.
- Improve search: `--offset`, total match count, and per-translation search over the network.

**Exit criteria:** `Jesus read "John 3:16" --json | jq -r '.verses[0].text'` works.

> Note: `--limit` already landed in M7; only `--offset` and the total match count remain.

### Milestone 9 — Reference parsing and lookup quality

**Goal:** accept what developers actually type.

- Compact aliases (`1co`, `1th`, `1ti`, `1pe`, `2jn`, …).
- Accept `.` as a chapter/verse separator (`Jn 3.16`).
- Support cross-chapter ranges (`John 3:16-4:2`).
- Fuzzy book suggestions on a failed lookup ("Did you mean 1 Corinthians?").
- Chapter/verse navigation helpers: `--next`, `--previous`.

**Exit criteria:** the §10-F table resolves cleanly.

### Milestone 10 — Engineering baseline

**Goal:** make quality machine-enforced.

- ESLint flat config + Prettier + `npm run lint` / `npm run format` / `npm run typecheck`.
- `tsc --noEmit --checkJs` over the existing JSDoc typedefs.
- Add ESLint + Prettier + typecheck to CI, alongside the existing test and pack steps.
- Refresh the Node support matrix to 22/24 and set `engines: ">=22"`.
- Add `package-lock.json` and commit it.
- Add `JESUS_CLI_DATA_DIR` as an explicit override for the data directory (useful in tests and CI).

**Exit criteria:** CI is red on a formatting or type error.

### Milestone 11 — Ship it

**Goal:** publishable and trustworthy.

- Add `LICENSE`, and the `license`/`repository`/`author`/`keywords`/`homepage`/`bugs` fields.
- Reconcile the package name to lowercase (`jesus-cli`). The executable stays `Jesus` — decision D9.
- Add `docs/` to `files`.
- Fix the release workflow's publish error handling to tolerate only the "already published" conflict.
- Document KJV data provenance in `data/README.md`.
- Add `CHANGELOG.md` driven by release notes.

**Exit criteria:** `npm publish --dry-run` produces a clean, correctly-named tarball, and `npm install -g jesus-cli` yields a working `jesus` command.

> The full release procedure, versioning policy, and tag-timing recommendation are in
> [MILESTONES.md](MILESTONES.md) → "Release guide", with a condensed copy in §4.6.

### Milestone 12 — The terminal experience

**Goal:** the TUI, done on a solid base.

- **Re-evaluate the library before writing a line.** `blessed` is effectively unmaintained. Prefer a maintained fork (`neo-blessed`) or a modern alternative (`terminal-kit`, or Ink if a React model fits).
- Scope: book/chapter navigation pane, verse pane, search pane, translation picker, and a "continue reading" position persisted to `state.json` (which finally gives `bookIndex`, `chapter`, and `scrollPosition` a purpose).
- Keep the plain-text commands as the stable, scriptable interface; the TUI is an additional surface, never a replacement.

**Exit criteria:** the TUI is optional and the CLI remains fully functional with the TUI disabled.

### Suggested sequencing

```
7 (wire layers) → 8 (dev output) → 9 (parsing) → 10 (baseline) → 11 (ship) → 12 (TUI)
```

Milestone 10 (lint/format/types) can be pulled forward to immediately after 7 — it protects every change that follows, and the tree is small enough that adoption is cheap today.

The full specification of each milestone — scope, implementation steps, test plan, risks, and exit criteria — lives in [MILESTONES.md](MILESTONES.md), which is the reference point to consult before starting any of them.

---

## 12. Definition of done

A milestone is done when all of the following hold:

- [ ] The feature is reachable from the command line, not just from a module.
- [ ] Tests exist for the happy path, the usage error, and the unknown-input error.
- [ ] Errors print to stderr with a non-zero exit code; results print to stdout.
- [ ] Offline (KJV) behaviour is unaffected by the change.
- [ ] Corrupt or missing on-disk data degrades instead of crashing.
- [ ] `npm test` passes, and `npm pack --dry-run` is clean.
- [ ] The README's status section and §2 of this guide are updated to match reality.
- [ ] The commit follows Conventional Commits.

---

## Appendix — deviations from the Rust original

- `today` is deterministic per calendar date rather than time-of-day based.
- Bolls has no verse-range endpoint, so ranges resolve by fetching the chapter and filtering.
- WEB (and translations with deuterocanonical books) return Bolls ids above 66; `getBookByBollsId` falls back to `#<id>` where the book catalog has no match.
- The cache deliberately separates real chapter files from `books.json` and `.complete`; the Rust original conflated them.
- The Node build ships with **no runtime dependencies** and **no Rust code** — the original is reference material only.
