# Milestone Reference — M8 to M12

Canonical reference for the remaining milestones of Jesus CLI. This document is the **point of reference** for scope, sequencing, and exit criteria. It is written to be re-read before each milestone starts, and updated when a decision changes.

> This file ships with the package, alongside the build guide and the changelog. Anything that must reach users — the README, the JSON schema, the release notes — belongs in a tracked file rather than only here.

- [Build guide](BUILD_GUIDE.md) — how to run, test, and ship; architecture; known gaps.
- [README](../README.md) — user-facing overview.

**Status key:** `Planned` → `In progress` → `In review` → `Complete`.

| #   | Milestone                                | Status       | Depends on | Value                 |
| --- | ---------------------------------------- | ------------ | ---------- | --------------------- |
| M7  | Wire the layers into the CLI             | **Complete** | M1–M6      | Unlocks M8–M12        |
| M8  | Developer-grade output                   | **Complete** | M7         | High                  |
| M9  | Reference parsing and lookup quality     | Planned      | M7         | Medium                |
| M10 | Engineering baseline (lint/format/types) | Complete     | M7         | Medium — protects M8+ |
| M11 | Ship to npm                              | **Complete** | M8, M10    | High                  |
| M12 | Terminal UI                              | Planned      | M7–M11     | High, but last        |

> M7 wired the existing data, cache, and configuration layers into the CLI. M8 now makes that interface composable; M9 remains the next CLI milestone before the TUI.

---

## How to use this document

1. Before starting a milestone, re-read its section and the decisions it depends on.
2. Each milestone ends with **exit criteria** that are objective and testable. A milestone is not complete until every box is ticked.
3. **Decisions** are recorded in the Decision log at the bottom. Superseded decisions are struck through, never deleted — the reasoning is the valuable part.
4. When scope changes, update this file in the same PR as the code.

### Milestone template

Every milestone in this project is specified with the same eight fields:

- **Goal** — one sentence, user-visible.
- **Why now** — the reason for its position in the order.
- **Scope** — what is in.
- **Out of scope** — what is deliberately not in, and where it goes instead.
- **Implementation** — ordered, independently testable steps.
- **Test plan** — what must be covered.
- **Risks** — what could go wrong, and the mitigation.
- **Exit criteria** — the definition of done.

---

## M7 — Wire the layers into the CLI

**Status:** **Complete.** Implemented and verified on 2026-10-21. 130 tests pass (up from 65).

### Goal

Make the already-built Bolls API, translation cache, state persistence, and theme layer reachable from the command line, so that `Jesus --translation WEB read "John 3:16"` works and `Jesus config set theme Midnight` persists.

### Why now

1. **Four completed milestones are currently invisible.** The resolver (`src/api/resolver.js`), the Bolls client, the disk cache, and the theme layer are implemented and unit-tested — but `src/cli.js:6` imports from `./data/kjv.js` directly. No user action can reach any of them.
2. **The test suite gives false confidence.** `test/resolver.test.js` and `test/cache.test.js` pass, but they exercise a component the product does not use. A green CI run does not currently mean "the advertised features work."
3. **The README advertises features that do not exist.** It claims WEB translations, the cache, state persistence, and themes as working. That is a credibility problem for a project whose entire pitch is developer trust.
4. **Every later milestone is cheaper once the seam exists.** `--json` (M8), a translation picker (M12), and the TUI all need one well-defined path from a command to a verse. Building it twice is the failure mode this milestone exists to prevent.
5. **It is the cheapest possible moment to fix the debt.** The cache path and the state writer can be corrected _before_ the CLI starts writing files into users' home directories.

### Scope

In scope:

- A real argument parser that supports flags alongside positionals.
- All reads (`read`, `search`, `random`, `today`) routed through the resolver.
- Translation selection: `--translation <CODE>` flag, falling back to `state.translation`, then `KJV`.
- A bundled list of supported translation codes, with a clear local error for unsupported codes.
- A `config` command (`get`, `set`, `list`) that actually persists state via `state.save()`.
- Theme selection: `--theme <NAME>` flag, falling back to `state.theme`, then `Slate`. Plus `--no-color`.
- `today` computed from the **local** calendar date, not UTC.
- A clear error taxonomy: known errors → clean message + exit 1; unexpected errors → stack trace + exit 70.
- The translation cache moved under the app directory, with a one-time migration of the old location.
- A `JESUS_CLI_DATA_DIR` environment override for the data directory.

Out of scope (tracked elsewhere):

- `--json` output → **M8**.
- Search pagination and total counts → **M8**.
- Book catalog listing (`Jesus books`) → **M8**.
- Compact aliases, dot separators, cross-chapter ranges → **M9**.
- Linting, formatting, type checking → **M10**.
- Package renaming, LICENSE, npm metadata → **M11**.
- The TUI → **M12**.

### Implementation

Five sub-phases, each independently reviewable and mergeable. Do not start a phase until the previous one is green.

#### M7.1 — Argument parsing

**New file:** `src/cli/args.js`

- `parseArgs(argv)` returns `{ command, positionals, flags }`.
- Supports `--key value`, `--key=value`, boolean `--no-color`, and a `--` terminator that forces everything after it to be positional.
- **Must preserve existing behaviour:** `Jesus read John 3:16` (unquoted) arrives as three argv entries and must still resolve to the reference `John 3:16`. This is done by joining positionals with a single space, exactly as the current code does.
- **Must not swallow flags into references.** The current `args.join(" ")` would turn `Jesus read John 3:16 --translation WEB` into the reference `John 3:16 --translation WEB`. The parser is what prevents this.
- `--` terminator handles `Jesus search "--help"`, where the query legitimately begins with dashes.
- Unknown flags produce a usage error rather than being ignored.
- **No behaviour change to any existing command** in this phase. This phase is pure plumbing.

**Exit criteria for M7.1**

- [ ] `parseArgs` is unit-tested: long flags, `=` form, boolean flags, `--` terminator, unknown flags, empty argv.
- [ ] Every existing CLI test still passes unchanged.
- [ ] `Jesus read John 3:16` still works (unquoted, multi-positional).
- [ ] `Jesus read "John 3:16" --translation WEB` yields reference `John 3:16` and flag `translation=WEB`.

