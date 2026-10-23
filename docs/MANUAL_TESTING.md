# Manual Testing Guide

How to exercise Jesus CLI by hand, what each check proves, and how to work on the project
day to day.

The automated suite (`npm test`) proves the contract. This guide proves the _experience_ —
the parts a test cannot see: colours in a real terminal, network behaviour, a cold cache,
a fresh machine, a broken pipe.

Run every "Quick check" before you call a milestone done.

---

## 1. Daily work loop

```bash
cd /path/to/JESUS_CLI

npm test                 # full suite, ~3 s
node src/cli.js --help   # run without installing
```

Install the command once so you can type `Jesus` from anywhere:

```bash
npm link                 # links the `Jesus` binary globally
Jesus read "John 3:16"
npm unlink               # remove the link when you are done
```

`npm link` is the right tool for local work: it symlinks the checkout, so every edit is
live immediately, with no reinstall.

### Working on a branch

```bash
git switch -c feature/<slug>      # off main
git switch -                       # back
```

Milestone branches are `milestone/<n>-<slug>`; feature branches are `feature/<slug>`.
Never work directly on `main`.

### Never let a test touch your real data

The CLI writes to a per-platform data directory. Point it somewhere disposable whenever you
experiment:

```bash
export JESUS_CLI_DATA_DIR=$(mktemp -d)
```

That variable overrides the platform lookup entirely (`XDG_DATA_HOME`, `APPDATA`, and the
macOS default are all bypassed). To see where the real one is:

```bash
node -e "import('./src/store/state.js').then(m => console.log(m.APP_DIR))"
```

| Platform | Real data directory                                        |
| -------- | ---------------------------------------------------------- |
| Linux    | `~/.local/share/jesus-cli` (or `$XDG_DATA_HOME/jesus-cli`) |
| macOS    | `~/Library/Application Support/jesus-cli`                  |
| Windows  | `%APPDATA%\jesus-cli`                                      |

---

## 2. Quick check — the 60-second smoke test

```bash
export JESUS_CLI_DATA_DIR=$(mktemp -d)

node src/cli.js read "John 3:16"          # a verse
node src/cli.js read "Psalm 23:1-3"       # a range
node src/cli.js read "Genesis 1"          # a whole chapter
node src/cli.js search faith --limit 3 --offset 3 --json # paginated JSON search
node src/cli.js books --json              # 66-book catalog
node src/cli.js read "John 3:16" --json   # structured verse
node src/cli.js random                    # a random verse
node src/cli.js today                     # today's verse
node src/cli.js config list               # current settings
node src/cli.js --version
node src/cli.js --help
```

All listed commands must succeed, print to stdout, and exit 0.

**What it proves:** the KJV path, the resolver, the argument parser, the theme layer, and the
state reader all work with no network and no pre-existing state.

---

## 3. Full manual test script

Work through these in order. Each one has an explicit "passes if" line, so you never have to
guess whether a result is correct.

### 3.1 Offline KJV

| #   | Command                                | Passes if                                                 |
| --- | -------------------------------------- | --------------------------------------------------------- |
| 1   | `node src/cli.js read "John 3:16"`     | One line: `John 3:16 - For God so loved the world… (KJV)` |
| 2   | `node src/cli.js read "Psalms 23:1-3"` | Exactly 3 lines, verses 1, 2, 3 in order                  |
| 3   | `node src/cli.js read "Genesis 1"`     | 31 lines, verse numbers 1–31                              |
| 4   | `node src/cli.js read "1 Cor 13:4"`    | Resolves the alias `1 Cor` to 1 Corinthians               |
| 5   | `node src/cli.js read "john 3:16"`     | Works — parsing is case-insensitive                       |
| 6   | `node src/cli.js read "John 3"`        | The whole chapter of John                                 |

Confirm you are truly offline: the KJV path must not touch the network. `npm test` asserts
this for the whole suite.

### 3.2 Output format

