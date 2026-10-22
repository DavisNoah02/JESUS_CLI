# Bundled Bible data

## `kjv.json`

The King James Version, bundled so the CLI works offline with zero network calls.

| Property    | Value                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Translation | King James Version (Authorised Version, 1611)                                                              |
| Books       | 66                                                                                                         |
| Chapters    | 1,189                                                                                                      |
| Verses      | 31,102                                                                                                     |
| Size        | 4,918,823 bytes                                                                                            |
| SHA-256     | `e134e19eaf3e162e1e2af5c841aaf17d45ed80c7eaf2e9e1492e843e0129c270`                                         |
| Format      | `{ "book": string, "chapters": [{ "chapter": string, "verses": [{ "verse": string, "text": string }] }] }` |

The SHA-256 is recorded so the file can be anchored: if this digest ever changes, the
change is visible in the diff, and any provenance claim below can be re-verified
against the exact bytes that ship.

## Provenance

**The exact upstream source was not recorded when the file was added.** It arrived with
the initial commit (`9a607e5`) and no import script, source URL, or attribution note was
committed alongside it. Rather than guess at a source, this section records what the
file's own contents prove.

The text is the King James Version. These fingerprints are diagnostic:

| Feature observed in the file                                                | What it indicates                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Mark 15:34 reads "**Eloi**, Eloi, lama sabachthani"                         | The 1611 reading, not the "Eli" of the 1885 Revised Version and most modern reprints        |
| John 19:37 reads "They shall look on him whom they pierced"                 | Present in the Authorised Version                                                           |
| "Zion" appears 153 times, "Sion" 9 times                                    | A **modernised** reprint — the 1611 text uses "Sion" throughout the Psalms, Job, and Isaiah |
| Psalm 1:1 begins directly with "Blessed is the man", with no superscription | A stripped running text, not a Psalter with headings                                        |
| 1,997 typographic apostrophes (`’`), zero typographic double quotes         | Normalised punctuation from a web or API source, not a scanned or typeset original          |
| No italic markers, red-letter markup, footnote numbers, or "Selah" styling  | Plain running text, markup discarded                                                        |

**Conclusion:** this is the King James Version in a modernised American reprint — the
1611 text with modernised spelling and normalised punctuation. It is not a diplomatic
transcription of any particular 1611 printing.

## Licensing

The King James Version is in the **public domain** in the great majority of
jurisdictions, including the United States, the United Kingdom, the European Union, and
Kenya. The KJV was published in 1611; its authors died more than two centuries ago.

Public-domain status is **jurisdiction-specific** and has been contested in a small
number of countries. The authors of this project do not claim copyright in the KJV text.
To the extent any jurisdiction does recognise a copyright in it, that claim is
disclaimed here and the text is included under the terms of the repository's MIT
licence.

## Rules for adding another translation

This file is the only bundled text, and it is the only one that is public domain. Any
other translation **must** carry its own licence and attribution before it is bundled.

1. **Do not add a non-public-domain translation to `data/`** without checking its licence
   first. Most modern translations (NIV, ESV, NASB, NLT, …) are expressly _not_
   redistributable. Bundling one without permission creates a real liability, and the
   npm tarball is a redistribution.
2. **Write a `data/LICENSE-<CODE>` file** next to the data for any translation with
   licence terms, and record the same details in `data/README.md`.
3. **Keep the fingerprint discipline.** Record the SHA-256 of every bundled data file, so
   a future change to the bytes is visible and attributable.
4. **Remote translations are a different path.** The Bolls API (`bolls.life`) serves
   translations at request time and they are never bundled. Nothing downloaded from it
   is redistributed by this project — it is fetched and cached locally under the user's
   own data directory. That distinction is the reason the translation registry can list
   codes the project has no right to redistribute.

## Usage

`data/kjv.json` is read-only at runtime, loaded lazily on first use, and parsed into an
in-memory index by `src/data/kjv.js`. It is never written to. It is excluded from
Prettier formatting (`.prettierignore`) — a generated 4.9 MB file must not be reformatted.
