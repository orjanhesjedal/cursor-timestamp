# Cursor Timestamp

An Obsidian plugin that inserts a precise, timezone-aware date and time stamp exactly where the cursor is. It is built for teams and for AI-assisted work: pin a fixed time zone so collaborators in different places read the same instant, and prepend a name so every note shows who wrote what, and when.

```
2026-06-18 @14:30:07
Comment by Nathan 2026-06-18 @14:30:07 CET:
2026-06-18 @14:30:07 CET Nathan wrote:
```

With a single hotkey, a command, or the ribbon button, it writes the moment in the format you choose: an optional time-zone label, the year, month and day, any text between the date and the time, the time to the second, and leading or trailing text that names who made the entry. A live preview in the settings shows the exact result before you ever use it.

## What sets it apart

Most date-and-time plugins insert the local "now" in a fixed format and stop there. Cursor Timestamp is built around two ideas those tools usually miss.

The first is **shared time**. You can pin a single, fixed time zone for every stamp, so collaborators working from different parts of the world record — and read — the same instant. A note stamped `14:30:07 CET` means the same thing to a reader in Oslo, London or New York. Plugins that only know local time quietly produce ambiguous records the moment more than one person, or more than one machine, is involved.

The second is **authorship and provenance**. The free prefix and suffix turn a timestamp into a complete, human-readable statement of who said something, and when — covering both the `Comment by Nathan …:` and `… Nathan wrote:` layouts.

Underneath, the plugin is deliberately minimal. It loads quickly, carries no runtime dependencies — time zones are resolved by the platform's built-in internationalization engine rather than a heavy date library — and the code is small, strictly type-checked and unit-tested. It is engineered to be simple and error-free.

## Working in Obsidian alongside AI

The plugin's quiet strength shows up when a vault is shared between a person and AI, and especially when agents routinely pull data into Obsidian from many sources on a schedule.

In that setting, agents produce a steady stream of entries of varying freshness and reliability, and the human's role is to review, correct and arbitrate. But a correction is only useful to the next agent if it carries explicit metadata: *who* asserted it and *when*. A timestamped, attributed comment does precisely that — it converts a human note into a first-class, machine-readable signal: "as of this exact instant, this named person asserts this."

That single piece of structure pays off downstream. When a later agent meets new material that contradicts an earlier note, it no longer has to spend tokens reasoning about whether your comment outranks the freshly collected data, or guessing when your correction was made relative to the information it is weighing. It can read the timestamp and the author tag and apply a clear precedence rule — for example, that a recent, human-authored correction holds authority over an automated source it post-dates. Accurate, attributed timestamps are one of several mechanisms that keep a shared human-and-AI knowledge base coherent and reduce unwanted drift.

**Example.** A scheduled agent appends:

```
[ingested] 2026-06-18 09:12:03 UTC — Source: registry export — field "address" = X
```

You review it and, with one hotkey, insert your correction:

```
Comment by Ørjan 2026-06-18 @14:30:07 CET: registry field is unreliable; the primary document gives Y. Treat X as superseded.
```

Days later, a second agent ingests a different source repeating "address = X". Instead of re-opening the question, it sees that a human-authored note, dated after the original ingestion, has already ruled on the matter — so it defers to your correction and flags the new source as conflicting, with no wasted reasoning.

## Install

### Manual

1. In your vault, open `.obsidian/plugins/` and create a folder named `cursor-timestamp`.
2. Copy `main.js`, `manifest.json`, and `styles.css` from the latest release into it.
3. In Obsidian, open **Settings → Community plugins** and enable **Cursor Timestamp**.

### BRAT (automatic updates)

Install the community plugin **BRAT**, run **BRAT: Add a beta plugin for testing**, and paste this repository's address. BRAT installs it and keeps it updated whenever a new release is published.

## Usage

Place the cursor, then click the clock ribbon icon or run **Insert timestamp at cursor** from the command palette (or your assigned hotkey). The stamp is inserted at the cursor; a selection is replaced. There are also **Insert date** and **Insert time** commands for quick partial stamps. Assign keyboard shortcuts under **Settings → Hotkeys**.

## Settings

| Setting | What it does |
| --- | --- |
| Time zone | `System default`, or a fixed IANA zone shared by the team. |
| Date format | Token string, default `YYYY-MM-DD`. |
| Time format | Token string, default `HH:mm:ss`. |
| Between date and time | Text between the two, default ` @`. |
| Show time zone | Adds a `CET` / `GMT+2` label. |
| Label style / position / separator | How and where the label is shown. |
| Prefix | Text before the stamp, e.g. `Comment by Nathan `. |
| Suffix | Text after the stamp, e.g. `:` or ` Nathan wrote:`. |
| Bold / Italic / Coloured text / Colour | Styling of the inserted text. |

### Format tokens

Date: `YYYY` `YY` `MM` `M` `DD` `D` `MMMM` `MMM` `dddd` `ddd`
Time: `HH` `H` `hh` `h` `mm` `m` `ss` `s` `A` `a`

Letters that should stay literal can be wrapped in square brackets, e.g. `[week] w`.

## Build from source

Requires Node.js 18 or newer.

```bash
npm install
npm run build      # type-checks, then writes main.js
npm test           # runs the timestamp unit tests
```

Use `npm run dev` to rebuild on save.

## Releasing a new version

```bash
npm version patch   # updates manifest.json + versions.json and commits
git push
```

Pushing to `main` triggers the GitHub Actions workflow, which builds the plugin and publishes a release with `main.js`, `manifest.json`, and `styles.css` attached. BRAT users then update automatically.

## License

MIT © Ørjan Hesjedal