| #   | Command                                       | Passes if                                    |
| --- | --------------------------------------------- | -------------------------------------------- |
| 7   | `node src/cli.js read "John 3:16" \| cat`     | Identical to #1 — no escape codes when piped |
| 8   | `node src/cli.js read "John 3:16" --no-color` | Identical to #1, even in a colour terminal   |
| 9   | `NO_COLOR=1 node src/cli.js read "John 3:16"` | Identical to #1                              |
| 10  | `node src/cli.js read "John 3:16" \| head -1` | No stack trace, no `EPIPE` noise, exit 0     |

Line 7 is the one people get wrong. **The pipe is the contract**: if a user pipes the output
into `grep`, they get clean text. Run these in a real terminal _and_ through a pipe.

### 3.3 Search

| #   | Command                                   | Passes if                                      |
| --- | ----------------------------------------- | ---------------------------------------------- |
| 11  | `node src/cli.js search faith`            | Up to 50 lines, each with a reference and text |
| 12  | `node src/cli.js search faith --limit 3`  | Exactly 3 lines                                |
| 13  | `node src/cli.js search faith -n 1`       | Exactly 1 line — the short form works          |
| 14  | `node src/cli.js search faith --limit=3`  | Exactly 3 lines — the `=` form works           |
| 15  | `node src/cli.js search "faith and hope"` | No error; quotes are respected as one query    |

### 3.4 JSON and pagination

| Command | Passes if |
| ------- | --------- |
| `node src/cli.js read "John 3:16" --json` | Valid JSON; `schemaVersion` is `1`; verse text is in `data.verses[0].text` |
| `node src/cli.js search faith --limit 5 --offset 10 --json` | Valid JSON; `data.limit` is 5, `data.offset` is 10, and `data.total` is reported |
| `node src/cli.js books --json` | Valid JSON; `data.books` has 66 entries with aliases and chapter counts |
| `node src/cli.js random --json` | Valid JSON; one verse is returned |
| `node src/cli.js today --json` | Valid JSON; one verse is returned |
| `node src/cli.js config list --json` | Valid JSON; `data.settings` contains translation and theme |

The complete contract and the meaning of search `source`/`total` are documented in
[`JSON_SCHEMA.md`](JSON_SCHEMA.md). Plain-text commands must remain unchanged.

### 3.5 `today`

| #   | Command                            | Passes if                                      |
| --- | ---------------------------------- | ---------------------------------------------- |
| 16  | `node src/cli.js today`            | A verse                                        |
| 17  | `node src/cli.js today` (again)    | The **same** verse — it is stable within a day |
| 18  | `node src/cli.js read "John 3:16"` | Unaffected by `today`                          |

To see that it tracks the _local_ calendar day, run it with a faked date one day out:

```bash
node src/cli.js today                       # today's verse
faketime '2026-09-24 12:00' node src/cli.js today   # tomorrow's verse, if faketime is installed
```

The two must differ. This check exists because the implementation was once based on the UTC
date, which gave users east or west of UTC the wrong verse for up to 14 hours a day.

### 3.6 Flags and parsing

| #   | Command                                                    | Passes if                                       |
| --- | ---------------------------------------------------------- | ----------------------------------------------- |
| 19  | `node src/cli.js --translation WEB read "John 3:16"`       | `(WEB)` at the end of the line                  |
| 20  | `node src/cli.js read "John 3:16" --translation WEB`       | Identical to #19 — flags work after the command |
| 21  | `node src/cli.js search faith --limit 3 --translation WEB` | Accepted; the limit still applies               |
| 22  | `node src/cli.js read -- "John 3:16"`                      | Same as without `--`                            |
| 23  | `node src/cli.js --bogus read "John 3:16"`                 | Error on stderr: unknown option; exit 1         |
| 24  | `node src/cli.js --translation`                            | Error on stderr: missing value; exit 1          |
| 25  | `node src/cli.js --translation XYZ read "John 3:16"`       | Error listing the supported codes; exit 1       |
| 26  | `node src/cli.js --theme Nonsense read "John 3:16"`        | Error listing the valid themes; exit 1          |

#23–#26 must print **nothing** to stdout and a **one-line** message to stderr.