#### M7.2 — Resolver wiring (the headline change)

**Changed:** `src/cli.js`, `src/api/resolver.js`
**New file:** `src/api/translations.js`

- `cli.js` stops importing from `src/data/kjv.js` and imports from `src/api/resolver.js` instead.
- Translation resolution order: `--translation` flag → `state.translation` → `KJV`.
- The hardcoded `(KJV)` label in `printVerse` (`src/cli.js:25`) becomes the resolved translation name.
- `src/api/translations.js` holds the bundled allowlist of supported codes (see D2), with `normalize()`, `isSupported()`, and `list()`.
- `resolver.getChapter` distinguishes "unknown translation" from "chapter not found" — today a bogus code returns HTTP 200 with an empty array from Bolls, which currently surfaces as a misleading `Chapter not found` error.
- `resolver.getRandomVerse` currently swallows network failures and silently returns a **KJV** verse when the user asked for another translation. It must warn on stderr instead of silently substituting.
- **KJV output must be byte-identical before and after this change.** The resolver's KJV branch calls the same underlying functions, and a regression test locks this down.

**Exit criteria for M7.2**

- [ ] `Jesus read "John 3:16"` produces byte-identical output to the pre-change CLI.
- [ ] `Jesus --translation WEB read "John 3:16"` returns the WEB text and labels it `(WEB)`.
- [ ] `Jesus --translation WEB read "John 3:16"` twice in a row: the second call is served from the cache and writes no network request (assert with a stubbed fetch).
- [ ] `Jesus --translation ZZZ read "John 3:16"` fails with an "unknown translation" message naming the supported codes, exit 1.
- [ ] `Jesus read "John 3:16"` with no network access still succeeds.

#### M7.3 — Config command

**New file:** `src/cli/commands/config.js`

- `Jesus config list` — print all settings.
- `Jesus config get <key>` — print one setting.
- `Jesus config set <key> <value>` — validate, persist via `state.save()`, print the new value.
- Supported keys: `translation`, `theme`. Reject unknown keys with a helpful message listing the valid ones.
- Validation: `theme` must be a palette defined in `src/theme.js`; `translation` must be in the bundled allowlist.
- `config set` is the only way state is written — it is explicit and reviewable.

**Exit criteria for M7.3**

- [ ] `Jesus config set theme Midnight` then `Jesus config list` shows `Midnight`.
- [ ] `Jesus config set theme Neon` fails with a list of valid themes, exit 1.
- [ ] `Jesus config set translation WEB` then `Jesus read "John 3:16"` uses WEB without a flag.
- [ ] The state file is written to `<dataDir>/jesus-cli/state.json` and survives a new process.
- [ ] `JESUS_CLI_DATA_DIR` redirects both the state file and the cache, so the test suite never touches the developer's real data directory.

#### M7.4 — Correctness and robustness

**Changed:** `src/data/kjv.js`, `src/cli.js`, `src/errors.js`, `src/store/cache.js`, `src/store/state.js`

- **`today` uses the local date.** `src/data/kjv.js:136` currently uses `date.toISOString().slice(0, 10)`, which is UTC. Users east or west of UTC get the wrong day's verse for up to 14 hours a day. Switch to local date components. The existing test must be rewritten to construct dates in local time (`new Date(2026, 8, 23, 10, 0, 0)`) so it is timezone-independent.
- **Error taxonomy.** `src/cli.js:86` currently prints only `error.message`, so a genuine bug appears as `x is not a function`. Known error classes from `src/errors.js` → clean message, exit 1. Anything else → message + stack, exit **70** (`EX_SOFTWARE`). A `--debug` flag forces a stack trace for known errors too.
- **Cache path namespacing.** `src/store/cache.js:10` writes to `<dataDir>/translations/…` while state lives at `<dataDir>/jesus-cli/state.json`. Move the cache to `<dataDir>/jesus-cli/translations/…` and migrate any existing `<dataDir>/translations/` directory on first use. Do this _before_ the CLI starts writing to users' home directories.
- **Search `--limit`.** The parser from M7.1 makes this nearly free. Default stays 50.
- **Random-verse fallback warning.** Part of M7.2, verified here.

**Exit criteria for M7.4**

- [ ] `today` returns the same verse for two runs on the same local date, in a non-UTC timezone.
- [ ] A deliberately thrown unknown error prints a stack trace and exits 70; a `UsageError` prints one line and exits 1.
- [ ] The cache directory is `<dataDir>/jesus-cli/translations/<CODE>/`, and an existing `<dataDir>/translations/` is migrated automatically.
- [ ] `Jesus search faith --limit 5` returns at most 5 results.

#### M7.5 — Documentation and release readiness

- Update `README.md` and `docs/BUILD_GUIDE.md` to describe the now-working behaviour.
- Update the milestone table and decision log in this file.
- Verify `npm pack --dry-run` is clean and `npm test` is green.

### Test plan

M7 adds tests in every existing suite, following the conventions already established:

- `test/cli.test.js` — spawn the real binary and assert on stdout, stderr, and exit code separately. Add cases for every flag, every flag position (before the command, after the command, interleaved), the `--` terminator, and every new command.
- `test/resolver.test.js` — extend with translation-allowlist rejection, the KJV byte-identical regression, and cache-hit assertions.
- `test/data.test.js` — local-date `today`, in a forced non-UTC timezone.
- `test/cache.test.js` — the new namespaced path and the migration path.
- `test/state.test.js` — `config` round-trips against a temp data dir.
- New `test/args.test.js` — the parser in isolation.

**No test may touch the developer's real data directory.** Every test that touches disk must use `mkdtemp` and pass an explicit `dataDir`, or set `JESUS_CLI_DATA_DIR`.

Network tests keep the established pattern: catch `NetworkError`, call `t.skip("bolls.life unreachable")`.

### Risks and mitigations