### 3.7 Config and state

```bash
export JESUS_CLI_DATA_DIR=$(mktemp -d)   # keep this out of your real data dir

node src/cli.js config list               # translation = KJV, theme = Slate
node src/cli.js config set translation WEB
node src/cli.js config list               # translation = WEB
node src/cli.js config get translation    # WEB
node src/cli.js config get theme          # Slate
node src/cli.js config set theme Midnight
node src/cli.js config list               # theme = Midnight
node src/cli.js read "John 3:16"          # now (WEB) — the saved default applies
```

| #   | Check                                       | Passes if                                                                                                               |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 27  | A `--translation` flag must **not** persist | `node src/cli.js --translation WEB read "John 3:16"` then `node src/cli.js config list` still shows `translation = KJV` |
| 28  | State survives a restart                    | The file is on disk: `cat "$JESUS_CLI_DATA_DIR/jesus-cli/state.json"`                                                   |
| 29  | The state file is valid JSON                | `node -e "JSON.parse(require('fs').readFileSync('$JESUS_CLI_DATA_DIR/jesus-cli/state.json'))"` exits 0                  |
| 30  | An invalid value is rejected                | `node src/cli.js config set translation XYZ` errors, and the file is unchanged                                          |

### 3.8 Translations and the cache (needs network)

```bash
export JESUS_CLI_DATA_DIR=$(mktemp -d)

node src/cli.js --translation WEB read "John 3:16"    # 1st run: fetches
node src/cli.js --translation WEB read "John 3:16"    # 2nd run: cached
```

| #   | Check                              | Passes if                                                                                                                                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 31  | The text differs from KJV          | KJV says "only begotten Son"; WEB says "one and only Son"                                                                                   |
| 32  | The label is dynamic               | The line ends with `(WEB)`, not `(KJV)`                                                                                                     |
| 33  | The chapter is cached              | `ls "$JESUS_CLI_DATA_DIR/jesus-cli/translations/WEB/"` shows a `43_3.json`                                                                  |
| 34  | The second run is offline          | Disconnect the network, run again — same output, no error                                                                                   |
| 35  | The cache path is namespaced       | The file is under `jesus-cli/translations/`, **not** `translations/`                                                                        |
| 36  | A corrupt cache file is survivable | `echo "not json" > "$JESUS_CLI_DATA_DIR/jesus-cli/translations/WEB/43_3.json"`, then read again — it refetches instead of crashing          |
| 37  | `today` honours the translation    | `node src/cli.js config set translation WEB && node src/cli.js today` — the verse is WEB, or falls back to KJV **with a warning on stderr** |

#36 is the important one: a truncated cache file must degrade, never crash.

### 3.9 Error handling

| #   | Command                                       | Passes if                                           |
| --- | --------------------------------------------- | --------------------------------------------------- |
| 38  | `node src/cli.js read "Fakebook 1:1"`         | One-line error on stderr, exit 1, nothing on stdout |
| 39  | `node src/cli.js read "John 999:1"`           | Error: verse not found, exit 1                      |
| 40  | `node src/cli.js` (no command)                | Usage message, exit 1                               |
| 41  | `node src/cli.js bogus-command`               | Unknown-command error, exit 1                       |
| 42  | `node src/cli.js read "Fakebook 1:1" --debug` | Full stack trace on stderr, exit 1                  |
| 43  | An unexpected internal failure                | Stack trace, exit **70**                            |

#38–#42 are the known-error path: clean message, exit 1.
#43 is the unknown-error path: stack trace, exit 70 (`EX_SOFTWARE`).

To see #43, temporarily break something and run it:

```bash
node -e "
import('./src/cli.js').catch(e => { console.error(e); process.exit(70); });
" # or, more simply, comment out a line in src/commands/read.js and observe the exit code
```

### 3.9 Themes

| #   | Check                                                      | Passes if                                |
| --- | ---------------------------------------------------------- | ---------------------------------------- |
| 44  | `node src/cli.js --theme Midnight read "John 3:16"`        | Different colours from the default       |
| 45  | `node src/cli.js --theme Midnight read "John 3:16" \| cat` | No colour codes when piped               |
| 46  | `node src/cli.js config set theme Midnight` then run again | The saved theme applies without the flag |

Run #44 in a real terminal — a test cannot tell whether the colours look right.

---

## 4. What the automated suite already covers

Do not re-test by hand what the suite already asserts. `npm test` runs 130 tests:

| Suite                       | Covers                                             |
| --------------------------- | -------------------------------------------------- |
| `test/cli.test.js`          | Every command end to end, stdout/stderr/exit codes |
| `test/args.test.js`         | Flag parsing, including the error cases            |
| `test/context.test.js`      | Translation/theme/limit resolution order           |
| `test/translations.test.js` | The 17-code registry and normalisation             |
| `test/resolver.test.js`     | KJV / network / cache routing, fallbacks           |
| `test/data.test.js`         | The bundled KJV, `today`, the local-date key       |
| `test/cache.test.js`        | Atomic writes, corrupt files, legacy migration     |
| `test/state.test.js`        | Defaults, persistence, atomic save                 |
| `test/theme.test.js`        | Palette and colour detection                       |
| `test/bolls.test.js`        | The HTTP client and HTML stripping                 |

The suite uses `mkdtemp` and `JESUS_CLI_DATA_DIR` throughout. It never touches your real
data directory. If you add a test that writes to disk, follow the same rule.

---

## 5. Debugging checklist

When something behaves oddly, check in this order:

1. **Which data directory is in play?** `echo $JESUS_CLI_DATA_DIR`. If it is empty, the CLI
   is using your real one and old state may be confusing you.
2. **What is the resolved context?** `node src/cli.js config list` — the saved translation
   and theme can override what you think you passed.
3. **Is the cache stale?** `ls -R "$JESUS_CLI_DATA_DIR/jesus-cli/translations/"`. Delete the
   folder to force a refetch.
4. **Is it the network?** `curl -sS -o /dev/null -w '%{http_code}\n' https://bolls.life/get-chapter/WEB/43/3/`
5. **Add `--debug`** — it forces a stack trace even for known errors.
6. **Bisect the output.** `node src/cli.js read "John 3:16" | cat` removes colour, and
   `| head -1` removes all but the first line.

---

## 6. Before you call a milestone done

- [ ] `npm test` is green.
- [ ] The §2 quick check passes.
- [ ] The §3 script for the milestone's own area passes.
- [ ] `npm pack --dry-run` lists the files you expect.
- [ ] The README's status section matches what actually runs.
- [ ] The change log in `docs/MILESTONES.md` is updated.

---

## 7. Before the first release (M11)

One extra check that only applies at release time — the global install path, on a clean
machine:

```bash
npm install --global .
Jesus random
Jesus read "John 3:16"
npm uninstall --global @noah_dave/jesus-cli
```

The command is capitalised `Jesus` on purpose. Users who prefer lowercase can use
`npx @noah_dave/jesus-cli random`. Do not rename the binary, and do not add a lowercase
alias — that is a settled decision (D9 in `docs/MILESTONES.md`).

Then follow the release procedure in `docs/BUILD_GUIDE.md` §4.6.

---

## 8. Troubleshooting

| Symptom                                | Likely cause                                                   | Fix                                                         |
| -------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| `command not found: Jesus`             | Not linked, or the shell has not rehashsed                     | `npm link`, then `hash -r`                                  |
| The old verse shows up for `today`     | Stale state, or a UTC-based build                              | `node src/cli.js config list`; rebuild                      |
| `Cannot find module` after an edit     | Stale import path                                              | `node --check src/<file>.js` to find the syntax error first |
| Colours vanish in the terminal         | `NO_COLOR` is set, or the output is piped                      | Expected behaviour, not a bug                               |
| A translation always falls back to KJV | The chapter is not in that translation, or the network is down | The fallback is reported on stderr — read it                |
| The cache is not being written         | The data directory is not writable                             | Check `JESUS_CLI_DATA_DIR` permissions                      |