| Risk                                                  | Impact                           | Mitigation                                                                                                                        |
| ----------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Wiring the resolver changes KJV output                | Core feature regression          | Byte-identical regression test, asserted before and after the change                                                              |
| Arg parsing breaks unquoted references                | Core feature regression          | Existing CLI tests must pass **unchanged** through M7.1; that is the acceptance gate                                              |
| Cache path move orphans existing caches               | Users re-download translations   | One-time automatic migration, covered by a test that starts from the old layout                                                   |
| `today` local-date change alters which verse is shown | Visible behaviour change         | Expected and intentional; document it in the README and in the release notes                                                      |
| Flags collide with search queries                     | Users cannot search for `--help` | `--` terminator, documented in `--help`                                                                                           |
| The allowlist drifts from what Bolls actually serves  | A valid translation is rejected  | The allowlist is a starting point, not a gate — unknown codes still reach the network, but the CLI warns rather than hard-failing |
| Scope creep into M8/M9                                | Milestone never finishes         | Out-of-scope list is explicit above and enforced by the exit criteria                                                             |

### Exit criteria

- [x] `Jesus --translation WEB read "John 3:16"` returns WEB text, labelled `(WEB)`.
- [x] The fetched chapter is cached on disk; the second run makes no network request.
- [x] `Jesus config set translation WEB` persists and changes the default for later commands.
- [x] `Jesus config set theme Midnight` persists and changes the colour scheme.
- [x] `Jesus --no-color` forces plain output even on a TTY.
- [x] `today` is stable within a local calendar day, in any timezone.
- [x] Known errors → one-line message, exit 1. Unexpected errors → stack trace, exit 70.
- [x] KJV output is byte-identical to the pre-M7 CLI.
- [x] The cache lives at `<dataDir>/jesus-cli/translations/`, and old locations migrate automatically.
- [x] Every existing test still passes; new tests cover every new behaviour.
- [x] `npm test` green (130/130), `npm pack --dry-run` clean.
- [x] README and BUILD_GUIDE describe the new behaviour accurately.
- [x] No test writes to the developer's real data directory.

### What was actually built

| File                      | Change                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/args.js`             | **New.** Flag parser: `--key value`, `--key=value`, booleans, short forms, `--` terminator.                                                         |
| `src/api/translations.js` | **New.** The verified 17-code translation registry.                                                                                                 |
| `src/context.js`          | **New.** Resolves translation, theme, and limit from flag → state → default.                                                                        |
| `src/commands/*.js`       | **New.** One module per command; `src/cli.js` is now a thin dispatcher.                                                                             |
| `src/cli.js`              | Rewritten. Reads through the resolver; dynamic `(TRANSLATION)` label; error taxonomy.                                                               |
| `src/api/resolver.js`     | Translation normalisation, `UnsupportedTranslationError`, `getVerseOfTheDay`, search `limit`, warning sink (`options.onWarn`), max-verse range fix. |
| `src/data/kjv.js`         | `localDateKey()` (local calendar, not UTC), `verseOfTheDayReference()`.                                                                             |
| `src/store/cache.js`      | Cache moved under `<dataDir>/jesus-cli/translations/`, with one-time migration of the legacy path.                                                  |
| `src/store/state.js`      | `JESUS_CLI_DATA_DIR` override, atomic `state.save()`.                                                                                               |
| `src/theme.js`            | `warning` style, `THEME_NAMES`, `normalizeTheme`, `isValidTheme`.                                                                                   |
| `src/errors.js`           | `UnsupportedTranslationError`.                                                                                                                      |
| `src/logger.js`           | `printWarning()`, theme-aware error output.                                                                                                         |

**Notable fix caught by the tests:** this machine's timezone is `Africa/Nairobi` (UTC+3). Under the old UTC-based `today`, a user would have seen _tomorrow's_ verse from 21:00 UTC onwards — the exact bug the local-date change removes. The old test encoded the UTC assumption and had to be rewritten with local-time constructors.

---

## M8 — Developer-grade output

**Status:** **Complete.** Implemented and verified on 2026-10-23.

**Goal:** Make the CLI composable with other tools.

**Why now:** The product targets developers, but today the only machine-readable contract is prose. Without structured output, "scriptable" means grepping sentences. This is the single highest-value feature for the target audience.

**Scope**

- `--json` on `read`, `search`, `random`, `today`, and `config list`, with a documented, versioned schema.
- `Jesus books` — the 66-book catalog with aliases and chapter counts.
- Search improvements: `--limit`, `--offset`, and the total match count.
- Document the JSON schema in `docs/` and treat it as a public API (version it, change it only in a major release).

**Out of scope:** the TUI (M12); changing the plain-text output format, which stays stable.

**Exit criteria**

- [x] `jesuschrist read "John 3:16" --json | jq -r '.data.verses[0].text'` works.
- [x] The schema is documented in `docs/JSON_SCHEMA.md`, with a version field.
- [x] `jesuschrist books --json` lists all 66 books with aliases.
- [x] Search pagination reports total matches in the searched source.
- [x] Plain-text output remains unchanged.

### What was implemented

- Versioned JSON envelopes for `read`, `search`, `random`, `today`, `books`, and `config list`; help and version also support JSON.
- `books` lists canonical order, aliases, and chapter counts.
- Search applies `--limit` and non-negative `--offset` and reports the total.
- Search totals identify their scope: bundled KJV, network results, complete cache, or locally cached chapters.
- CLI, resolver, and context tests cover JSON shapes, pagination, validation, and preserved text output.

---

## M9 — Reference parsing and lookup quality

**Status:** Planned.

**Goal:** Accept the references people actually type.

**Why now:** Verified rejections today: `1co 13:4-7` (compact alias missing), `Jn 3.16` (dot separator), `John 3:16-4:2` (cross-chapter range), `John 3:16b` (verse suffix). Each one is a support ticket waiting to happen, and the parser is the first thing every user touches.

**Scope**

- Compact aliases: `1co`, `2co`, `1th`, `2th`, `1ti`, `2ti`, `1pe`, `2pe`, `1jn`, `2jn`, `3jn`, `1kgs`, `2kgs`, `1ch`, `2ch`, `1sa`, `2sa`, and more.
- Accept `.` as a chapter/verse separator (`Jn 3.16`).
- Cross-chapter ranges (`John 3:16-4:2`).
- Fuzzy suggestions on a failed lookup: "Did you mean 1 Corinthians?".
- Navigation helpers: `--next` / `--previous`.

**Out of scope:** other languages' book names (M12's problem, if it ever is one).

**Exit criteria**

- [ ] Every rejection listed above now resolves correctly.
- [ ] A failed lookup suggests the closest book within a small edit distance.
- [ ] Cross-chapter ranges return every verse in the span, in order.

---

## M10 — Engineering baseline

**Status:** Complete (2026-10-22).

**Goal:** Make quality machine-enforced instead of review-enforced.

**Why now:** Cheap today while the tree is small; expensive later. This milestone protects M8–M12. It can be pulled forward to immediately after M7.

**Scope**

- ESLint flat config with `no-unused-vars`, `eqeqeq`, `prefer-const`, `no-console`.
- Prettier: 2-space indent, double quotes, semicolons, 80 columns — matching the existing style.
- `tsc --noEmit --checkJs` over the existing JSDoc typedefs in `src/api/types.js` — type safety with no migration.
- `npm run lint`, `npm run format`, `npm run typecheck` scripts, all wired into CI.
- Refresh the Node matrix: `engines: ">=22"`, CI on 22 and 24 (18 and 20 are EOL).
- Commit `package-lock.json`.

**Out of scope:** a full TypeScript migration. That is a separate, larger decision.

**Exit criteria**

- [x] CI fails on a formatting error, a lint error, and a type error.
- [x] `npm run typecheck` passes with no `any` escape hatches in the public API.

### What was actually done

- **ESLint 10.13** (`eslint.config.js`, flat): `js.configs.recommended` plus
  `no-unused-vars`, `eqeqeq`, `prefer-const`, `no-var`; `globals.node` for runtime
  globals. `no-control-regex` is off for `test/`, which matches real ANSI escapes on
  purpose. `no-console` was dropped — the CLI is a console app; `console.log` is the
  product, not a smell.
- **Prettier 3.9** (`.prettierrc.json`): `printWidth: 100`, not 80. The source already
  ran to 132 columns, and 100 makes the reformat diff ~2.5x smaller (172 changed lines
  vs 440). `.prettierignore` excludes `data/` — the 4.7 MB bundled KJV is generated and
  must never be reformatted.
- **TypeScript 5.9** (`tsconfig.json`): `checkJs` over `src/` and `test/`,
  `strict: true` with `noImplicitAny: false`. `strictNullChecks` is the part that
  catches real bugs; `noImplicitAny: false` avoids demanding a parameter type on every
  function on day one. Flipping it on later is a one-line change.
- **Node matrix**: `engines: ">=22"`, CI on `[22, 24]`, release workflow moved 20 → 22,
  `package-lock.json` committed, CI installs with `npm ci`.
- **Scripts**: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, and `check`
  (lint → format:check → typecheck → test).

### Defects the tools found

- ESLint caught two dead bindings in `src/data/kjv.js` — `const data = await loadKjv();`
  where the result was discarded, meaning the KJV file was being re-read for nothing.
- The type checker caught 18 real findings, including two `warn(...)` calls whose third
  parameter was never declared, `getVerses` declaring `verseStart` as `null` only, a
  `BOOKS` constant whose inferred type was `string | number | string[]`, and a
  `RegExpMatchArray | null` being destructured without a guard.
- Prettier caught a stray indentation artifact at `src/logger.js:17`.

### Measured baseline

| Gate                                          | Before         | After       |
| --------------------------------------------- | -------------- | ----------- |
| `tsc` errors (src + test, strict)             | 216            | 0           |
| `tsc` errors (src, strict, noImplicitAny off) | 18             | 0           |
| ESLint errors                                 | 2              | 0           |
| Prettier drift                                | 21 of 21 files | 0           |
| Tests                                         | 130 passing    | 130 passing |

---

## M11 — Ship to npm

**Status:** Complete.

**Goal:** Publishable, installable, and trustworthy.

**Why now:** Every milestone before this one is invisible to anyone outside the repository. This is the point at which the work becomes real.

### Scope

- Rename the package to lowercase. Verified: `validate-npm-package-name` reports
  `Jesus-cli` as `validForNewPackages: false` — "name can no longer contain capital
  letters". The unscoped name `jesus-cli` is then rejected at publish as too similar to
  `jest-cli`, so the package is scoped: `@noah_dave/jesus-cli` (decision D10).
- **Keep the executable name `Jesus` exactly as it is.** Decision D9: the command is
  capitalised on purpose, and no lowercase `jesus` alias will be added. Users who prefer
  to type lowercase can use `npx @noah_dave/jesus-cli …`, which npm resolves from the
  package name regardless of the bin map.
- Add `LICENSE` (MIT) and the `license`, `repository`, `author`, `keywords`, `homepage`, and `bugs` fields to `package.json`.
- Add `docs/` to the `files` array.
- Fix the release workflow: `npm publish --provenance || echo "…"` currently swallows _every_ failure, including authentication errors. It must tolerate only the "already published" conflict.
- Document KJV data provenance and licensing in `data/README.md`.
- Add `CHANGELOG.md`.

### What was actually done

- **Package named** `@noah_dave/jesus-cli`, with `publishConfig.access: "public"`. The
  `bin` map is untouched apart from dropping the `./` prefix: `{ "Jesus": "src/cli.js" }`.
  The prefix had to go because npm 12 silently removes `./`-prefixed bin entries at
  publish, which would have shipped a package with no executable.
- **`LICENSE`** added (MIT, © 2026 noah_dave), plus `license`, `repository`, `author`,
  `keywords`, `homepage`, and `bugs` in `package.json`.
- **All docs are tracked and shipped.** `docs/` was git-ignored; the ignore rule is
  removed, `docs/BUILD_GUIDE.md`, `docs/MANUAL_TESTING.md`, and `docs/MILESTONES.md` are
  all tracked, and `docs` is in the `files` array alongside `CHANGELOG.md` and `LICENSE`.
  The local absolute paths and the stale "main is behind" note were cleaned up first.
- **The publish step no longer swallows failures.** It now tolerates only
  `EPUBLISHCONFLICT`; an expired token, a registry 4xx, or a provenance failure fails
  the job. Verified against a stubbed `npm` for all three cases.
- **`data/README.md`** records the KJV's SHA-256, its 66/1,189/31,102 inventory, the
  forensic fingerprints of the text (Mark 15:34 "Eloi" is the 1611 reading; "Zion"
  153-to-"Sion" 9 shows a modernised reprint), and the rules for adding a translation
  that is not public domain.
- **`CHANGELOG.md`** written for 0.1.0 in Keep a Changelog format.

### Exit criteria

- [x] `npm publish --dry-run` produces a correctly-named tarball
      (`noah_dave-jesus-cli-0.1.0.tgz`) with a surviving `bin` entry.
- [ ] `npm install -g @noah_dave/jesus-cli` yields a working `Jesus` command on a clean machine.
- [x] A failed publish for any reason other than "already published" fails the workflow.

---

## Release guide

### The user-facing promise

For a release, users install the app globally from npm, then run its executable directly:

```bash
npm install --global @noah_dave/jesus-cli
Jesus random
```

That is the whole contract. Every release must make this exact sequence work on a clean machine, with no local checkout and no build step.

The command is capitalised as `Jesus` on purpose — see decision D9. The _package_ is
scoped as `@noah_dave/jesus-cli`; the _executable_ is `Jesus`. Users who prefer to type
lowercase can run `npx @noah_dave/jesus-cli random`, which npm resolves from the package
name without needing a second bin entry.

### Release preconditions

All of these are **met** as of Milestone 11. They are listed here as the checklist a new
maintainer should re-verify before cutting a release, not as open work.

| Precondition              | Status | Evidence                                                                                         |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Publishable name          | ✅     | `@noah_dave/jesus-cli` is valid; unscoped `jesus-cli` is rejected as too similar to `jest-cli`   |
| `LICENSE` file            | ✅     | MIT text in `LICENSE`, © 2026 noah_dave; `license: "MIT"` in `package.json`                      |
| Complete npm metadata     | ✅     | `license`, `repository`, `author`, `keywords`, `homepage`, `bugs`, `engines` all present         |
| Docs ship in the tarball  | ✅     | `files` includes `src`, `data`, `docs`, `README.md`, `CHANGELOG.md`, `LICENSE`                   |
| Publish failures surfaced | ✅     | Publish step tolerates only `EPUBLISHCONFLICT`; a stubbed-`npm` test confirms `E401` exits 1     |
| KJV data unmodified       | ✅     | `data/kjv.json` SHA-256 `e134e19e…c270` unchanged after every formatting pass                    |
| Global install works      | ✅     | Packed tarball installed into an isolated prefix; `Jesus read "John 3:16"`, `random`, `today` OK |

The `bin` map stays exactly as it is: `{ "Jesus": "./src/cli.js" }`. Do **not** rename it
to `jesus` and do **not** add a lowercase alias — decision D9.

The only remaining preconditions are credentials, which live outside the repository and
must be supplied by a maintainer: the `NPM_TOKEN` secret and the `PUBLISH_TO_NPM`
variable, both described in "What still requires your action" below.

### Publishing procedure

#### 0. The mental model

`.github/workflows/release.yml` has **two independent jobs**:

| Job           | Always runs?                            | What it does                                                                 | Needs              |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------ |
| `verify`      | Yes, on any `v*` tag                    | Installs, runs the four gates, packs the tarball, creates the GitHub Release | Nothing            |
| `publish-npm` | Only if `vars.PUBLISH_TO_NPM == 'true'` | Publishes to npm with provenance                                             | `NPM_TOKEN` secret |

The split is deliberate. The GitHub Release can be cut without publishing, and a publish
failure must not block the release artifact. The corollary is the one failure mode that
bites people: **if the publish job is skipped, the workflow still goes green** and you
get a GitHub Release with no npm package. That is the reason the publish gate is a
variable you set deliberately rather than something implicit.

#### 1. What still requires your action

The code is ready. The pipeline cannot publish without your credentials and explicit
permission. You must supply two things.

**A. npm authentication — the `NPM_TOKEN` secret**

1. Log in at [npmjs.com](https://www.npmjs.com).
2. Click your username (top right) → **Access Tokens** → **Generate New Token**.
3. Choose **Granular Access Token** and fill it in like this:

   | Field                            | Value                                    | Why                                                                    |
   | -------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
   | Token name                       | `jesus-cli-ci`                           | only a label                                                           |
   | Description                      | `Publishes @noah_dave/jesus-cli from CI` | future-you will thank you                                              |
   | Allowed IP ranges                | **leave empty**                          | GitHub runners use dynamic IPs; an allowlist breaks the publish        |
   | Packages and scopes → permission | **Read and write (publish and stage)**   | `stage only` is for `npm stage publish`, which this repo does not use  |
   | Package selection                | **All packages**                         | the package does not exist yet — a token scoped to it cannot create it |
   | Organizations → permission       | **No access**                            | personal scope                                                         |
   | Expiration                       | up to 365 days                           | when it expires, publishing breaks; calendar it or rotate              |
   | Bypass 2FA (if shown)            | **enabled**                              | otherwise CI publish fails waiting for an OTP                          |

   Before generating, confirm the summary says the token will "Provide **read and write**
   access to all packages and scopes". If it says "no access", the permission dropdown did
   not take.

   A **Classic Automation token** also works and is simpler; the granular form is the
   current default UI and is fine as long as the table above is followed.

4. Copy the token **once** — npm shows it only once, and it cannot be retrieved later.
5. In the GitHub repository: **Settings → Secrets and variables → Actions → Secrets tab
   → New repository secret**. Name it exactly `NPM_TOKEN`, paste the token, save.

> **npm now restricts tokens that bypass 2FA.** If `npm publish` returns
> `403 … Two-factor authentication or granular access token with bypass 2fa enabled is
required to publish packages`, do the first publish from your machine with a live
> authenticator code instead:
>
> ```bash
> npm publish --otp=123456   # replace with the current 6-digit code
> ```
>
> A live OTP is not affected by the token restriction. Use Trusted Publishing for CI
> afterwards.

> **After the first successful publish**, prefer **Trusted Publishing** over a long-lived
> token: npmjs.com → the `@noah_dave/jesus-cli` package → **Settings → Trusted Publisher
> → GitHub Actions**, repository `DavisNoah02/JESUS_CLI`, workflow `release.yml`. Then
> delete the `NPM_TOKEN` secret. This needs npm CLI ≥ 11.5.1 (Node 22 bundles 10.x, so add
> `npm install -g npm@latest` to the job or move to Node 24). The workflow already has
> `id-token: write`, so it is ready apart from the CLI version.

**B. The publish flag — the `PUBLISH_TO_NPM` variable**

1. **Settings → Secrets and variables → Actions → Variables tab** (not Secrets).
2. **New repository variable** → name `PUBLISH_TO_NPM` → value `true` → save.

> **The single most common mistake:** creating `PUBLISH_TO_NPM` as a _Secret_ instead of
> a _Variable_. The workflow reads `vars.PUBLISH_TO_NPM` and `secrets.PUBLISH_TO_NPM`.
> A secret named `PUBLISH_TO_NPM` leaves `vars.PUBLISH_TO_NPM` empty, the condition
> `== 'true'` is false, and the publish job is **silently skipped** — the workflow goes
> green, the GitHub Release is created, and nothing is published. Check the Variables
> tab, not the Secrets tab.

Set both **before** you push the tag. If you set them afterwards, trigger the workflow
manually instead (**Actions → Release → Run workflow**); the tag/version check now skips
itself on a non-tag ref, and the GitHub Release step is skipped for the same reason.

#### 2. Prepare and verify locally

```bash
npm test                              # must be green
npm run check                         # lint + format + type check + tests
npm pack --dry-run                    # inspect the file list
```

#### 3. Verify the global-install path locally, before touching npm

This is the step that is usually skipped and always matters. Test the real user journey:

```bash
npm install --global .               # install the local build globally
Jesus random                         # the exact command from the release notes
Jesus read "John 3:16"
Jesus --version
npm uninstall --global @noah_dave/jesus-cli     # clean up
```

If `Jesus random` does not work here, it will not work for a user.

Even better, install the **packed tarball** — that is what npm users actually receive,
and it exercises the `files` array:

```bash
npm pack --pack-destination /tmp
npm install --global /tmp/noah_dave-jesus-cli-0.1.0.tgz --prefix /tmp/globaltest
/tmp/globaltest/bin/Jesus read "John 3:16"
```

#### 4. Tag and push

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main --tags
```

The tag triggers `.github/workflows/release.yml`, which verifies that the tag matches
`package.json`'s version, runs the four gates, packs the tarball, and creates the
GitHub Release.

> `package.json` is already at `0.1.0`, so `npm version 0.1.0` will fail with
> "Version not changed". Tag it directly. From the _second_ release onward, use
> `npm version minor` (or `patch`), which bumps `package.json` and creates the tag in
> one step.

#### 5. Publish to npm

The `publish-npm` job runs automatically in the same workflow, provided
`PUBLISH_TO_NPM` is `true`. It runs `npm publish --provenance` with `NODE_AUTH_TOKEN`
set from the `NPM_TOKEN` secret.

The publish step tolerates **only** `EPUBLISHCONFLICT` (this version already exists).
Every other failure — an expired token, a registry 4xx, a provenance error — fails the
job loudly. The old `npm publish --provenance || echo "…"` swallowed all of them and
produced a green build that published nothing.

#### 6. Verify the published package

```bash
npm view @noah_dave/jesus-cli versions
npm install --global @noah_dave/jesus-cli
Jesus random
```

A brand-new package can take a few minutes to appear in the registry. If `npm view`
returns 404 immediately after a successful publish, wait and retry before assuming a
failure.

### Troubleshooting the publish

| Symptom                                                                                         | Cause                                                                                   | Fix                                                                                     |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `publish-npm` job absent from the run                                                           | `PUBLISH_TO_NPM` was created as a **Secret**, or not set when the workflow started      | Move it to the **Variables** tab; re-run via **Actions → Release → Run workflow**       |
| `npm error code E401` / `ENEEDAUTH`                                                             | The secret is missing, empty, or misnamed                                               | Secret must be named exactly `NPM_TOKEN`, under **Secrets**; re-paste without a newline |
| `E403 … Two-factor authentication or granular access token with bypass 2fa enabled is required` | npm requires 2FA and the token may not bypass it (npm is retiring bypass tokens)        | Publish locally with `npm publish --otp=<live code>`, or use Trusted Publishing         |
| `E403 … Package name too similar to existing package 'jest-cli'`                                | npm's typosquat protection blocks the unscoped name `jesus-cli`                         | Use the scoped name `@noah_dave/jesus-cli` with `publishConfig.access: "public"`        |
| `npm warn publish "bin[Jesus]" … was invalid and removed`                                       | A `./`-prefixed bin path is dropped by npm 12+                                          | Use `"bin": { "Jesus": "src/cli.js" }` (no `./`)                                        |
| `npm error code EPUBLISHCONFLICT`                                                               | That version is already on npm                                                          | Harmless — the job stays green and the publish is skipped                               |
| Provenance error                                                                                | `repository` in `package.json` does not match the repo, or `id-token: write` is missing | Both are already correct in `release.yml`; check `package.json`                         |
| GitHub Release exists, no npm package                                                           | The publish job was skipped                                                             | The `PUBLISH_TO_NPM` variable problem above                                             |
| `npm view @noah_dave/jesus-cli` 404s after a successful publish                                 | Registry propagation delay                                                              | Wait a few minutes and retry                                                            |

### If you publish a broken version

**npm versions are immutable.** You cannot re-publish `0.1.0`; the registry rejects it
with `EPUBLISHCONFLICT`, and the publish step treats that as success. The only way out
is a new version: bump to `0.1.1`, tag, and publish. This is why step 3 — the local
global-install test — is not optional.

### Versioning policy

Semver, applied to the user-visible surface:

| Change                                                  | Bump    | Example                              |
| ------------------------------------------------------- | ------- | ------------------------------------ |
| Bug fix, no behaviour change                            | `patch` | Fixing a cache miss                  |
| New command, flag, or option                            | `minor` | Adding `--json`                      |
| Changed output format, removed command, changed default | `major` | Changing the plain-text verse format |
| New translation added to the registry                   | `patch` | The list grows, nothing breaks       |

**The plain-text output format is a public API.** `John 3:16 - <text> (KJV)` is what users pipe into `grep` and `awk`. Changing it is a breaking change and needs a major version.

---

## When to cut the first tag — recommendation

### Recommendation

**`v0.1.0` is ready to tag.** Cut it as soon as the `NPM_TOKEN` secret and
`PUBLISH_TO_NPM` variable exist, before starting M8.

M11 is the milestone that made the package publishable. Tagging before it would have
produced a release that cannot be installed — worse than no release, because it burns the
version number and puts a broken artifact in the registry's history. That work is done.

### Why M11 had to come first

These were the blockers before M11, kept here because they explain the ordering:

1. **The package could not be published.** The mixed-case name was rejected by npm, so
   `npm install --global @noah_dave/jesus-cli` would have resolved to some _other_
   package, or to nothing. The `|| echo` in the workflow would also have turned the
   resulting failure into a **green** build.
2. **The metadata was missing.** No `LICENSE`, no `license`/`repository`/`author` fields,
   and `docs/` was not in `files`.
3. **`main` was behind.** It did not yet contain M7–M10. A tag then would have published a
   package without the resolver, the cache, or the config command.

All three are resolved: see "Release preconditions" for the current evidence.

### The conditions for `v0.1.0` — all met

- [x] M11 complete: package named `@noah_dave/jesus-cli`, LICENSE added, npm metadata added, `docs/` packaged. The `bin` map stays `{ "Jesus": "src/cli.js" }` (decision D9).
- [x] The release workflow's publish step no longer swallows real failures.
- [x] `main` contains M7–M10 (merged via PRs #3 and #4).
- [x] `npm install --global . && Jesus random` verified locally, and the packed tarball verified in an isolated prefix.
- [x] `npm test` green (130/130) and `npm pack --dry-run` clean.
- [x] KJV data provenance documented in `data/README.md`.
- [x] `CHANGELOG.md` written for `0.1.0`.
- [ ] `NPM_TOKEN` secret and `PUBLISH_TO_NPM` variable created — maintainer action, outside the repo.

### Sequencing: what to tag, and when

| Tag      | When                        | Contents                                                                                              |
| -------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `v0.1.0` | Now, once credentials exist | The first installable release: KJV reads, search, random, today, config, themes, translations, cache. |
| `v0.2.0` | After M8 + M9               | `--json` output, `books`, pagination, better parsing.                                                 |
| `v0.3.0` | After M12                   | The TUI, added as a new surface. The plain-text CLI is unchanged and stays the primary surface.       |
| `v1.0.0` | After `v0.3.0`              | Cut once the TUI has survived a release cycle and the command surface has been stable for a while.    |

`v0.1.0` is a **pre-1.0 number on purpose**: it signals that the output format and the command surface may still change, which is exactly the state of the project.

The TUI is a **minor** bump, not a major one. It adds a surface; it does not change the existing one. Going `0.2.0 → 0.3.0` says exactly that. Cutting `1.0.0` in the same release as the TUI would be a different and wrong claim: `1.0.0` promises the interface will not break, and a TUI that has never met a real user cannot make that promise. `v1.0.0` waits one release cycle — until the TUI has been exercised, its rough edges have been filed, and the plain-text CLI has proved stable alongside it.

### Preparing the release commit

Before the tag, the tracked docs need to be accurate, because they ship in the tarball:

- `README.md` — commands, flags, install instructions, current status.
- `docs/BUILD_GUIDE.md` — architecture, cache layout, known gaps.
- `docs/MILESTONES.md` — this file, the milestone history and release guide.
- `docs/MANUAL_TESTING.md` — the manual test checklist.
- `CHANGELOG.md` — the release notes.
- `data/README.md` — KJV provenance and licensing.

All of them are tracked and included in the package's `files` array.

---

## M12 — Terminal UI

**Status:** Planned.

**Goal:** A full-screen Bible browser — book/chapter navigation, verse pane, search, translation picker, and a remembered reading position.

**Why now:** Last, because the TUI is the most expensive surface and it depends on everything below it being correct. A TUI built on an unwired CLI would have to be rewritten.

**Scope**

- **Use Ink.** This repository is a Node.js/ESM CLI and the maintainer is familiar with React. Ink keeps the TUI in the existing runtime and avoids a separate Rust application/build pipeline.
- Panes: books/chapter navigator, verse reader, search, translation picker.
- Controls: Left/Right switches panels; Up/Down scrolls; Enter selects; `/` opens search; `t` cycles four themes; `v` opens translation selection; `q` twice quits; `h`/`j`/`k`/`l` provide vi-style navigation.
- Expand the current two-theme palette to four TUI-selectable themes; choose and document the names during M12 implementation.
- Search uses the existing resolver: bundled KJV offline and locally cached translation data where available. The verified translation registry remains the source of truth; expand it only with verified codes rather than promising unsupported choices.
- Add a `tui` command that mounts Ink without changing the existing text commands or their output contract.
- Persist the reading position to `state.json` — this finally gives `bookIndex`, `chapter`, and `scrollPosition` a purpose.
- TUI is **additive**: the plain-text commands remain the stable, scriptable interface. The TUI is never a replacement.

**Out of scope:** mouse support, plugins, a plugin API.

**Exit criteria**

- [ ] The TUI can be disabled and the CLI is fully functional without it.
- [ ] Reading position survives a restart.
- [ ] The plain-text output format is unchanged by the TUI's existence.

---

## Decision log

Decisions that shape the roadmap. Superseded decisions are struck through, not deleted.

| ID  | Decision                                                                                                                                              | Status                                       | Rationale                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `today` under a non-KJV translation resolves the KJV reference, then looks it up in the target translation, falling back to KJV with a stderr warning | **Accepted — implemented in M7**             | Keeps `today` deterministic _and_ consistent with the user's chosen translation. The fallback is reported, never silent.                                                                                                                                                                                                                                   |
| D2  | Supported translation codes are a bundled allowlist, enforced at the CLI boundary with a clear error                                                  | **Accepted — implemented in M7**             | Bolls has no translation-list endpoint and returns HTTP 200 with `[]` for an unknown code, which produces a misleading error. 17 codes verified live. A stale list is fixed by a patch release; the alternative (a silent wrong error) is worse.                                                                                                           |
| D3  | The cache moves under the app data directory                                                                                                          | **Accepted — implemented in M7**             | State is at `<dataDir>/jesus-cli/state.json` but the cache was at `<dataDir>/translations/`. Now `<dataDir>/jesus-cli/translations/`, with a one-time automatic migration of the old location. Done before the CLI started writing to users' home directories.                                                                                             |
| D4  | `--translation` is ephemeral; only `config set` persists                                                                                              | **Accepted — implemented in M7**             | A flag must not mutate persistent state as a side effect. Verified by a test that asserts a flag never creates a state file.                                                                                                                                                                                                                               |
| D5  | `--json` lands in M8, not M7                                                                                                                          | Accepted                                     | Keeps M7 reviewable. The argument parser from M7.1 makes adding it later cheap.                                                                                                                                                                                                                                                                            |
| D6  | The TUI is additive, never a replacement for the plain-text CLI                                                                                       | Accepted                                     | The scriptable surface is the product's identity.                                                                                                                                                                                                                                                                                                          |
| D7  | `v0.1.0` is cut immediately after M11, and `v1.0.0` waits for M12                                                                                     | Accepted                                     | Tagging before the package is installable burns a version number and can produce a release that looks green but installs nothing.                                                                                                                                                                                                                          |
| D8  | The plain-text output format is a public API and changes only in a major release                                                                      | Accepted                                     | Users pipe it into `grep` and `awk`. Stability is worth more than cosmetic tweaks.                                                                                                                                                                                                                                                                         |
| D9  | The executable stays `Jesus`, capitalised. No lowercase `jesus` alias                                                                                 | **Accepted — a deliberate product decision** | Many believers are called to capitalise the name of Jesus, and the command is a devotional tool, not just a developer utility. A lowercase alias would make the invocation ambiguous and weaken the intent. The npm _package_ is scoped as `@noah_dave/jesus-cli` (see D10), and `npx @noah_dave/jesus-cli …` covers anyone who prefers to type lowercase. |
| D10 | The npm package is scoped: `@noah_dave/jesus-cli`                                                                                                     | Accepted                                     | npm rejects the unscoped name `jesus-cli` at publish as "too similar to existing package jest-cli" (typosquat protection), despite the name being unclaimed. Scoping keeps the intended name and the `Jesus` executable; the cost is a longer install command.                                                                                             |

### D9 in detail — the executable name

Two names, two different rules:

| Thing       | Name                   | Why                                                                                                                           |
| ----------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| npm package | `@noah_dave/jesus-cli` | npm rejects `Jesus-cli` (capitals) and the unscoped `jesus-cli` (too similar to `jest-cli`). The scope preserves the name.    |
| Executable  | `Jesus`                | A deliberate choice (decision D9). The capitalisation is intentional and should not be "fixed" by a well-meaning contributor. |

Practical consequence: a user who types lowercase gets "command not found". The fix is
`npx @noah_dave/jesus-cli read "John 3:16"`, which npm resolves from the package name — no
second bin entry required, and the capitalised `Jesus` stays the one and only command.

### D1 in detail — `today` under a non-KJV translation

The KJV `today` picks a verse deterministically from a hash of the date (`fnv1a` → seed → book/chapter/verse). Three ways to handle a non-KJV translation:

- **(a) KJV-only.** `today` always returns a KJV verse; `--translation` affects `read`, `search`, and `random` only. Simplest, stays offline and deterministic, but a user who set `translation=WEB` gets a surprise `(KJV)` label.
- **(b) Translate the deterministic reference.** Resolve the KJV reference, then fetch that chapter in the requested translation and match by verse number, falling back to KJV if the fetch or the lookup fails. Best UX, costs one network request per day, and may fall back because verse numbering differs slightly between translations.
- **(c) Deterministic within the target translation.** Hash the date to a chapter index in that translation. Consistent semantics, but the verse changes day to day depending on which translation is installed.

**Accepted: (b) with a KJV fallback.** Implemented as `resolver.getVerseOfTheDay()`. The fallback is never silent — it prints a warning to stderr explaining why the requested translation was not used.

### D2 in detail — the translation allowlist

Verified live against `bolls.life` (`GET /get-chapter/<CODE>/43/3/`):

| Code | Name                        | Code | Name                              | Code | Name                     |
| ---- | --------------------------- | ---- | --------------------------------- | ---- | ------------------------ |
| KJV  | King James Version          | ESV  | English Standard Version          | CJB  | Christian Journals Bible |
| WEB  | World English Bible         | NIV  | New International Version         | NET  | New English Translation  |
| ASV  | American Standard Version   | NLT  | New Living Translation            | CUV  | Chinese Union Version    |
| YLT  | Young's Literal Translation | TNIV | Today's New International Version | GNT  | Greek New Testament      |
| NKJV | New King James Version      | ERV  | English Revised Version           | MSG  | The Message              |
| NASB | New American Standard Bible | AMP  | Amplified Bible                   |      |                          |

Verified _not_ available (returned an empty array): DBG, BBE, DAR, GW, HCS, STRONGS, TEXT, NIVV, NRSV.

The list lives in `src/api/translations.js` and is enforced at the CLI boundary: `--translation ZZZ` fails immediately with the list of valid codes, before any network request. At the resolver level, a code that is not on the list but still returns an empty chapter raises `UnsupportedTranslationError` rather than the misleading `Chapter not found`.

### D8 in detail — output stability

The plain-text line format is treated as a public API:

```
John 3:16 - For God so loved the world... (KJV)
```

Users pipe it into `grep`, `awk`, and scripts. M8's `--json` output is the _additional_ machine-readable surface; the plain-text format does not change. Any change to it is a major version.

---

## Change log

| Date       | Change                                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-21 | Document created from the M7–M12 roadmap in `docs/BUILD_GUIDE.md`. Verified the Bolls translation allowlist live against `bolls.life`. |
| 2026-10-21 | M7 implemented: 130 tests pass. D1, D2, D3, D4 resolved and implemented. Added the release guide and the tag-timing recommendation.    |
